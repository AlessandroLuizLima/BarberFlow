const express = require('express');
const router = express.Router();
const assinaturasController = require('../controllers/assinaturasController');
const { autenticacaoOpcional, exigirBarbeiro } = require('../middlewares/auth');
const { limiteCheckout, limiteSensivel } = require('../middlewares/seguranca');

router.get('/planos', assinaturasController.listarPlanos);

// Compra de plano (pública) ou renovação (barbeiro logado)
router.post('/assinaturas/checkout', limiteCheckout, autenticacaoOpcional, assinaturasController.iniciarCheckout);
router.get('/assinaturas/pedidos/:id', limiteSensivel, assinaturasController.situacaoDoPedido);
router.post('/assinaturas/pedidos/:id/simular-pagamento', limiteSensivel, assinaturasController.simularPagamento);

// Aviso de pagamento do Mercado Pago
router.post('/webhooks/mercadopago', assinaturasController.webhookMercadoPago);

// Plano atual (painel)
router.get('/assinatura', exigirBarbeiro, assinaturasController.minhaAssinatura);

module.exports = router;
