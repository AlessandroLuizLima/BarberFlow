const { Op } = require('sequelize');
const { sequelize, Agendamento, Cliente, Profissional, Servico, ListaEspera } = require('../models');
const notificacaoService = require('../services/notificacaoService');
const { dataLocalISO } = require('../utils/datas');

// Status que ainda ocupam o horário do profissional e podem ser concluídos/remarcados/cancelados.
// "concluido" e "cancelado" são finais: não mudam mais.
const STATUS_ATIVOS = ['agendado', 'confirmado', 'remarcado'];
const DURACAO_MAXIMA_MS = 12 * 60 * 60 * 1000; // nenhum serviço dura mais que isso

const includePadrao = [
  { model: Cliente, as: 'cliente', attributes: { exclude: ['senha'] } },
  { model: Profissional, as: 'profissional' },
  { model: Servico, as: 'servico' }
];

class ErroNegocio extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

function responderErro(res, error) {
  if (error instanceof ErroNegocio) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: error.message });
}

function lerData(valor) {
  const data = new Date(valor);
  if (isNaN(data.getTime())) throw new ErroNegocio(400, 'data_hora inválida');
  return data;
}

// Serializa as operações de um mesmo profissional: duas requisições simultâneas
// para o mesmo horário não conseguem passar juntas pela checagem de conflito.
function comTravaDoProfissional(profissionalId, operacao) {
  return sequelize.transaction(async (transaction) => {
    await Profissional.findByPk(profissionalId, { transaction, lock: transaction.LOCK.UPDATE });
    return operacao(transaction);
  });
}

// Verifica se o profissional já possui agendamento ativo que colide com o horário desejado,
// considerando a duração do serviço de cada agendamento.
async function existeConflitoDeHorario({ profissional_id, data_hora, duracao_minutos, agendamentoIdIgnorado = null, transaction }) {
  const inicioNovo = new Date(data_hora);
  const fimNovo = new Date(inicioNovo.getTime() + duracao_minutos * 60000);

  // Janela em volta do horário (e não "o dia do servidor", que fica em UTC e erra à noite no Brasil)
  const candidatos = await Agendamento.findAll({
    where: {
      profissional_id,
      status: { [Op.in]: STATUS_ATIVOS },
      data_hora: { [Op.gt]: new Date(inicioNovo.getTime() - DURACAO_MAXIMA_MS), [Op.lt]: fimNovo },
      ...(agendamentoIdIgnorado ? { id: { [Op.ne]: agendamentoIdIgnorado } } : {})
    },
    include: [{ model: Servico, as: 'servico' }],
    transaction
  });

  return candidatos.some((agendamento) => {
    const inicioExistente = new Date(agendamento.data_hora);
    const fimExistente = new Date(inicioExistente.getTime() + agendamento.servico.duracao_minutos * 60000);
    return inicioNovo < fimExistente && fimNovo > inicioExistente;
  });
}

// Quando um horário vaga (cancelamento ou remarcação), avisa o primeiro da lista de espera.
async function avisarListaDeEspera({ profissional_id, servico_id, data_hora }) {
  const proximoDaFila = await ListaEspera.findOne({
    where: {
      profissional_id,
      servico_id,
      data_desejada: dataLocalISO(data_hora),
      status: 'aguardando'
    },
    order: [['id', 'ASC']]
  });

  if (!proximoDaFila) return false;

  await notificacaoService.avisarListaEspera(proximoDaFila, data_hora);
  await proximoDaFila.update({ status: 'notificado' });
  return true;
}

// CREATE - Criar agendamento
// Regras: cliente/profissional/serviço existem e estão ativos, horário no futuro e sem conflito.
// Cria já confirmado, guarda o preço cobrado e dispara a mensagem de confirmação.
exports.criarAgendamento = async (req, res) => {
  try {
    const { cliente_id, profissional_id, servico_id, data_hora } = req.body;

    if (!cliente_id || !profissional_id || !servico_id || !data_hora) {
      throw new ErroNegocio(400, 'cliente_id, profissional_id, servico_id e data_hora são obrigatórios');
    }

    const [cliente, profissional, servico] = await Promise.all([
      Cliente.findByPk(cliente_id),
      Profissional.findByPk(profissional_id),
      Servico.findByPk(servico_id)
    ]);

    if (!cliente) throw new ErroNegocio(404, 'Cliente não encontrado');
    if (!profissional) throw new ErroNegocio(404, 'Profissional não encontrado');
    if (!servico) throw new ErroNegocio(404, 'Serviço não encontrado');
    if (!profissional.ativo) throw new ErroNegocio(400, 'Este profissional não está disponível para agendamentos');
    if (!servico.ativo) throw new ErroNegocio(400, 'Este serviço não está disponível');

    const dataAgendamento = lerData(data_hora);
    if (dataAgendamento < new Date()) {
      throw new ErroNegocio(400, 'Não é possível agendar em uma data no passado');
    }

    const agendamento = await comTravaDoProfissional(profissional_id, async (transaction) => {
      const conflito = await existeConflitoDeHorario({
        profissional_id,
        data_hora: dataAgendamento,
        duracao_minutos: servico.duracao_minutos,
        transaction
      });

      if (conflito) {
        throw new ErroNegocio(409, 'Horário indisponível para este profissional. Você pode entrar na lista de espera.');
      }

      return Agendamento.create({
        cliente_id,
        profissional_id,
        servico_id,
        data_hora: dataAgendamento,
        status: 'confirmado',
        preco_cobrado: servico.preco
      }, { transaction });
    });

    await notificacaoService.enviarConfirmacao(agendamento);

    const agendamentoCompleto = await Agendamento.findByPk(agendamento.id, { include: includePadrao });

    res.status(201).json({
      message: 'Agendamento criado e confirmado com sucesso!',
      agendamento: agendamentoCompleto
    });
  } catch (error) {
    responderErro(res, error);
  }
};

// READ - Listar agendamentos (filtros opcionais por cliente_id, profissional_id ou status)
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
    responderErro(res, error);
  }
};

// READ - Buscar agendamento por ID
exports.buscarAgendamentoPorId = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, { include: includePadrao });
    if (!agendamento) throw new ErroNegocio(404, 'Agendamento não encontrado');
    res.status(200).json(agendamento);
  } catch (error) {
    responderErro(res, error);
  }
};

// UPDATE - Remarcar (nova data/hora e/ou outro profissional).
// Só agendamentos ativos podem ser remarcados. O status passa a "remarcado", o cliente é avisado
// e o horário antigo que vagou é oferecido para a lista de espera.
exports.atualizarAgendamento = async (req, res) => {
  try {
    const { data_hora, profissional_id } = req.body;
    if (!data_hora && !profissional_id) {
      throw new ErroNegocio(400, 'Informe data_hora e/ou profissional_id para remarcar');
    }

    const agendamento = await Agendamento.findByPk(req.params.id, { include: [{ model: Servico, as: 'servico' }] });
    if (!agendamento) throw new ErroNegocio(404, 'Agendamento não encontrado');

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser remarcado`);
    }

    const novaData = data_hora ? lerData(data_hora) : new Date(agendamento.data_hora);
    if (novaData < new Date()) {
      throw new ErroNegocio(400, 'Não é possível remarcar para uma data no passado');
    }

    const novoProfissionalId = profissional_id ? Number(profissional_id) : agendamento.profissional_id;
    if (novoProfissionalId !== agendamento.profissional_id) {
      const novoProfissional = await Profissional.findByPk(novoProfissionalId);
      if (!novoProfissional) throw new ErroNegocio(404, 'Profissional não encontrado');
      if (!novoProfissional.ativo) throw new ErroNegocio(400, 'Este profissional não está disponível para agendamentos');
    }

    const mudou =
      novaData.getTime() !== new Date(agendamento.data_hora).getTime() ||
      novoProfissionalId !== agendamento.profissional_id;
    if (!mudou) {
      throw new ErroNegocio(400, 'Escolha um horário ou profissional diferente do atual');
    }

    const horarioAnterior = {
      profissional_id: agendamento.profissional_id,
      servico_id: agendamento.servico_id,
      data_hora: agendamento.data_hora
    };

    await comTravaDoProfissional(novoProfissionalId, async (transaction) => {
      const conflito = await existeConflitoDeHorario({
        profissional_id: novoProfissionalId,
        data_hora: novaData,
        duracao_minutos: agendamento.servico.duracao_minutos,
        agendamentoIdIgnorado: agendamento.id,
        transaction
      });

      if (conflito) {
        throw new ErroNegocio(409, 'Horário indisponível para este profissional.');
      }

      await agendamento.update({
        data_hora: novaData,
        profissional_id: novoProfissionalId,
        status: 'remarcado',
        lembrete_enviado: false
      }, { transaction });
    });

    await notificacaoService.enviarRemarcacao(agendamento);
    const avisouListaEspera = await avisarListaDeEspera(horarioAnterior);

    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, { include: includePadrao });
    res.status(200).json({
      message: 'Agendamento remarcado com sucesso!',
      avisouListaEspera,
      agendamento: agendamentoAtualizado
    });
  } catch (error) {
    responderErro(res, error);
  }
};

// PATCH - Concluir atendimento (só agendamentos ativos, de hoje ou de dias anteriores).
// É o status "concluido" que entra no lucro do dia.
exports.concluirAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    if (!agendamento) throw new ErroNegocio(404, 'Agendamento não encontrado');

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser concluído`);
    }
    if (dataLocalISO(agendamento.data_hora) > dataLocalISO(new Date())) {
      throw new ErroNegocio(400, 'Não é possível concluir um atendimento de um dia que ainda não chegou');
    }

    await agendamento.update({ status: 'concluido' });

    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, { include: includePadrao });
    res.status(200).json({ message: 'Atendimento concluído!', agendamento: agendamentoAtualizado });
  } catch (error) {
    responderErro(res, error);
  }
};

// DELETE/CANCEL - Cancela o agendamento (o registro é mantido com status "cancelado")
// e avisa o próximo da lista de espera, se houver.
exports.cancelarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    if (!agendamento) throw new ErroNegocio(404, 'Agendamento não encontrado');

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser cancelado`);
    }

    await agendamento.update({ status: 'cancelado' });

    const avisouListaEspera = await avisarListaDeEspera(agendamento);

    res.status(200).json({
      message: 'Agendamento cancelado com sucesso!',
      avisouListaEspera
    });
  } catch (error) {
    responderErro(res, error);
  }
};
