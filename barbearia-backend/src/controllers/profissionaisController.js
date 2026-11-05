const { sequelize, Profissional } = require('../models');
const imagemService = require('../services/imagemService');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno, respostaDeValidacao } = require('../middlewares/seguranca');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Formato devolvido pela API: inclui a URL da foto
const serializar = (profissional) => {
  const dados = profissional.toJSON();
  return { ...dados, foto_url: imagemService.urlDaImagem(dados.foto_id) };
};

// Para clientes e visitantes: sem email e telefone do profissional
const serializarPublico = (profissional) => {
  const { id, nome_completo, especialidade, ativo, foto_url } = serializar(profissional);
  return { id, nome_completo, especialidade, ativo, foto_url };
};

const responderErro = (res, error) => {
  const validacao = respostaDeValidacao(error);
  if (validacao) return res.status(400).json({ error: validacao });
  if (error?.status === 400) return res.status(400).json({ error: error.message });
  return responderErroInterno(res, error);
};

// Só os campos editáveis, com tipo e tamanho conferidos
function lerProfissional(corpo = {}, parcial = false) {
  const dados = {};
  const texto = (v) => String(v ?? '').trim();
  if (corpo.nome_completo !== undefined || !parcial) {
    const nome = texto(corpo.nome_completo);
    if (nome.length < 3 || nome.length > 100) return { erro: 'Informe o nome completo (até 100 caracteres).' };
    dados.nome_completo = nome;
  }
  if (corpo.email !== undefined || !parcial) {
    const email = texto(corpo.email).toLowerCase();
    if (!REGEX_EMAIL.test(email) || email.length > 100) return { erro: 'Email inválido.' };
    dados.email = email;
  }
  if (corpo.telefone !== undefined) {
    const telefone = texto(corpo.telefone);
    if (telefone.length > 20) return { erro: 'Telefone inválido.' };
    dados.telefone = telefone || null;
  }
  if (corpo.especialidade !== undefined) {
    const especialidade = texto(corpo.especialidade);
    if (especialidade.length > 100) return { erro: 'Especialidade muito longa.' };
    dados.especialidade = especialidade || null;
  }
  if (corpo.ativo !== undefined) dados.ativo = Boolean(corpo.ativo);
  return { dados };
}

exports.criarProfissional = async (req, res) => {
  try {
    const { dados, erro } = lerProfissional(req.body);
    if (erro) return res.status(400).json({ error: erro });
    const profissional = await Profissional.create(dados);
    res.status(201).json({ message: `Profissional ${profissional.nome_completo} cadastrado com sucesso!`, profissional: serializar(profissional) });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.listarProfissionais = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll({ order: [['nome_completo', 'ASC']] });
    res.status(200).json(profissionais.map(ehBarbeiro(req) ? serializar : serializarPublico));
  } catch (error) {
    responderErro(res, error);
  }
};

exports.buscarProfissionalPorId = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }
    res.status(200).json(ehBarbeiro(req) ? serializar(profissional) : serializarPublico(profissional));
  } catch (error) {
    responderErro(res, error);
  }
};

exports.atualizarProfissional = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }
    const { dados, erro } = lerProfissional(req.body, true);
    if (erro) return res.status(400).json({ error: erro });
    await profissional.update(dados);
    res.status(200).json({ message: `Profissional ${profissional.nome_completo} atualizado com sucesso!`, profissional: serializar(profissional) });
  } catch (error) {
    responderErro(res, error);
  }
};

exports.deletarProfissional = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }
    const fotoId = profissional.foto_id;
    await sequelize.transaction(async (transaction) => {
      await profissional.destroy({ transaction });
      await imagemService.removerImagem(fotoId, { transaction });
    });
    res.status(200).json({ message: `Profissional ${profissional.nome_completo} deletado com sucesso!` });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'Este profissional possui agendamentos. Desative-o em vez de excluir.' });
    }
    responderErro(res, error);
  }
};

// UPDATE - Troca a foto do profissional. Corpo: { imagem: "data:image/...;base64,..." }
exports.atualizarFoto = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) return res.status(404).json({ message: 'Profissional não encontrado' });

    const fotoAntiga = profissional.foto_id;
    await sequelize.transaction(async (transaction) => {
      const novaFoto = await imagemService.salvarImagem(req.body?.imagem, { transaction });
      await profissional.update({ foto_id: novaFoto }, { transaction });
      await imagemService.removerImagem(fotoAntiga, { transaction });
    });

    res.status(200).json({ message: 'Foto atualizada com sucesso!', profissional: serializar(profissional) });
  } catch (error) {
    responderErro(res, error);
  }
};

// DELETE - Remove a foto do profissional
exports.removerFoto = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) return res.status(404).json({ message: 'Profissional não encontrado' });

    const fotoAntiga = profissional.foto_id;
    await sequelize.transaction(async (transaction) => {
      await profissional.update({ foto_id: null }, { transaction });
      await imagemService.removerImagem(fotoAntiga, { transaction });
    });

    res.status(200).json({ message: 'Foto removida.', profissional: serializar(profissional) });
  } catch (error) {
    responderErro(res, error);
  }
};
