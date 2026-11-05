const express = require('express');
const router = express.Router();
const mensagensController = require('../controllers/mensagensController');
const { exigirLogin } = require('../middlewares/auth');

// Cliente: só as próprias mensagens. Barbeiro: todas.
router.get('/mensagens', exigirLogin, mensagensController.listarMensagens);

module.exports = router;
