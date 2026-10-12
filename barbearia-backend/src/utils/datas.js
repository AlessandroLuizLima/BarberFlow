// O servidor (Azure) roda em UTC, mas a barbearia opera no horário de Brasília.
// Toda data mostrada em mensagens ou comparada por "dia" passa por aqui.
const FUSO = 'America/Sao_Paulo';

// "10/10/2026 14:30"
function formatarDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
}

// "14:30"
function formatarHora(data) {
  return new Date(data).toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
}

// "2026-10-10" (dia local, não o dia em UTC)
function dataLocalISO(data) {
  return new Date(data).toLocaleDateString('en-CA', { timeZone: FUSO });
}

module.exports = { FUSO, formatarDataHora, formatarHora, dataLocalISO };
