const express = require('express');
const router = express.Router();
const configuracoesController = require('../controllers/configuracoesController');

router.get('/configuracoes', configuracoesController.obterConfiguracao);
router.put('/configuracoes', configuracoesController.salvarConfiguracao);

// Notificações da barbearia (e-mail)
router.get('/configuracoes/notificacoes/status', configuracoesController.statusNotificacoes);
router.post('/configuracoes/notificacoes/teste', configuracoesController.testarNotificacoes);
router.get('/notificacoes-barbearia', configuracoesController.listarNotificacoesBarbearia);

module.exports = router;
