const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { exigirLogin, exigirBarbeiro } = require('../middlewares/auth');
const { limiteLogin } = require('../middlewares/seguranca');

// Não existe cadastro público de barbeiro: a conta é criada com "npm run criar-admin"
router.post('/auth/barbeiro/login', limiteLogin, authController.loginBarbeiro);
router.put('/auth/barbeiro/senha', exigirBarbeiro, limiteLogin, authController.trocarSenhaBarbeiro);
router.get('/auth/eu', exigirLogin, authController.eu);

module.exports = router;
