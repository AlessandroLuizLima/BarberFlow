const { Mensagem } = require('../models');

/**
 * Serviço de notificações. Nesta versão, "enviar" significa registrar a
 * mensagem na tabela `mensagens` (histórico de comunicação com o cliente)
 * e logar no console — simulando um canal real de envio (email/SMS/WhatsApp).
 * Para plugar um canal real, basta trocar o console.log por uma chamada a um
 * provedor (ex: Nodemailer, Twilio) mantendo a mesma assinatura das funções.
 */

async function registrarEnvio({ cliente_id, agendamento_id = null, tipo, conteudo }) {
  const mensagem = await Mensagem.create({
    cliente_id,
    agendamento_id,
    tipo,
    conteudo
  });

  console.log(`[MENSAGEM:${tipo}] cliente ${cliente_id} -> ${conteudo}`);

  return mensagem;
}

async function enviarConfirmacao(agendamento) {
  const dataFormatada = new Date(agendamento.data_hora).toLocaleString('pt-BR');
  return registrarEnvio({
    cliente_id: agendamento.cliente_id,
    agendamento_id: agendamento.id,
    tipo: 'confirmacao',
    conteudo: `Seu agendamento foi confirmado para ${dataFormatada}.`
  });
}

async function enviarLembrete(agendamento) {
  const dataFormatada = new Date(agendamento.data_hora).toLocaleString('pt-BR');
  return registrarEnvio({
    cliente_id: agendamento.cliente_id,
    agendamento_id: agendamento.id,
    tipo: 'lembrete',
    conteudo: `Lembrete: você tem um horário marcado hoje às ${dataFormatada}. Não se atrase!`
  });
}

async function avisarListaEspera(entradaListaEspera, horarioDisponivel) {
  const dataFormatada = new Date(horarioDisponivel).toLocaleString('pt-BR');
  return registrarEnvio({
    cliente_id: entradaListaEspera.cliente_id,
    agendamento_id: null,
    tipo: 'lista_espera',
    conteudo: `Boas notícias! Um horário vagou em ${dataFormatada}. Acesse o app para confirmar seu agendamento.`
  });
}

module.exports = {
  enviarConfirmacao,
  enviarLembrete,
  avisarListaEspera
};
