import api from './api';

// Planos vendidos na Home (preço e limites vêm do backend)
export const listarPlanos = () => api.get('/planos').then((r) => r.data);

// Cria o pedido e devolve { pedido_id, url } — url é o checkout do Mercado Pago
// (ou a página de pagamento simulado, em ambiente de demonstração)
export const iniciarCheckout = (dados) => api.post('/assinaturas/checkout', dados).then((r) => r.data);

// Situação do pedido depois do pagamento. paymentId vem na volta do Mercado Pago.
export const consultarPedido = (pedidoId, paymentId) =>
  api.get(`/assinaturas/pedidos/${encodeURIComponent(pedidoId)}`, {
    params: paymentId ? { payment_id: paymentId } : undefined
  }).then((r) => r.data);

// Só existe com PAGAMENTO_SIMULADO=true no backend (demonstração sem Mercado Pago)
export const simularPagamento = (pedidoId) =>
  api.post(`/assinaturas/pedidos/${encodeURIComponent(pedidoId)}/simular-pagamento`).then((r) => r.data);

// Painel: plano atual, vencimento e histórico de pagamentos da barbearia
export const obterAssinatura = () => api.get('/assinatura').then((r) => r.data);
