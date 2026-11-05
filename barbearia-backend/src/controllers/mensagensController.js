const { Mensagem, Cliente } = require('../models');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno } = require('../middlewares/seguranca');

const TIPOS = ['confirmacao', 'lembrete', 'lista_espera', 'remarcacao', 'cancelamento'];

// READ - Histórico de mensagens (confirmações, lembretes, avisos de lista de espera)
exports.listarMensagens = async (req, res) => {
  try {
    const { cliente_id, tipo } = req.query;
    const where = {};
    // Cliente vê só as próprias mensagens
    if (!ehBarbeiro(req)) where.cliente_id = req.usuario.id;
    else {
      // Barbeiro: só as mensagens que a barbearia dele enviou
      where.barbearia_id = req.usuario.barbearia_id;
      if (Number.isInteger(Number(cliente_id)) && Number(cliente_id) > 0) where.cliente_id = Number(cliente_id);
    }
    if (TIPOS.includes(tipo)) where.tipo = tipo;

    const mensagens = await Mensagem.findAll({
      where,
      include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'nome_completo', 'email'] }],
      order: [['enviada_em', 'DESC']],
      limit: 500
    });
    res.status(200).json(mensagens);
  } catch (error) {
    responderErroInterno(res, error);
  }
};
