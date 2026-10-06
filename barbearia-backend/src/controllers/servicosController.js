const { Servico } = require('../models');

exports.criarServico = async (req, res) => {
  try {
    const { nome, descricao, duracao_minutos, preco } = req.body;
    const servico = await Servico.create({ nome, descricao, duracao_minutos, preco });
    res.status(201).json({ message: `Serviço ${servico.nome} cadastrado com sucesso!`, servico });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarServicos = async (req, res) => {
  try {
    const servicos = await Servico.findAll();
    res.status(200).json(servicos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.buscarServicoPorId = async (req, res) => {
  try {
    const servico = await Servico.findByPk(req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    res.status(200).json(servico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.atualizarServico = async (req, res) => {
  try {
    const servico = await Servico.findByPk(req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    const { nome, descricao, duracao_minutos, preco, ativo } = req.body;
    await servico.update({ nome, descricao, duracao_minutos, preco, ativo });
    res.status(200).json({ message: `Serviço ${servico.nome} atualizado com sucesso!`, servico });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletarServico = async (req, res) => {
  try {
    const servico = await Servico.findByPk(req.params.id);
    if (!servico) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    await servico.destroy();
    res.status(200).json({ message: `Serviço ${servico.nome} deletado com sucesso!` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
