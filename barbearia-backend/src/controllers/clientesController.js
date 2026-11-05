const { sequelize, Cliente } = require('../models');
const { buscarEnderecoPorCep } = require('../services/viaCepService');
const { geocodificarEndereco } = require('../services/geocodingService');
const imagemService = require('../services/imagemService');

// Formato devolvido pela API: sem a senha, com a URL da foto e coordenadas como número
function serializarCliente(cliente) {
  const { senha: _senha, ...dados } = cliente.toJSON();
  return {
    ...dados,
    latitude: dados.latitude === null || dados.latitude === undefined ? null : Number(dados.latitude),
    longitude: dados.longitude === null || dados.longitude === undefined ? null : Number(dados.longitude),
    foto_url: imagemService.urlDaImagem(dados.foto_id)
  };
}

// Calcula as coordenadas do endereço do cliente sem atrasar a resposta da API.
// Elas servem de plano B para achar a barbearia mais próxima quando o navegador não libera a localização.
function atualizarCoordenadasEmSegundoPlano(cliente) {
  const endereco = {
    rua: cliente.logradouro,
    numero: cliente.numero,
    cidade: cliente.cidade,
    uf: cliente.uf,
    cep: cliente.cep
  };
  geocodificarEndereco(endereco)
    .then((coordenadas) =>
      Cliente.update(
        { latitude: coordenadas?.latitude ?? null, longitude: coordenadas?.longitude ?? null },
        { where: { id: cliente.id }, hooks: false }
      )
    )
    .catch((error) => console.warn(`[geocoding] cliente ${cliente.id}: ${error.message}`));
}

// Monta os campos de endereço a partir do CEP, se informado.
// Se a consulta ao ViaCEP falhar, o cadastro segue sem travar (endereço fica em branco).
async function resolverEndereco(cep) {
  if (!cep) return {};
  try {
    const endereco = await buscarEnderecoPorCep(cep);
    return {
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf
    };
  } catch (error) {
    console.warn(`[ViaCEP] Não foi possível resolver o CEP ${cep}: ${error.message}`);
    return { cep };
  }
}

// CREATE - Criar cliente (endereço é completado automaticamente via ViaCEP)
exports.criarCliente = async (req, res) => {
  try {
    const { nome_completo, email, telefone, senha, cep, numero, complemento } = req.body;

    const enderecoResolvido = await resolverEndereco(cep);

    const cliente = await Cliente.create({
      nome_completo,
      email,
      telefone,
      senha,
      numero,
      complemento,
      ...enderecoResolvido
    });

    if (cliente.cep || cliente.cidade) atualizarCoordenadasEmSegundoPlano(cliente);

    res.status(201).json({
      message: `Cliente ${cliente.nome_completo} cadastrado com sucesso!`,
      cliente: serializarCliente(cliente)
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

// READ - Listar todos os clientes
exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({ order: [['nome_completo', 'ASC']] });
    res.status(200).json(clientes.map(serializarCliente));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Buscar cliente por ID
exports.buscarClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.status(200).json(serializarCliente(cliente));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Atualizar cliente (se o CEP mudar, endereço é recalculado via ViaCEP)
exports.atualizarCliente = async (req, res) => {
  try {
    const { nome_completo, email, telefone, senha, cep, numero, complemento } = req.body;

    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const numeroAnterior = cliente.numero;
    let enderecoResolvido = {};
    if (cep && cep !== cliente.cep) {
      enderecoResolvido = await resolverEndereco(cep);
    }

    const camposBrutos = { nome_completo, email, telefone, numero, complemento, ...enderecoResolvido };
    // Remove campos não enviados para não sobrescrever dados existentes com undefined
    const camposParaAtualizar = Object.fromEntries(
      Object.entries(camposBrutos).filter(([, valor]) => valor !== undefined)
    );
    // Senha só é alterada se o cliente enviou uma nova
    if (senha) {
      camposParaAtualizar.senha = senha;
    }

    await cliente.update(camposParaAtualizar);

    // Endereço mudou (CEP ou número) ou ainda não tem coordenadas: recalcula
    const enderecoMudou = enderecoResolvido.cep || (numero !== undefined && numero !== numeroAnterior);
    if (enderecoMudou || (cliente.latitude === null && cliente.cep)) {
      atualizarCoordenadasEmSegundoPlano(cliente);
    }

    res.status(200).json({
      message: `Cliente ${cliente.nome_completo} atualizado com sucesso!`,
      cliente: serializarCliente(cliente)
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Deletar cliente
exports.deletarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const fotoId = cliente.foto_id;
    await sequelize.transaction(async (transaction) => {
      await cliente.destroy({ transaction });
      await imagemService.removerImagem(fotoId, { transaction });
    });

    res.status(200).json({ message: `Cliente ${cliente.nome_completo} deletado com sucesso!` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'Este cliente possui agendamentos e não pode ser excluído.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// AUTH - Login do cliente (compara senha com o hash salvo)
exports.loginCliente = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const cliente = await Cliente.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (!cliente) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await cliente.verificarSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    res.status(200).json({ message: 'Login realizado com sucesso!', cliente: serializarCliente(cliente) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UTIL - Consultar endereço por CEP (usado pelo formulário de cadastro no frontend
// para preencher o endereço em tempo real antes mesmo de salvar o cliente)
exports.consultarCep = async (req, res) => {
  try {
    const endereco = await buscarEnderecoPorCep(req.params.cep);
    res.status(200).json(endereco);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// UPDATE - Troca a foto de perfil. Corpo: { imagem: "data:image/...;base64,..." }
// A foto antiga é apagada da tabela imagens na mesma transação.
exports.atualizarFoto = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado' });

    const fotoAntiga = cliente.foto_id;
    await sequelize.transaction(async (transaction) => {
      const novaFoto = await imagemService.salvarImagem(req.body?.imagem, { transaction });
      await cliente.update({ foto_id: novaFoto }, { transaction });
      await imagemService.removerImagem(fotoAntiga, { transaction });
    });

    res.status(200).json({ message: 'Foto atualizada com sucesso!', cliente: serializarCliente(cliente) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// DELETE - Remove a foto de perfil
exports.removerFoto = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado' });

    const fotoAntiga = cliente.foto_id;
    await sequelize.transaction(async (transaction) => {
      await cliente.update({ foto_id: null }, { transaction });
      await imagemService.removerImagem(fotoAntiga, { transaction });
    });

    res.status(200).json({ message: 'Foto removida.', cliente: serializarCliente(cliente) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
