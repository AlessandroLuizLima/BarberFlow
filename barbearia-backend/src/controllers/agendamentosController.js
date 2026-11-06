const { Op } = require('sequelize');
const { sequelize, Agendamento, Cliente, Profissional, Servico, ListaEspera, Barbearia } = require('../models');
const { obterPlano } = require('../utils/planos');
const notificacaoService = require('../services/notificacaoService');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno } = require('../middlewares/seguranca');
const { dataLocalISO, dataHoraLocal, diaDaSemana, minutosDoDia, paraMinutos, paraHHMM } = require('../utils/datas');

const INTERVALO_MINUTOS = 30; // de quanto em quanto tempo a agenda oferece horários
const DIAS_PADRAO = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Horário de funcionamento salvo nas Configurações da barbearia (com valores padrão se ainda não salvou)
function horarioDeFuncionamento(config) {
  return {
    dias: Array.isArray(config?.dias_atendimento) && config.dias_atendimento.length ? config.dias_atendimento : DIAS_PADRAO,
    inicio: config?.horario_inicio || '08:00',
    fim: config?.horario_fim || '18:00'
  };
}

// O atendimento inteiro (início + duração) precisa caber no expediente de um dia de atendimento
function validarExpediente(data, duracaoMinutos, funcionamento) {
  const dia = diaDaSemana(data);
  if (!funcionamento.dias.includes(dia)) {
    throw new ErroNegocio(400, `A barbearia não atende em ${dia.toLowerCase()}.`);
  }
  const inicio = minutosDoDia(data);
  if (inicio < paraMinutos(funcionamento.inicio) || inicio + duracaoMinutos > paraMinutos(funcionamento.fim)) {
    throw new ErroNegocio(400, `Escolha um horário entre ${funcionamento.inicio} e ${funcionamento.fim} (o atendimento precisa terminar até o fechamento).`);
  }
}

// Status que ainda ocupam o horário do profissional e podem ser concluídos/remarcados/cancelados.
// "concluido" e "cancelado" são finais: não mudam mais.
const STATUS_ATIVOS = ['agendado', 'confirmado', 'remarcado'];
const DURACAO_MAXIMA_MS = 12 * 60 * 60 * 1000; // nenhum serviço dura mais que isso

const includePadrao = [
  { model: Barbearia, as: 'barbearia', attributes: ['id', 'nome', 'endereco', 'endereco_detalhado', 'latitude', 'longitude', 'telefone', 'logo_id'] },
  { model: Cliente, as: 'cliente', attributes: ['id', 'nome_completo', 'email', 'telefone', 'foto_id'] },
  { model: Profissional, as: 'profissional', attributes: ['id', 'nome_completo', 'especialidade', 'foto_id', 'ativo'] },
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
  return responderErroInterno(res, error);
}

// Cliente só mexe nos próprios agendamentos; o barbeiro, nos da barbearia dele.
// Para não revelar quais IDs existem, agendamento de outra pessoa/barbearia responde 404.
function garantirAcesso(req, agendamento) {
  if (!agendamento) throw new ErroNegocio(404, 'Agendamento não encontrado');
  const permitido = ehBarbeiro(req)
    ? agendamento.barbearia_id === req.usuario.barbearia_id
    : agendamento.cliente_id === req.usuario.id;
  if (!permitido) throw new ErroNegocio(404, 'Agendamento não encontrado');
}

// Agendamentos ainda não cancelados no mês corrente (para o limite do plano)
async function agendamentosNoMes(barbeariaId) {
  const agora = new Date();
  const inicioMes = dataHoraLocal(`${dataLocalISO(agora).slice(0, 7)}-01`, '00:00');
  return Agendamento.count({
    where: { barbearia_id: barbeariaId, status: { [Op.ne]: 'cancelado' }, criado_em: { [Op.gte]: inicioMes } }
  });
}

// Resposta com a barbearia formatada (logo como URL)
const comLogo = (agendamento) => {
  const dados = agendamento.toJSON();
  if (dados.barbearia) {
    dados.barbearia.logo_url = dados.barbearia.logo_id ? `/imagens/${dados.barbearia.logo_id}` : null;
    delete dados.barbearia.logo_id;
  }
  return dados;
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

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
async function avisarListaDeEspera({ barbearia_id, profissional_id, servico_id, data_hora }) {
  const proximoDaFila = await ListaEspera.findOne({
    where: {
      barbearia_id,
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
    const { profissional_id, servico_id, data_hora } = req.body || {};
    // O cliente logado agenda para si mesmo (o cliente_id do corpo é ignorado);
    // o barbeiro pode agendar em nome de um cliente.
    const cliente_id = ehBarbeiro(req) ? req.body?.cliente_id : req.usuario.id;

    if (!cliente_id || !profissional_id || !servico_id || !data_hora) {
      throw new ErroNegocio(400, 'profissional_id, servico_id e data_hora são obrigatórios');
    }
    if (![cliente_id, profissional_id, servico_id].every(idValido)) {
      throw new ErroNegocio(400, 'Identificadores inválidos');
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

    // Serviço e profissional precisam ser da mesma barbearia (e o barbeiro só agenda na dele)
    if (profissional.barbearia_id !== servico.barbearia_id) throw new ErroNegocio(400, 'Profissional não atende este serviço');
    if (ehBarbeiro(req) && servico.barbearia_id !== req.usuario.barbearia_id) throw new ErroNegocio(404, 'Serviço não encontrado');
    const barbearia = await Barbearia.findByPk(servico.barbearia_id);
    if (!barbearia || !barbearia.estaAtiva()) throw new ErroNegocio(400, 'Esta barbearia não está aceitando agendamentos no momento.');

    const plano = obterPlano(barbearia.plano);
    if (plano?.maxAgendamentosMes && (await agendamentosNoMes(barbearia.id)) >= plano.maxAgendamentosMes) {
      throw new ErroNegocio(409, 'Esta barbearia atingiu o limite de agendamentos do mês. Tente outra data ou entre em contato com ela.');
    }

    const dataAgendamento = lerData(data_hora);
    if (dataAgendamento < new Date()) {
      throw new ErroNegocio(400, 'Não é possível agendar em uma data no passado');
    }
    validarExpediente(dataAgendamento, servico.duracao_minutos, horarioDeFuncionamento(barbearia));

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
        barbearia_id: barbearia.id,
        cliente_id,
        profissional_id,
        servico_id,
        data_hora: dataAgendamento,
        status: 'confirmado',
        preco_cobrado: servico.preco
      }, { transaction });
    });

    // E-mails saem em segundo plano: o cliente não espera o provedor de e-mail responder
    notificacaoService.enviarConfirmacao(agendamento.id);

    const agendamentoCompleto = await Agendamento.findByPk(agendamento.id, { include: includePadrao });

    res.status(201).json({
      message: 'Agendamento criado e confirmado com sucesso!',
      agendamento: comLogo(agendamentoCompleto)
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
    // Cliente vê só os próprios agendamentos, seja qual for o filtro enviado
    if (!ehBarbeiro(req)) where.cliente_id = req.usuario.id;
    else {
      where.barbearia_id = req.usuario.barbearia_id;
      if (idValido(cliente_id)) where.cliente_id = Number(cliente_id);
    }
    if (idValido(profissional_id)) where.profissional_id = Number(profissional_id);
    if (status && [...STATUS_ATIVOS, 'cancelado', 'concluido'].includes(status)) where.status = status;

    const agendamentos = await Agendamento.findAll({
      where,
      include: includePadrao,
      order: [['data_hora', 'ASC']]
    });
    res.status(200).json(agendamentos.map(comLogo));
  } catch (error) {
    responderErro(res, error);
  }
};

// READ - Buscar agendamento por ID
exports.buscarAgendamentoPorId = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, { include: includePadrao });
    garantirAcesso(req, agendamento);
    res.status(200).json(comLogo(agendamento));
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
    garantirAcesso(req, agendamento);
    if (profissional_id !== undefined && !idValido(profissional_id)) throw new ErroNegocio(400, 'profissional_id inválido');

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser remarcado`);
    }

    const novaData = data_hora ? lerData(data_hora) : new Date(agendamento.data_hora);
    if (novaData < new Date()) {
      throw new ErroNegocio(400, 'Não é possível remarcar para uma data no passado');
    }
    validarExpediente(novaData, agendamento.servico.duracao_minutos, horarioDeFuncionamento(await Barbearia.findByPk(agendamento.barbearia_id)));

    const novoProfissionalId = profissional_id ? Number(profissional_id) : agendamento.profissional_id;
    if (novoProfissionalId !== agendamento.profissional_id) {
      const novoProfissional = await Profissional.findByPk(novoProfissionalId);
      if (!novoProfissional || novoProfissional.barbearia_id !== agendamento.barbearia_id) {
        throw new ErroNegocio(404, 'Profissional não encontrado');
      }
      if (!novoProfissional.ativo) throw new ErroNegocio(400, 'Este profissional não está disponível para agendamentos');
    }

    const mudou =
      novaData.getTime() !== new Date(agendamento.data_hora).getTime() ||
      novoProfissionalId !== agendamento.profissional_id;
    if (!mudou) {
      throw new ErroNegocio(400, 'Escolha um horário ou profissional diferente do atual');
    }

    const horarioAnterior = {
      barbearia_id: agendamento.barbearia_id,
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

    notificacaoService.enviarRemarcacao(agendamento.id, { dataAnterior: horarioAnterior.data_hora });
    const avisouListaEspera = await avisarListaDeEspera(horarioAnterior);

    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, { include: includePadrao });
    res.status(200).json({
      message: 'Agendamento remarcado com sucesso!',
      avisouListaEspera,
      agendamento: comLogo(agendamentoAtualizado)
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
    garantirAcesso(req, agendamento);

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser concluído`);
    }
    await agendamento.update({ status: 'concluido' });

    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, { include: includePadrao });
    res.status(200).json({ message: 'Atendimento concluído!', agendamento: comLogo(agendamentoAtualizado) });
  } catch (error) {
    responderErro(res, error);
  }
};

// DELETE/CANCEL - Cancela o agendamento (o registro é mantido com status "cancelado")
// e avisa o próximo da lista de espera, se houver.
exports.cancelarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    garantirAcesso(req, agendamento);

    if (!STATUS_ATIVOS.includes(agendamento.status)) {
      throw new ErroNegocio(409, `Um agendamento ${agendamento.status} não pode ser cancelado`);
    }

    await agendamento.update({ status: 'cancelado' });
    notificacaoService.enviarCancelamento(agendamento.id);

    const avisouListaEspera = await avisarListaDeEspera(agendamento);

    res.status(200).json({
      message: 'Agendamento cancelado com sucesso!',
      avisouListaEspera
    });
  } catch (error) {
    responderErro(res, error);
  }
};

// READ - Horários livres de um dia para um serviço.
// GET /disponibilidade?data=2026-11-06&servico_id=1[&profissional_id=2]
// Responde cada horário (de 30 em 30 min, dentro do expediente) com os profissionais livres nele,
// já descontando agendamentos existentes, a duração do serviço e horários que já passaram.
exports.disponibilidade = async (req, res) => {
  try {
    const { data, servico_id, profissional_id } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ''))) throw new ErroNegocio(400, 'Informe data no formato AAAA-MM-DD');
    if (!servico_id) throw new ErroNegocio(400, 'Informe servico_id');

    if (!idValido(servico_id)) throw new ErroNegocio(400, 'servico_id inválido');
    const servico = await Servico.findByPk(servico_id);
    if (!servico || !servico.ativo) throw new ErroNegocio(404, 'Serviço não encontrado');
    // A barbearia vem do serviço: horários e profissionais são sempre dela
    const barbearia = await Barbearia.findByPk(servico.barbearia_id);
    if (!barbearia || !barbearia.estaAtiva()) throw new ErroNegocio(404, 'Barbearia indisponível');

    const funcionamento = horarioDeFuncionamento(barbearia);
    const meioDia = dataHoraLocal(data, '12:00');
    if (isNaN(meioDia.getTime())) throw new ErroNegocio(400, 'Data inválida');
    const dia = diaDaSemana(meioDia);

    const resposta = {
      data,
      dia_semana: dia,
      horario_inicio: funcionamento.inicio,
      horario_fim: funcionamento.fim,
      intervalo_minutos: INTERVALO_MINUTOS,
      aberto: funcionamento.dias.includes(dia),
      horarios: []
    };
    if (!resposta.aberto) return res.status(200).json(resposta);

    const profissionais = await Profissional.findAll({
      where: { barbearia_id: barbearia.id, ativo: true, ...(idValido(profissional_id) ? { id: Number(profissional_id) } : {}) },
      attributes: ['id'],
      order: [['id', 'ASC']]
    });
    const ids = profissionais.map((p) => p.id);

    const abertura = dataHoraLocal(data, funcionamento.inicio);
    const fechamento = dataHoraLocal(data, funcionamento.fim);
    const ocupados = ids.length
      ? await Agendamento.findAll({
          where: {
            profissional_id: { [Op.in]: ids },
            status: { [Op.in]: STATUS_ATIVOS },
            data_hora: { [Op.gt]: new Date(abertura.getTime() - DURACAO_MAXIMA_MS), [Op.lt]: fechamento }
          },
          include: [{ model: Servico, as: 'servico', attributes: ['duracao_minutos'] }],
          attributes: ['profissional_id', 'data_hora']
        })
      : [];

    const agora = Date.now();
    const duracaoMs = servico.duracao_minutos * 60000;
    for (let m = paraMinutos(funcionamento.inicio); m + servico.duracao_minutos <= paraMinutos(funcionamento.fim); m += INTERVALO_MINUTOS) {
      const hora = paraHHMM(m);
      const inicio = dataHoraLocal(data, hora).getTime();
      if (inicio <= agora) continue;
      const fim = inicio + duracaoMs;

      const livres = ids.filter((id) => !ocupados.some((a) => {
        if (a.profissional_id !== id) return false;
        const ini = new Date(a.data_hora).getTime();
        return inicio < ini + a.servico.duracao_minutos * 60000 && fim > ini;
      }));
      resposta.horarios.push({ hora, profissionais: livres });
    }

    res.status(200).json(resposta);
  } catch (error) {
    responderErro(res, error);
  }
};
