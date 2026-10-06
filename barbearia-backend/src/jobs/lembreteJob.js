const cron = require('node-cron');
const { Op } = require('sequelize');
const { Agendamento } = require('../models');
const notificacaoService = require('../services/notificacaoService');

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
      status: { [Op.in]: ['agendado', 'confirmado'] },
      lembrete_enviado: false,
      data_hora: { [Op.gt]: agora, [Op.lte]: limite }
    }
  });

  for (const agendamento of agendamentos) {
    await notificacaoService.enviarLembrete(agendamento);
    await agendamento.update({ lembrete_enviado: true });
  }

  return agendamentos.length;
}

// Roda a cada minuto verificando quem entrou na janela das 2h antes do horário
function iniciarJobDeLembretes() {
  cron.schedule('* * * * *', () => {
    verificarLembretes().catch((error) => {
      console.error('[lembreteJob] erro ao verificar lembretes:', error.message);
    });
  });
  console.log('Job de lembretes (2h antes) iniciado.');
}

module.exports = { iniciarJobDeLembretes, verificarLembretes };
