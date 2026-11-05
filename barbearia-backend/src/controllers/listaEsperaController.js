const { ListaEspera, Cliente, Profissional, Servico } = require('../models');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno } = require('../middlewares/seguranca');

const includePadrao = [
  { model: Cliente, as: 'cliente', attributes: ['id', 'nome_completo', 'email', 'telefone'] },
  { model: Profissional, as: 'profissional', attributes: ['id', 'nome_completo', 'especialidade'] },
  { model: Servico, as: 'servico' }
];

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;
const REGEX_DIA = /^\d{4}-\d{2}-\d{2}$/;

// CREATE - Cliente entra na lista de espera de um profissional/serviço para um dia desejado
exports.entrarNaListaDeEspera = async (req, res) => {
  try {
    const { profissional_id, servico_id, data_desejada } = req.body || {};
    // O cliente entra na fila como ele mesmo; o barbeiro pode incluir um cliente
    const cliente_id = ehBarbeiro(req) ? req.body?.cliente_id : req.usuario.id;

    if (!cliente_id || !profissional_id || !servico_id || !data_desejada) {
      return res.status(400).json({ error: 'profissional_id, servico_id e data_desejada são obrigatórios' });
    }
    if (![cliente_id, profissional_id, servico_id].every(idValido) || !REGEX_DIA.test(String(data_desejada))) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    if (new Date(`${data_desejada}T23:59:59-03:00`) < new Date()) {
      return res.status(400).json({ error: 'Escolha uma data a partir de hoje' });
    }

    const jaNaFila = await ListaEspera.findOne({
      where: { cliente_id, profissional_id, servico_id, data_desejada, status: 'aguardando' }
    });
    if (jaNaFila) return res.status(409).json({ error: 'Você já está na lista de espera deste dia.' });

    const [cliente, profissional, servico] = await Promise.all([
      Cliente.findByPk(cliente_id),
      Profissional.findByPk(profissional_id),
      Servico.findByPk(servico_id)
    ]);

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!profissional) return res.status(404).json({ error: 'Profissional não encontrado' });
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

    const entrada = await ListaEspera.create({ cliente_id, profissional_id, servico_id, data_desejada });

    res.status(201).json({ message: 'Você entrou na lista de espera!', listaEspera: entrada });
  } catch (error) {
    responderErroInterno(res, error);
  }
};

// READ - Listar entradas da lista de espera (filtros opcionais)
exports.listarListaDeEspera = async (req, res) => {
  try {
    const { cliente_id, profissional_id, status } = req.query;
    const where = {};
    if (!ehBarbeiro(req)) where.cliente_id = req.usuario.id;
    else if (idValido(cliente_id)) where.cliente_id = Number(cliente_id);
    if (idValido(profissional_id)) where.profissional_id = Number(profissional_id);
    if (['aguardando', 'notificado', 'expirado'].includes(status)) where.status = status;

    const entradas = await ListaEspera.findAll({ where, include: includePadrao, order: [['id', 'ASC']] });
    res.status(200).json(entradas);
  } catch (error) {
    responderErroInterno(res, error);
  }
};

// DELETE - Sair da lista de espera
exports.sairDaListaDeEspera = async (req, res) => {
  try {
    const entrada = await ListaEspera.findByPk(req.params.id);
    if (!entrada || (!ehBarbeiro(req) && entrada.cliente_id !== req.usuario.id)) {
      return res.status(404).json({ message: 'Registro não encontrado na lista de espera' });
    }
    await entrada.destroy();
    res.status(200).json({ message: 'Removido da lista de espera com sucesso!' });
  } catch (error) {
    responderErroInterno(res, error);
  }
};
