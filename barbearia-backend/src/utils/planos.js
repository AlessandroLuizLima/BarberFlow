// Planos vendidos na página inicial. O preço cobrado SEMPRE vem daqui (nunca do navegador).
// null = ilimitado.
const PLANOS = {
  starter: {
    chave: 'starter',
    nome: 'Plano Starter',
    preco: 29.9,
    maxProfissionais: 1,
    maxAgendamentosMes: 100
  },
  profissional: {
    chave: 'profissional',
    nome: 'Plano Profissional',
    preco: 59.9,
    maxProfissionais: 3,
    maxAgendamentosMes: 1000
  },
  enterprise: {
    chave: 'enterprise',
    nome: 'Plano Enterprise',
    preco: 99.9,
    maxProfissionais: null,
    maxAgendamentosMes: null
  }
};

// Cada pagamento libera 30 dias de uso
const DIAS_POR_PAGAMENTO = 30;

const obterPlano = (chave) => PLANOS[String(chave || '').toLowerCase()] || null;

module.exports = { PLANOS, DIAS_POR_PAGAMENTO, obterPlano };
