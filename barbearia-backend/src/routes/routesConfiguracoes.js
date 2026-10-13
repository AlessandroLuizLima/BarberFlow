const express = require('express');
const router = express.Router();
const configuracoesController = require('../controllers/configuracoesController');

router.get('/configuracoes', configuracoesController.obterConfiguracao);
router.put('/configuracoes', configuracoesController.salvarConfiguracao);

module.exports = router;
