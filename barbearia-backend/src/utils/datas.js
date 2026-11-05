// O servidor (Azure) roda em UTC, mas a barbearia opera no horário de Brasília.
// Toda data mostrada em mensagens ou comparada por "dia" passa por aqui.
const FUSO = 'America/Sao_Paulo';
// Brasília não tem horário de verão desde 2019: o deslocamento é fixo em -03:00.
const DESLOCAMENTO = '-03:00';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// "10/10/2026 14:30"
function formatarDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
}

// "14:30"
function formatarHora(data) {
  return new Date(data).toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
}

// "sexta-feira, 6 de novembro"
function formatarDiaPorExtenso(data) {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: FUSO, weekday: 'long', day: 'numeric', month: 'long' });
}

// "2026-10-10" (dia local, não o dia em UTC)
function dataLocalISO(data) {
  return new Date(data).toLocaleDateString('en-CA', { timeZone: FUSO });
}

// "2026-11-06" + "14:30" -> Date (14:30 no horário de Brasília)
function dataHoraLocal(diaISO, hhmm) {
  return new Date(`${diaISO}T${hhmm}:00${DESLOCAMENTO}`);
}

// Nome do dia da semana ("Segunda-feira"...) no horário de Brasília
function diaDaSemana(data) {
  const indice = new Date(`${dataLocalISO(data)}T12:00:00${DESLOCAMENTO}`).getUTCDay();
  return DIAS_SEMANA[indice];
}

// Minutos desde a meia-noite no horário de Brasília (14:30 -> 870)
function minutosDoDia(data) {
  const [h, m] = formatarHora(data).split(':').map(Number);
  return h * 60 + m;
}

const paraMinutos = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

const paraHHMM = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

module.exports = {
  FUSO,
  DIAS_SEMANA,
  formatarDataHora,
  formatarHora,
  formatarDiaPorExtenso,
  dataLocalISO,
  dataHoraLocal,
  diaDaSemana,
  minutosDoDia,
  paraMinutos,
  paraHHMM
};
