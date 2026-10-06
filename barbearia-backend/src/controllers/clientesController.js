const { Cliente } = require('../models');
const { buscarEnderecoPorCep } = require('../services/viaCepService');

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

    const { senha: _senha, ...clienteSemSenha } = cliente.toJSON();

    res.status(201).json({
      message: `Cliente ${cliente.nome_completo} cadastrado com sucesso!`,
      cliente: clienteSemSenha
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
    const clientes = await Cliente.findAll({
      attributes: { exclude: ['senha'] }
    });
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Buscar cliente por ID
exports.buscarClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      attributes: { exclude: ['senha'] }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.status(200).json(cliente);
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

    const { senha: _senha, ...clienteAtualizado } = cliente.toJSON();

    res.status(200).json({
      message: `Cliente ${clienteAtualizado.nome_completo} atualizado com sucesso!`,
      cliente: clienteAtualizado
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

    await cliente.destroy();

    res.status(200).json({ message: `Cliente ${cliente.nome_completo} deletado com sucesso!` });
  } catch (error) {
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

    const cliente = await Cliente.findOne({ where: { email } });
    if (!cliente) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await cliente.verificarSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const { senha: _senha, ...clienteSemSenha } = cliente.toJSON();
    res.status(200).json({ message: 'Login realizado com sucesso!', cliente: clienteSemSenha });
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
