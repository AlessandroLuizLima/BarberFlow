const assinaturaService = require('../services/assinaturaService');
const mercadoPago = require('../services/mercadoPagoService');
const { Barbearia, Pedido } = require('../models');
const { ehBarbeiro } = require('../middlewares/auth');
const { responderErroInterno } = require('../middlewares/seguranca');
const { obterPlano } = require('../utils/planos');

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const responderErro = (res, error) =>
  (error instanceof assinaturaService.ErroAssinatura
    ? res.status(error.status).json({ error: error.message })
    : responderErroInterno(res, error));

// GET /planos - planos e preços (os mesmos usados na cobrança)
exports.listarPlanos = (req, res) => {
  res.status(200).json(assinaturaService.listarPlanos());
};

// POST /assinaturas/checkout - cria o pedido e devolve o link de pagamento.
// Sem login = compra nova. Barbeiro logado = renovação/troca de plano da barbearia dele.
exports.iniciarCheckout = async (req, res) => {
  try {
    const barbeiro = ehBarbeiro(req) ? req.usuario : null;
    const resultado = await assinaturaService.iniciarCheckout(req.body || {}, barbeiro);
    res.status(201).json(resultado);
  } catch (error) {
    if (error.statusMp !== undefined) { // 0 = sem conexão com o Mercado Pago
      console.error('[mercadopago]', error.message);
      return res.status(502).json({ error: 'Não foi possível abrir o pagamento agora. Tente novamente em instantes.' });
    }
    responderErro(res, error);
  }
};

// GET /assinaturas/pedidos/:id?payment_id= - situação do pedido (página de retorno do pagamento)
exports.situacaoDoPedido = async (req, res) => {
  try {
    if (!REGEX_UUID.test(req.params.id)) return res.status(404).json({ error: 'Pedido não encontrado' });
    const pagamentoId = req.query.payment_id || req.query.collection_id;
    const situacao = await assinaturaService.situacaoDoPedido(req.params.id, pagamentoId);
    if (!situacao) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.status(200).json(situacao);
  } catch (error) {
    responderErro(res, error);
  }
};

// POST /assinaturas/pedidos/:id/simular-pagamento - só com PAGAMENTO_SIMULADO=true e fora de produção
exports.simularPagamento = async (req, res) => {
  try {
    if (!assinaturaService.pagamentoSimulado()) return res.status(404).json({ error: 'Rota não encontrada' });
    if (!REGEX_UUID.test(req.params.id)) return res.status(404).json({ error: 'Pedido não encontrado' });
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
    await assinaturaService.aprovarPedido(pedido.id, { pagamentoId: `simulado-${Date.now()}`, valorPago: pedido.valor });
    res.status(200).json(await assinaturaService.situacaoDoPedido(pedido.id));
  } catch (error) {
    responderErro(res, error);
  }
};

// POST /webhooks/mercadopago - aviso do Mercado Pago de que um pagamento mudou.
// O corpo só traz o ID: o status é sempre consultado no próprio Mercado Pago.
exports.webhookMercadoPago = async (req, res) => {
  const tipo = req.query.type || req.query.topic || req.body?.type || req.body?.topic;
  const id = req.query['data.id'] || req.body?.data?.id || req.query.id;

  if (!id || !['payment'].includes(tipo)) return res.status(200).json({ ok: true }); // outros avisos: ignora
  if (!mercadoPago.assinaturaValida(req, id)) {
    console.warn('[webhook] assinatura inválida, aviso ignorado');
    return res.status(401).json({ error: 'Assinatura inválida' });
  }

  // Responde rápido (o Mercado Pago reenvia se demorar) e processa em seguida
  res.status(200).json({ ok: true });
  assinaturaService.processarPagamento(id).catch((error) => console.error('[webhook] erro ao processar pagamento:', error.message));
};

// GET /assinatura - plano e validade da barbearia do barbeiro logado
exports.minhaAssinatura = async (req, res) => {
  try {
    const barbearia = await Barbearia.findByPk(req.usuario.barbearia_id);
    if (!barbearia) return res.status(404).json({ error: 'Barbearia não encontrada' });
    const plano = obterPlano(barbearia.plano);
    const pedidos = await Pedido.findAll({
      where: { barbearia_id: barbearia.id },
      attributes: ['id', 'plano', 'valor', 'status', 'tipo', 'criado_em', 'pago_em'],
      order: [['criado_em', 'DESC']],
      limit: 10
    });
    res.status(200).json({
      plano: plano ? { chave: plano.chave, nome: plano.nome, preco: plano.preco, max_profissionais: plano.maxProfissionais, max_agendamentos_mes: plano.maxAgendamentosMes } : null,
      status: barbearia.status,
      ativa: barbearia.estaAtiva(),
      expira_em: barbearia.assinatura_expira_em,
      pedidos
    });
  } catch (error) {
    responderErroInterno(res, error);
  }
};
