const express = require('express');
const router = express.Router();
const mensagensController = require('../controllers/mensagensController');

router.get('/mensagens', mensagensController.listarMensagens);

module.exports = router;
