const { sequelize, Profissional } = require('../models');
const imagemService = require('../services/imagemService');

// Formato devolvido pela API: inclui a URL da foto
const serializar = (profissional) => {
  const dados = profissional.toJSON();
  return { ...dados, foto_url: imagemService.urlDaImagem(dados.foto_id) };
};

exports.criarProfissional = async (req, res) => {
  try {
    const { nome_completo, email, telefone, especialidade } = req.body;
    const profissional = await Profissional.create({ nome_completo, email, telefone, especialidade });
    res.status(201).json({ message: `Profissional ${profissional.nome_completo} cadastrado com sucesso!`, profissional: serializar(profissional) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.listarProfissionais = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll({ order: [['nome_completo', 'ASC']] });
    res.status(200).json(profissionais.map(serializar));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.buscarProfissionalPorId = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }
    res.status(200).json(serializar(profissional));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.atualizarProfissional = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      return res.status(404).json({ message: 'Profissional não encontrado' });
    }
    const { nome_completo, email, telefone, especialidade, ativo } = req.body;
    await profissional.update({ nome_completo, email, telefone, especialidade, ativo });
    res.status(200).json({ message: `Profissional ${profissional.nome_completo} atualizado com sucesso!`, profissional: serializar(profissional) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(error.status || 500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};
