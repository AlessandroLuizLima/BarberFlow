// Planos exibidos na Home e no checkout. O preço cobrado de verdade é sempre o do backend
// (GET /planos); estes valores são só para mostrar a página antes da resposta chegar.
export const PLANOS = [
  {
    chave: 'starter',
    nome: 'Plano Starter',
    descricao: 'Ideal para profissionais autônomos que estão começando.',
    preco: 29.9,
    recursos: ['Até 100 agendamentos/mês', '1 profissional', 'Acesso a dashboard básico', 'Suporte por email']
  },
  {
    chave: 'profissional',
    nome: 'Plano Profissional',
    descricao: 'Perfeito para barbearias em crescimento.',
    preco: 59.9,
    recursos: ['Até 1000 agendamentos/mês', 'Até 3 profissionais', 'Acesso a dashboard avançado', 'Suporte por email', 'Suporte por whatsapp']
  },
  {
    chave: 'enterprise',
    nome: 'Plano Enterprise',
    descricao: 'Solução completa para grandes estabelecimentos.',
    preco: 99.9,
    recursos: ['Agendamentos ilimitados', 'Profissionais ilimitados', 'Acesso a dashboard avançado', 'Suporte por email', 'Suporte por whatsapp', 'Suporte prioritário via chat']
  }
];

export const obterPlanoLocal = (chave) => PLANOS.find((p) => p.chave === chave) || null;

export const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
