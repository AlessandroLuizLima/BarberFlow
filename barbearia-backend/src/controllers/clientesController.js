const bcrypt = require('bcryptjs');
const { sequelize, Cliente, Agendamento } = require('../models');
const { buscarEnderecoPorCep } = require('../services/viaCepService');
const { geocodificarEndereco } = require('../services/geocodingService');
const imagemService = require('../services/imagemService');
const { gerarToken, ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno, respostaDeValidacao } = require('../middlewares/seguranca');
const { validarSenha } = require('../utils/senha');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (valor, max) => (typeof valor === 'string' ? valor.trim().slice(0, max) : undefined);

// Hash qualquer para o login levar o mesmo tempo com ou sem conta (evita descobrir emails cadastrados)
const HASH_FALSO = '$2b$10$e5teNY9/JA4SmK60ELNJWu2GRqOBXDVloHgHt/BjcQ63KRw2cWoyi';

function responderErro(res, error) {
  const validacao = respostaDeValidacao(error);
  if (validacao) return res.status(400).json({ error: validacao });
  if (error?.status === 400) return res.status(400).json({ error: error.message });
  return responderErroInterno(res, error);
}

// Formato devolvido pela API: sem a senha, com a URL da foto e coordenadas como número
function serializarCliente(cliente) {
  const { senha: _senha, token_versao: _versao, ...dados } = cliente.toJSON();
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

// Cidades pequenas têm um CEP único (ex.: 84635-000): o ViaCEP devolve cidade/UF mas sem rua e bairro.
// Nesses casos vale o que o cliente digitou.
function completarComDigitado(enderecoResolvido, { logradouro, bairro }) {
  const limpo = (v) => (typeof v === 'string' ? v.trim().slice(0, 150) : undefined);
  const resultado = { ...enderecoResolvido };
  if (!resultado.logradouro && limpo(logradouro) !== undefined) resultado.logradouro = limpo(logradouro);
  if (!resultado.bairro && limpo(bairro) !== undefined) resultado.bairro = limpo(bairro).slice(0, 100);
  return resultado;
}

// Endereço atual veio de um CEP geral? (ViaCEP não trouxe rua: o que está salvo foi digitado)
const isCepGeral = (cliente) => /000$/.test(String(cliente.cep || '').replace(/\D/g, ''));

// CREATE - Criar cliente (endereço é completado automaticamente via ViaCEP)
exports.criarCliente = async (req, res) => {
  try {
    const corpo = req.body || {};
    const nome_completo = texto(corpo.nome_completo, 100);
    const email = texto(corpo.email, 100)?.toLowerCase();
    const telefone = texto(corpo.telefone, 20) || null;
    const { senha } = corpo;
    const cep = texto(corpo.cep, 9);
    const numero = texto(corpo.numero, 20);
    const complemento = texto(corpo.complemento, 100);

    if (!nome_completo || nome_completo.length < 3) return res.status(400).json({ error: 'Informe o nome completo.' });
    if (!email || !REGEX_EMAIL.test(email)) return res.status(400).json({ error: 'Email inválido.' });
    const erroSenha = validarSenha(senha);
    if (erroSenha) return res.status(400).json({ error: erroSenha });

    const enderecoResolvido = completarComDigitado(await resolverEndereco(cep), corpo);

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
    responderErro(res, error);
  }
};

// Clientes que já agendaram na barbearia do barbeiro (os outros clientes da plataforma não aparecem)
async function idsDeClientesDaBarbearia(barbeariaId) {
  const linhas = await Agendamento.findAll({
    where: { barbearia_id: barbeariaId },
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('cliente_id')), 'cliente_id']],
    raw: true
  });
  return linhas.map((l) => l.cliente_id);
}

// READ - Listar os clientes da barbearia (barbeiro)
exports.listarClientes = async (req, res) => {
  try {
    const ids = await idsDeClientesDaBarbearia(req.usuario.barbearia_id);
    const clientes = ids.length ? await Cliente.findAll({ where: { id: ids }, order: [['nome_completo', 'ASC']] }) : [];
    res.status(200).json(clientes.map(serializarCliente));
  } catch (error) {
    responderErro(res, error);
  }
};

// READ - Buscar cliente por ID (o próprio cliente, ou o barbeiro se o cliente já agendou na barbearia dele)
exports.buscarClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    const semVinculo = cliente && ehBarbeiro(req) &&
      !(await Agendamento.count({ where: { cliente_id: cliente.id, barbearia_id: req.usuario.barbearia_id } }));

    if (!cliente || semVinculo) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.status(200).json(serializarCliente(cliente));
  } catch (error) {
    responderErro(res, error);
  }
};

// UPDATE - Atualizar cliente (se o CEP mudar, endereço é recalculado via ViaCEP)
exports.atualizarCliente = async (req, res) => {
  try {
    const corpo = req.body || {};
    const nome_completo = texto(corpo.nome_completo, 100);
    const email = texto(corpo.email, 100)?.toLowerCase();
    const telefone = texto(corpo.telefone, 20);
    const cep = texto(corpo.cep, 9);
    const numero = texto(corpo.numero, 20);
    const complemento = texto(corpo.complemento, 100);
    const { senha, senha_atual } = corpo;

    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    if (nome_completo !== undefined && nome_completo.length < 3) return res.status(400).json({ error: 'Informe o nome completo.' });
    if (email !== undefined && !REGEX_EMAIL.test(email)) return res.status(400).json({ error: 'Email inválido.' });

    // Trocar senha ou email exige a senha atual, e só o próprio cliente pode fazer isso
    // (impede que alguém com a sessão aberta, ou o barbeiro, tome a conta)
    const trocandoEmail = email !== undefined && email !== cliente.email;
    if (senha || trocandoEmail) {
      if (ehBarbeiro(req)) return res.status(403).json({ error: 'Só o próprio cliente pode alterar email e senha.' });
      if (!(await cliente.verificarSenha(senha_atual))) {
        return res.status(400).json({ error: 'Informe sua senha atual para alterar email ou senha.' });
      }
    }
    if (senha) {
      const erroSenha = validarSenha(senha);
      if (erroSenha) return res.status(400).json({ error: erroSenha });
    }

    const numeroAnterior = cliente.numero;
    let enderecoResolvido = {};
    const cepNovo = cep && String(cep).replace(/\D/g, '') !== String(cliente.cep || '').replace(/\D/g, '');
    if (cepNovo) {
      enderecoResolvido = await resolverEndereco(cep);
    }
    // Rua e bairro digitados só valem quando o CEP não traz essas informações (CEP geral da cidade)
    const cepSemRua = cepNovo ? !enderecoResolvido.logradouro : (isCepGeral(cliente) || !cliente.logradouro);
    if (cepSemRua) enderecoResolvido = completarComDigitado(enderecoResolvido, corpo);
    const logradouroAnterior = cliente.logradouro;

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
    const enderecoMudou = Boolean(enderecoResolvido.cep) ||
      (numero !== undefined && numero !== numeroAnterior) ||
      cliente.logradouro !== logradouroAnterior;
    if (enderecoMudou || (cliente.latitude === null && cliente.cep)) {
      atualizarCoordenadasEmSegundoPlano(cliente);
    }

    res.status(200).json({
      message: `Cliente ${cliente.nome_completo} atualizado com sucesso!`,
      cliente: serializarCliente(cliente),
      // Trocar a senha derruba as sessões antigas; o próprio cliente recebe um token novo
      ...(senha ? { token: gerarToken(cliente, 'cliente') } : {})
    });
  } catch (error) {
    responderErro(res, error);
  }
};

// DELETE - Deletar cliente
exports.deletarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    if (!ehBarbeiro(req) && !(await cliente.verificarSenha(req.body?.senha_atual))) {
      return res.status(400).json({ error: 'Informe sua senha para excluir a conta.' });
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
    responderErro(res, error);
  }
};

// AUTH - Login do cliente (compara senha com o hash salvo)
exports.loginCliente = async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const senha = String(req.body?.senha ?? '');

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const cliente = await Cliente.findOne({ where: { email } });
    const senhaValida = cliente ? await cliente.verificarSenha(senha) : await bcrypt.compare(senha, HASH_FALSO);
    if (!cliente || !senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: gerarToken(cliente, 'cliente'),
      cliente: serializarCliente(cliente)
    });
  } catch (error) {
    responderErro(res, error);
  }
};

// UTIL - Consultar endereço por CEP (usado pelo formulário de cadastro no frontend
// para preencher o endereço em tempo real antes mesmo de salvar o cliente)
exports.consultarCep = async (req, res) => {
  try {
    const endereco = await buscarEnderecoPorCep(req.params.cep);
    res.status(200).json(endereco);
  } catch (error) {
    const conhecido = /CEP/.test(error.message);
    res.status(conhecido ? 400 : 502).json({ error: conhecido ? error.message : 'Não foi possível consultar o CEP agora.' });
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
    responderErro(res, error);
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
    responderErro(res, error);
  }
};
