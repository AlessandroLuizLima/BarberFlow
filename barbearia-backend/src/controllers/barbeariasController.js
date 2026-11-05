const { Barbearia } = require('../models');
const { responderErroInterno } = require('../middlewares/seguranca');
const { paraResposta, somentePublico, completarCoordenadasEmSegundoPlano } = require('./configuracoesController');

// GET /barbearias - barbearias com assinatura ativa, para o cliente escolher (dados públicos)
exports.listarBarbearias = async (req, res) => {
  try {
    const todas = await Barbearia.findAll({ where: { status: 'ativa' }, order: [['nome', 'ASC']] });
    const ativas = todas.filter((b) => b.estaAtiva());
    ativas.forEach(completarCoordenadasEmSegundoPlano);
    res.status(200).json(ativas.map((b) => somentePublico(paraResposta(b))));
  } catch (error) {
    responderErroInterno(res, error);
  }
};

// GET /barbearias/:id - dados públicos de uma barbearia
exports.obterBarbearia = async (req, res) => {
  try {
    const barbearia = await Barbearia.findByPk(req.params.id);
    if (!barbearia || !barbearia.estaAtiva()) return res.status(404).json({ error: 'Barbearia não encontrada' });
    res.status(200).json(somentePublico(paraResposta(barbearia)));
  } catch (error) {
    responderErroInterno(res, error);
  }
};
