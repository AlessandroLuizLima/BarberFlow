const { Profissional } = require('../models');

exports.criarProfissional = async (req, res) => {
  try {
    const { nome_completo, email, telefone, especialidade } = req.body;
    const profissional = await Profissional.create({ nome_completo, email, telefone, especialidade });
    res.status(201).json({ message: `Profissional ${profissional.nome_completo} cadastrado com sucesso!`, profissional });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.listarProfissionais = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll();
    res.status(200).json(profissionais);
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
    res.status(200).json(profissional);
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
    res.status(200).json({ message: `Profissional ${profissional.nome_completo} atualizado com sucesso!`, profissional });
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
    await profissional.destroy();
    res.status(200).json({ message: `Profissional ${profissional.nome_completo} deletado com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
