const { Op } = require('sequelize');
const { Agendamento, Cliente, Profissional, Servico, ListaEspera } = require('../models');
const notificacaoService = require('../services/notificacaoService');

const includePadrao = [
  { model: Cliente, as: 'cliente', attributes: { exclude: ['senha'] } },
  { model: Profissional, as: 'profissional' },
  { model: Servico, as: 'servico' }
];

// Verifica se o profissional já possui agendamento que colide com o horário desejado,
// considerando a duração do serviço de cada agendamento.
async function existeConflitoDeHorario({ profissional_id, data_hora, duracao_minutos, agendamentoIdIgnorado = null }) {
  const inicioNovo = new Date(data_hora);
  const fimNovo = new Date(inicioNovo.getTime() + duracao_minutos * 60000);

  const inicioDoDia = new Date(inicioNovo);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(inicioNovo);
  fimDoDia.setHours(23, 59, 59, 999);

  const agendamentosDoDia = await Agendamento.findAll({
    where: {
      profissional_id,
      status: { [Op.in]: ['agendado', 'confirmado'] },
      data_hora: { [Op.between]: [inicioDoDia, fimDoDia] },
      ...(agendamentoIdIgnorado ? { id: { [Op.ne]: agendamentoIdIgnorado } } : {})
    },
    include: [{ model: Servico, as: 'servico' }]
  });

  return agendamentosDoDia.some((agendamento) => {
    const inicioExistente = new Date(agendamento.data_hora);
    const fimExistente = new Date(inicioExistente.getTime() + agendamento.servico.duracao_minutos * 60000);
    return inicioNovo < fimExistente && fimNovo > inicioExistente;
  });
}

// CREATE - Criar agendamento
// Regras: verifica conflito de horário para o profissional e, se estiver livre,
// cria o agendamento e dispara a mensagem de confirmação imediata.
exports.criarAgendamento = async (req, res) => {
  try {
    const { cliente_id, profissional_id, servico_id, data_hora } = req.body;

    if (!cliente_id || !profissional_id || !servico_id || !data_hora) {
      return res.status(400).json({ error: 'cliente_id, profissional_id, servico_id e data_hora são obrigatórios' });
    }

    const [cliente, profissional, servico] = await Promise.all([
      Cliente.findByPk(cliente_id),
      Profissional.findByPk(profissional_id),
      Servico.findByPk(servico_id)
    ]);

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (!profissional) return res.status(404).json({ error: 'Profissional não encontrado' });
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

    const dataAgendamento = new Date(data_hora);
    if (isNaN(dataAgendamento.getTime())) {
      return res.status(400).json({ error: 'data_hora inválida' });
    }
    if (dataAgendamento < new Date()) {
      return res.status(400).json({ error: 'Não é possível agendar em uma data no passado' });
    }

    const conflito = await existeConflitoDeHorario({
      profissional_id,
      data_hora: dataAgendamento,
      duracao_minutos: servico.duracao_minutos
    });

    if (conflito) {
      return res.status(409).json({
        error: 'Horário indisponível para este profissional. Você pode entrar na lista de espera.'
      });
    }

    const agendamento = await Agendamento.create({
      cliente_id,
      profissional_id,
      servico_id,
      data_hora: dataAgendamento,
      status: 'confirmado'
    });

    await notificacaoService.enviarConfirmacao(agendamento);

    const agendamentoCompleto = await Agendamento.findByPk(agendamento.id, { include: includePadrao });

    res.status(201).json({
      message: 'Agendamento criado e confirmado com sucesso!',
      agendamento: agendamentoCompleto
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Listar agendamentos (filtros opcionais por cliente_id ou profissional_id via query string)
exports.listarAgendamentos = async (req, res) => {
  try {
    const { cliente_id, profissional_id, status } = req.query;
    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (profissional_id) where.profissional_id = profissional_id;
    if (status) where.status = status;

    const agendamentos = await Agendamento.findAll({
      where,
      include: includePadrao,
      order: [['data_hora', 'ASC']]
    });
    res.status(200).json(agendamentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ - Buscar agendamento por ID
exports.buscarAgendamentoPorId = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, { include: includePadrao });
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    res.status(200).json(agendamento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Reagendar (alterar data/hora ou profissional), reverificando conflito
exports.atualizarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, { include: [{ model: Servico, as: 'servico' }] });
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    const { data_hora, profissional_id } = req.body;
    const novoProfissionalId = profissional_id || agendamento.profissional_id;
    const novaData = data_hora ? new Date(data_hora) : agendamento.data_hora;

    const conflito = await existeConflitoDeHorario({
      profissional_id: novoProfissionalId,
      data_hora: novaData,
      duracao_minutos: agendamento.servico.duracao_minutos,
      agendamentoIdIgnorado: agendamento.id
    });

    if (conflito) {
      return res.status(409).json({ error: 'Horário indisponível para este profissional.' });
    }

    await agendamento.update({
      data_hora: novaData,
      profissional_id: novoProfissionalId,
      lembrete_enviado: false
    });

    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, { include: includePadrao });
    res.status(200).json({ message: 'Agendamento atualizado com sucesso!', agendamento: agendamentoAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE/CANCEL - Cancela o agendamento e avisa o próximo da lista de espera, se houver
exports.cancelarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    await agendamento.update({ status: 'cancelado' });

    const dataDoAgendamento = agendamento.data_hora.toISOString().slice(0, 10);

    const proximoDaFila = await ListaEspera.findOne({
      where: {
        profissional_id: agendamento.profissional_id,
        servico_id: agendamento.servico_id,
        data_desejada: dataDoAgendamento,
        status: 'aguardando'
      },
      order: [['id', 'ASC']]
    });

    if (proximoDaFila) {
      await notificacaoService.avisarListaEspera(proximoDaFila, agendamento.data_hora);
      await proximoDaFila.update({ status: 'notificado' });
    }

    res.status(200).json({
      message: 'Agendamento cancelado com sucesso!',
      avisouListaEspera: Boolean(proximoDaFila)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
