const { Mensagem, Cliente } = require('../models');

// READ - Histórico de mensagens (confirmações, lembretes, avisos de lista de espera)
exports.listarMensagens = async (req, res) => {
  try {
    const { cliente_id, tipo } = req.query;
    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (tipo) where.tipo = tipo;

    const mensagens = await Mensagem.findAll({
      where,
      include: [{ model: Cliente, as: 'cliente', attributes: { exclude: ['senha'] } }],
      order: [['enviada_em', 'DESC']]
    });
    res.status(200).json(mensagens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
