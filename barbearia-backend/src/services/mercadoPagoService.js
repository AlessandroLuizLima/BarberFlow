/**
 * Integração com o Mercado Pago (Checkout Pro), pela API REST oficial.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
 *
 * - criarPreferencia: monta o "carrinho" (plano escolhido) e devolve o link de pagamento.
 * - buscarPagamento: consulta um pagamento direto no Mercado Pago. É o que decide se o
 *   pedido foi pago: o aviso (webhook) só diz "olhe o pagamento X", nunca é confiado sozinho.
 * - assinaturaValida: confere a assinatura secreta do webhook (x-signature), se configurada.
 *
 * Variáveis do .env: MP_ACCESS_TOKEN (obrigatória), MP_WEBHOOK_SECRET (recomendada).
 */
const crypto = require('crypto');

const API = (process.env.MP_API_URL || 'https://api.mercadopago.com').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

const configurado = () => Boolean(process.env.MP_ACCESS_TOKEN);
// Credenciais de teste começam com "TEST-": o pagamento é de mentira (cartões de teste)
const modoTeste = () => String(process.env.MP_ACCESS_TOKEN || '').startsWith('TEST-');

async function chamar(caminho, { method = 'GET', corpo, idempotencia } = {}) {
  const resposta = await fetch(`${API}${caminho}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(idempotencia ? { 'X-Idempotency-Key': idempotencia } : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  }).catch((error) => {
    // Sem conexão com o Mercado Pago (internet, DNS, tempo esgotado)
    const erro = new Error(`Não foi possível falar com o Mercado Pago: ${error.cause?.code || error.message}`);
    erro.statusMp = 0;
    throw erro;
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(`Mercado Pago respondeu ${resposta.status}: ${dados.message || dados.error || 'erro'}`);
    erro.statusMp = resposta.status;
    throw erro;
  }
  return dados;
}

const urlPublica = (url) => /^https:\/\//.test(url || '') && !/localhost|127\.0\.0\.1/.test(url);

/**
 * @param {{ pedido: object, plano: object, urlFrontend: string, urlBackend: string }} p
 * @returns {Promise<{ id: string, url: string }>}
 */
async function criarPreferencia({ pedido, plano, urlFrontend, urlBackend }) {
  const retorno = `${urlFrontend.replace(/\/$/, '')}/assinar/retorno`;
  const corpo = {
    items: [{
      id: plano.chave,
      title: `BarberFlow - ${plano.nome} (30 dias)`,
      description: `Assinatura ${plano.nome} para ${pedido.nome_barbearia}`,
      category_id: 'services',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: Number(plano.preco)
    }],
    payer: { name: pedido.nome_responsavel, email: pedido.email },
    external_reference: pedido.id,
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    statement_descriptor: 'BARBERFLOW',
    metadata: { pedido_id: pedido.id, plano: plano.chave }
  };
  // O Mercado Pago só volta sozinho para endereços https públicos
  if (urlPublica(retorno)) corpo.auto_return = 'approved';
  // E só consegue avisar (webhook) um backend acessível pela internet
  if (urlPublica(urlBackend)) corpo.notification_url = `${urlBackend.replace(/\/$/, '')}/webhooks/mercadopago`;

  const preferencia = await chamar('/checkout/preferences', { method: 'POST', corpo, idempotencia: pedido.id });
  const url = modoTeste() ? (preferencia.sandbox_init_point || preferencia.init_point) : preferencia.init_point;
  return { id: preferencia.id, url };
}

// { id, status, status_detail, external_reference, transaction_amount, currency_id, date_approved }
const buscarPagamento = (id) => chamar(`/v1/payments/${encodeURIComponent(id)}`);

/**
 * Confere o cabeçalho x-signature do webhook (HMAC-SHA256 com a "chave secreta" do painel do Mercado Pago).
 * Sem MP_WEBHOOK_SECRET configurado, não dá para conferir: devolve true, e a segurança fica por conta de
 * buscarPagamento (o status sempre é lido no próprio Mercado Pago).
 */
function assinaturaValida(req, idDoRecurso) {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  if (!segredo) return true;
  const cabecalho = String(req.headers['x-signature'] || '');
  const partes = Object.fromEntries(cabecalho.split(',').map((p) => p.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(String(idDoRecurso)) ? String(idDoRecurso).toLowerCase() : String(idDoRecurso);
  const manifesto = `id:${id};request-id:${req.headers['x-request-id'] || ''};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', segredo).update(manifesto).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(String(partes.v1));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { configurado, modoTeste, criarPreferencia, buscarPagamento, assinaturaValida };
