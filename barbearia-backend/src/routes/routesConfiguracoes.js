const express = require('express');
const router = express.Router();
const configuracoesController = require('../controllers/configuracoesController');
const { autenticacaoOpcional, exigirBarbeiro } = require('../middlewares/auth');
const { limiteSensivel } = require('../middlewares/seguranca');

// Leitura pública (sem email de notificações e preferências para quem não é o barbeiro)
router.get('/configuracoes', autenticacaoOpcional, configuracoesController.obterConfiguracao);

// Alterações e notificações: só o barbeiro
router.put('/configuracoes', exigirBarbeiro, configuracoesController.salvarConfiguracao);
router.get('/configuracoes/notificacoes/status', exigirBarbeiro, configuracoesController.statusNotificacoes);
router.post('/configuracoes/notificacoes/teste', exigirBarbeiro, limiteSensivel, configuracoesController.testarNotificacoes);
router.get('/notificacoes-barbearia', exigirBarbeiro, configuracoesController.listarNotificacoesBarbearia);

module.exports = router;
