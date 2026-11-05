const express = require('express');
const router = express.Router();
const configuracoesController = require('../controllers/configuracoesController');
const { exigirBarbeiro } = require('../middlewares/auth');
const { limiteSensivel } = require('../middlewares/seguranca');

// Só o painel: clientes e visitantes usam GET /barbearias e /barbearias/:id
router.get('/configuracoes', exigirBarbeiro, configuracoesController.obterConfiguracao);

// Alterações e notificações: só o barbeiro
router.put('/configuracoes', exigirBarbeiro, configuracoesController.salvarConfiguracao);
router.get('/configuracoes/notificacoes/status', exigirBarbeiro, configuracoesController.statusNotificacoes);
router.post('/configuracoes/notificacoes/teste', exigirBarbeiro, limiteSensivel, configuracoesController.testarNotificacoes);
router.get('/notificacoes-barbearia', exigirBarbeiro, configuracoesController.listarNotificacoesBarbearia);

module.exports = router;
