const cron = require('node-cron');
const { Op } = require('sequelize');
const { Agendamento } = require('../models');
const notificacaoService = require('../services/notificacaoService');
const { expirarPedidosAntigos } = require('../services/assinaturaService');

const JANELA_LEMBRETE_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Verifica agendamentos cujo horário está a 2h (ou menos) de distância e ainda
 * não receberam o lembrete, enviando-o e marcando `lembrete_enviado = true`
 * para não notificar duas vezes.
 */
async function verificarLembretes() {
  const agora = new Date();
  const limite = new Date(agora.getTime() + JANELA_LEMBRETE_MS);

  const agendamentos = await Agendamento.findAll({
    where: {
      status: { [Op.in]: ['agendado', 'confirmado', 'remarcado'] },
      lembrete_enviado: false,
      data_hora: { [Op.gt]: agora, [Op.lte]: limite }
    }
  });

  for (const agendamento of agendamentos) {
    // Marca antes de enviar: se o e-mail demorar, o próximo minuto não manda de novo
    await agendamento.update({ lembrete_enviado: true });
    await notificacaoService.enviarLembrete(agendamento.id);
  }

  return agendamentos.length;
}

// Horário do resumo diário enviado à barbearia (padrão 07:00, horário de Brasília)
const HORA_RESUMO = /^([01]\d|2[0-3]):[0-5]\d$/.test(process.env.RESUMO_DIARIO_HORA || '')
  ? process.env.RESUMO_DIARIO_HORA
  : '07:00';

// Lembretes: roda a cada minuto verificando quem entrou na janela das 2h antes do horário.
// Resumo do dia: todo dia no HORA_RESUMO, se a preferência estiver ligada.
function iniciarJobDeLembretes() {
  cron.schedule('* * * * *', () => {
    verificarLembretes().catch((error) => {
      console.error('[lembreteJob] erro ao verificar lembretes:', error.message);
    });
  });

  const [hora, minuto] = HORA_RESUMO.split(':').map(Number);
  cron.schedule(`${minuto} ${hora} * * *`, () => {
    notificacaoService.enviarResumoDiario().catch((error) => {
      console.error('[lembreteJob] erro no resumo diário:', error.message);
    });
    expirarPedidosAntigos().catch((error) => console.error('[lembreteJob] erro ao expirar pedidos:', error.message));
  }, { timezone: 'America/Sao_Paulo' });

  console.log(`Job de lembretes (2h antes) e resumo diário (${HORA_RESUMO}) iniciados.`);
}

module.exports = { iniciarJobDeLembretes, verificarLembretes };
