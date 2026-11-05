/**
 * Notificações do sistema, enviadas por e-mail (ver emailService.js).
 *
 * - Para o CLIENTE: confirmação, remarcação, cancelamento, lembrete 2h antes e
 *   aviso da lista de espera. Ficam registradas na tabela "mensagens".
 * - Para a BARBEARIA: novo agendamento, cancelamento, reagendamento, lembrete do
 *   próximo atendimento e resumo do dia. Respeitam as preferências da aba
 *   "Notificações" das Configurações e ficam na tabela "notificacoes_barbearia".
 *
 * Nenhuma função aqui lança erro: uma falha de e-mail nunca pode impedir o
 * cliente de agendar ou cancelar. O resultado do envio fica gravado no histórico.
 */
const { Op } = require('sequelize');
const { Mensagem, Agendamento, Cliente, Profissional, Servico, Barbearia, NotificacaoBarbearia } = require('../models');
const { enviarEmail } = require('./emailService');
const { formatarDataHora, formatarHora, formatarDiaPorExtenso, dataLocalISO, dataHoraLocal } = require('../utils/datas');

const STATUS_ATIVOS = ['agendado', 'confirmado', 'remarcado'];

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const primeiroNome = (nome) => String(nome || '').trim().split(/\s+/)[0] || 'cliente';

async function carregarAgendamento(agendamentoOuId) {
  const id = typeof agendamentoOuId === 'object' ? agendamentoOuId.id : agendamentoOuId;
  return Agendamento.findByPk(id, {
    include: [
      { model: Cliente, as: 'cliente', attributes: { exclude: ['senha'] } },
      { model: Profissional, as: 'profissional' },
      { model: Servico, as: 'servico' }
    ]
  });
}

async function carregarBarbearia(barbeariaId) {
  const config = barbeariaId ? await Barbearia.findByPk(barbeariaId) : null;
  return {
    id: config?.id || null,
    nome: config?.nome || 'Barbearia',
    endereco: config?.endereco || '',
    // Sem e-mail específico de notificações, usa o e-mail principal da barbearia
    emailNotificacoes: config?.email_notificacoes || config?.email || null,
    preferencias: config?.notificacoes || {}
  };
}

// Linhas "Serviço / Profissional / Data..." usadas nos e-mails
function detalhesDoAgendamento(agendamento, barbearia) {
  const linhas = [
    ['Serviço', agendamento.servico?.nome || '-'],
    ['Profissional', agendamento.profissional?.nome_completo || '-'],
    ['Data e hora', formatarDataHora(agendamento.data_hora)],
    ['Valor', formatarMoeda(agendamento.preco_cobrado ?? agendamento.servico?.preco)]
  ];
  if (barbearia?.endereco) linhas.push(['Local', barbearia.endereco]);
  return linhas;
}

// ---------- Cliente ----------

async function registrarParaCliente({ cliente, agendamento_id = null, barbearia_id = null, tipo, conteudo, email, nomeBarbearia }) {
  const resultado = cliente?.email
    ? await enviarEmail({ para: cliente.email, assunto: email.assunto, conteudo: email, nomeRemetente: nomeBarbearia })
    : { status: 'falhou', erro: 'Cliente sem e-mail' };

  const mensagem = await Mensagem.create({
    barbearia_id,
    cliente_id: cliente.id,
    agendamento_id,
    tipo,
    conteudo,
    email_destino: cliente.email || null,
    status_envio: resultado.status,
    erro_envio: resultado.erro || null
  });
  console.log(`[MENSAGEM:${tipo}] cliente ${cliente.id} (${resultado.status}) -> ${conteudo}`);
  return mensagem;
}

// ---------- Barbearia ----------

// tipo -> chave da preferência na aba Notificações (null = sempre envia)
const PREFERENCIA = {
  novo_agendamento: 'novosAgendamentos',
  cancelamento: 'cancelamentos',
  reagendamento: 'reagendamentos',
  lembrete: 'lembretes',
  resumo_diario: 'relatorios',
  teste: null
};

async function notificarBarbearia({ tipo, agendamento_id = null, titulo, conteudo, email, barbearia, ignorarPreferencia = false }) {
  const dados = barbearia;
  if (!dados?.id) return null;
  const chave = PREFERENCIA[tipo];
  if (!ignorarPreferencia && chave && !dados.preferencias[chave]) return null; // desligado pelo barbeiro

  const resultado = dados.emailNotificacoes
    ? await enviarEmail({ para: dados.emailNotificacoes, assunto: email.assunto, conteudo: email, nomeRemetente: 'BarberFlow' })
    : { status: 'falhou', erro: 'Nenhum e-mail cadastrado nas Configurações da barbearia' };

  const notificacao = await NotificacaoBarbearia.create({
    barbearia_id: dados.id,
    tipo,
    agendamento_id,
    titulo,
    conteudo,
    email_destino: dados.emailNotificacoes,
    status_envio: resultado.status,
    erro_envio: resultado.erro || null
  });
  console.log(`[BARBEARIA:${tipo}] (${resultado.status}) -> ${titulo}`);
  return notificacao;
}

// Executa sem deixar erro escapar (o envio roda depois da resposta da API)
const seguro = (nome, fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    console.error(`[notificacao:${nome}] ${error.message}`);
    return null;
  }
};

// ---------- Eventos ----------

const enviarConfirmacao = seguro('confirmacao', async (agendamentoOuId) => {
  const ag = await carregarAgendamento(agendamentoOuId);
  if (!ag) return;
  const barbearia = await carregarBarbearia(ag.barbearia_id);
  const quando = formatarDataHora(ag.data_hora);

  await registrarParaCliente({
    cliente: ag.cliente,
    agendamento_id: ag.id,
    barbearia_id: ag.barbearia_id,
    tipo: 'confirmacao',
    conteudo: `Seu agendamento foi confirmado para ${quando}.`,
    nomeBarbearia: barbearia.nome,
    email: {
      assunto: `Agendamento confirmado: ${quando}`,
      titulo: 'Seu horário está confirmado!',
      paragrafos: [`Olá, ${primeiroNome(ag.cliente.nome_completo)}! Seu agendamento na ${barbearia.nome} foi confirmado.`],
      linhas: detalhesDoAgendamento(ag, barbearia),
      rodape: 'Você receberá um lembrete 2 horas antes. Chegue com 5 minutos de antecedência.'
    }
  });

  await notificarBarbearia({
    tipo: 'novo_agendamento',
    agendamento_id: ag.id,
    barbearia,
    titulo: `Novo agendamento: ${ag.cliente.nome_completo}`,
    conteudo: `${ag.cliente.nome_completo} agendou ${ag.servico?.nome} com ${ag.profissional?.nome_completo} para ${quando}.`,
    email: {
      assunto: `Novo agendamento: ${ag.cliente.nome_completo} em ${quando}`,
      titulo: 'Novo agendamento',
      paragrafos: [`${ag.cliente.nome_completo} acabou de agendar um horário.`],
      linhas: [['Cliente', ag.cliente.nome_completo], ['Telefone', ag.cliente.telefone || '-'], ...detalhesDoAgendamento(ag)]
    }
  });
});

const enviarRemarcacao = seguro('remarcacao', async (agendamentoOuId, { dataAnterior } = {}) => {
  const ag = await carregarAgendamento(agendamentoOuId);
  if (!ag) return;
  const barbearia = await carregarBarbearia(ag.barbearia_id);
  const quando = formatarDataHora(ag.data_hora);
  const antes = dataAnterior ? formatarDataHora(dataAnterior) : null;

  await registrarParaCliente({
    cliente: ag.cliente,
    agendamento_id: ag.id,
    barbearia_id: ag.barbearia_id,
    tipo: 'remarcacao',
    conteudo: `Seu agendamento foi remarcado para ${quando}.`,
    nomeBarbearia: barbearia.nome,
    email: {
      assunto: `Agendamento remarcado para ${quando}`,
      titulo: 'Seu agendamento foi remarcado',
      paragrafos: [`Olá, ${primeiroNome(ag.cliente.nome_completo)}! Seu horário na ${barbearia.nome} mudou.`],
      linhas: [...(antes ? [['Horário anterior', antes]] : []), ...detalhesDoAgendamento(ag, barbearia)]
    }
  });

  await notificarBarbearia({
    tipo: 'reagendamento',
    agendamento_id: ag.id,
    barbearia,
    titulo: `Reagendamento: ${ag.cliente.nome_completo}`,
    conteudo: `${ag.cliente.nome_completo}: ${ag.servico?.nome}${antes ? ` passou de ${antes}` : ''} para ${quando}.`,
    email: {
      assunto: `Reagendamento: ${ag.cliente.nome_completo} agora em ${quando}`,
      titulo: 'Agendamento remarcado',
      paragrafos: [`O agendamento de ${ag.cliente.nome_completo} mudou de horário.`],
      linhas: [['Cliente', ag.cliente.nome_completo], ...(antes ? [['Horário anterior', antes]] : []), ...detalhesDoAgendamento(ag)]
    }
  });
});

const enviarCancelamento = seguro('cancelamento', async (agendamentoOuId) => {
  const ag = await carregarAgendamento(agendamentoOuId);
  if (!ag) return;
  const barbearia = await carregarBarbearia(ag.barbearia_id);
  const quando = formatarDataHora(ag.data_hora);

  await registrarParaCliente({
    cliente: ag.cliente,
    agendamento_id: ag.id,
    barbearia_id: ag.barbearia_id,
    tipo: 'cancelamento',
    conteudo: `Seu agendamento de ${quando} foi cancelado.`,
    nomeBarbearia: barbearia.nome,
    email: {
      assunto: `Agendamento cancelado: ${quando}`,
      titulo: 'Agendamento cancelado',
      paragrafos: [
        `Olá, ${primeiroNome(ag.cliente.nome_completo)}. Seu agendamento na ${barbearia.nome} foi cancelado.`,
        'Quando quiser, é só marcar um novo horário pelo BarberFlow.'
      ],
      linhas: detalhesDoAgendamento(ag)
    }
  });

  await notificarBarbearia({
    tipo: 'cancelamento',
    agendamento_id: ag.id,
    barbearia,
    titulo: `Cancelamento: ${ag.cliente.nome_completo}`,
    conteudo: `${ag.cliente.nome_completo} cancelou ${ag.servico?.nome} de ${quando}. O horário está livre.`,
    email: {
      assunto: `Cancelamento: ${ag.cliente.nome_completo} (${quando})`,
      titulo: 'Agendamento cancelado',
      paragrafos: [`${ag.cliente.nome_completo} cancelou o agendamento. O horário ficou livre na agenda.`],
      linhas: [['Cliente', ag.cliente.nome_completo], ...detalhesDoAgendamento(ag)]
    }
  });
});

const enviarLembrete = seguro('lembrete', async (agendamentoOuId) => {
  const ag = await carregarAgendamento(agendamentoOuId);
  if (!ag) return;
  const barbearia = await carregarBarbearia(ag.barbearia_id);
  const hora = formatarHora(ag.data_hora);

  await registrarParaCliente({
    cliente: ag.cliente,
    agendamento_id: ag.id,
    barbearia_id: ag.barbearia_id,
    tipo: 'lembrete',
    conteudo: `Lembrete: você tem um horário marcado hoje às ${hora}. Não se atrase!`,
    nomeBarbearia: barbearia.nome,
    email: {
      assunto: `Lembrete: seu horário é hoje às ${hora}`,
      titulo: `Seu horário é hoje às ${hora}`,
      paragrafos: [`Olá, ${primeiroNome(ag.cliente.nome_completo)}! Passando para lembrar do seu atendimento na ${barbearia.nome}.`],
      linhas: detalhesDoAgendamento(ag, barbearia),
      rodape: 'Não vai conseguir ir? Cancele pelo app para liberar o horário.'
    }
  });

  await notificarBarbearia({
    tipo: 'lembrete',
    agendamento_id: ag.id,
    barbearia,
    titulo: `Hoje às ${hora}: ${ag.cliente.nome_completo}`,
    conteudo: `${ag.cliente.nome_completo} tem ${ag.servico?.nome} com ${ag.profissional?.nome_completo} hoje às ${hora}.`,
    email: {
      assunto: `Próximo atendimento às ${hora}: ${ag.cliente.nome_completo}`,
      titulo: `Próximo atendimento às ${hora}`,
      paragrafos: ['Lembrete do próximo atendimento da agenda.'],
      linhas: [['Cliente', ag.cliente.nome_completo], ['Telefone', ag.cliente.telefone || '-'], ...detalhesDoAgendamento(ag)]
    }
  });
});

const avisarListaEspera = seguro('lista_espera', async (entradaListaEspera, horarioDisponivel) => {
  const cliente = await Cliente.findByPk(entradaListaEspera.cliente_id, { attributes: { exclude: ['senha'] } });
  if (!cliente) return;
  const barbearia = await carregarBarbearia(entradaListaEspera.barbearia_id);
  const quando = formatarDataHora(horarioDisponivel);

  await registrarParaCliente({
    cliente,
    barbearia_id: barbearia.id,
    tipo: 'lista_espera',
    conteudo: `Boas notícias! Um horário vagou em ${quando}. Acesse o app para confirmar seu agendamento.`,
    nomeBarbearia: barbearia.nome,
    email: {
      assunto: `Vagou um horário: ${quando}`,
      titulo: 'Um horário vagou!',
      paragrafos: [
        `Olá, ${primeiroNome(cliente.nome_completo)}! Você estava na lista de espera da ${barbearia.nome} e um horário acabou de vagar.`,
        'Entre no BarberFlow e agende antes que outra pessoa pegue.'
      ],
      linhas: [['Horário livre', quando]]
    }
  });
});

// Resumo da agenda do dia de UMA barbearia
const enviarResumoDaBarbearia = seguro('resumo_diario', async (barbeariaId, dia = dataLocalISO(new Date())) => {
  const barbearia = await carregarBarbearia(barbeariaId);
  if (!barbearia.preferencias.relatorios) return null;

  const inicio = dataHoraLocal(dia, '00:00');
  const agendamentos = await Agendamento.findAll({
    where: {
      barbearia_id: barbeariaId,
      status: { [Op.in]: STATUS_ATIVOS },
      data_hora: { [Op.gte]: inicio, [Op.lt]: new Date(inicio.getTime() + 24 * 60 * 60 * 1000) }
    },
    include: [
      { model: Cliente, as: 'cliente', attributes: ['nome_completo'] },
      { model: Profissional, as: 'profissional', attributes: ['nome_completo'] },
      { model: Servico, as: 'servico', attributes: ['nome'] }
    ],
    order: [['data_hora', 'ASC']]
  });

  const previsto = agendamentos.reduce((soma, a) => soma + Number(a.preco_cobrado || 0), 0);
  const diaExtenso = formatarDiaPorExtenso(dataHoraLocal(dia, '12:00'));
  const linhas = agendamentos.map((a) => [
    formatarHora(a.data_hora),
    `${a.cliente?.nome_completo} · ${a.servico?.nome} · ${a.profissional?.nome_completo}`
  ]);

  return notificarBarbearia({
    tipo: 'resumo_diario',
    barbearia,
    titulo: `Agenda de ${diaExtenso}: ${agendamentos.length} atendimento(s)`,
    conteudo: agendamentos.length
      ? `${agendamentos.length} atendimento(s) hoje, faturamento previsto de ${formatarMoeda(previsto)}.`
      : 'Nenhum atendimento agendado para hoje.',
    email: {
      assunto: `Agenda de hoje: ${agendamentos.length} atendimento(s)`,
      titulo: `Agenda de ${diaExtenso}`,
      paragrafos: agendamentos.length
        ? [`Você tem ${agendamentos.length} atendimento(s) hoje. Faturamento previsto: ${formatarMoeda(previsto)}.`]
        : ['Nenhum atendimento agendado para hoje até agora.'],
      linhas
    }
  });
});

// Resumo do dia de todas as barbearias ativas (job das 7h)
async function enviarResumoDiario(dia) {
  const barbearias = await Barbearia.findAll({ where: { status: 'ativa' }, attributes: ['id'] });
  const resultados = [];
  for (const { id } of barbearias) resultados.push(await enviarResumoDaBarbearia(id, dia));
  return resultados;
}

// E-mail de teste da aba Notificações (ignora as preferências).
// emailDestino: o e-mail que está na tela (mesmo antes de salvar); sem ele, usa o salvo.
async function enviarTeste(barbeariaId, emailDestino) {
  const barbearia = await carregarBarbearia(barbeariaId);
  if (emailDestino) barbearia.emailNotificacoes = emailDestino;
  return notificarBarbearia({
    tipo: 'teste',
    barbearia,
    ignorarPreferencia: true,
    titulo: 'E-mail de teste',
    conteudo: 'Teste de envio das notificações do BarberFlow.',
    email: {
      assunto: 'Teste de notificações do BarberFlow',
      titulo: 'As notificações estão funcionando!',
      paragrafos: [
        `Este é um e-mail de teste da ${barbearia.nome}.`,
        'A partir de agora você recebe aqui os avisos que estiverem ligados na aba Notificações.'
      ]
    }
  });
}

module.exports = {
  enviarConfirmacao,
  enviarRemarcacao,
  enviarCancelamento,
  enviarLembrete,
  avisarListaEspera,
  enviarResumoDiario,
  enviarResumoDaBarbearia,
  enviarTeste,
  carregarBarbearia
};
