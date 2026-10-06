const express = require('express');
const router = express.Router();
const profissionaisController = require('../controllers/profissionaisController');

router.post('/profissionais', profissionaisController.criarProfissional);
router.get('/profissionais', profissionaisController.listarProfissionais);
router.get('/profissionais/:id', profissionaisController.buscarProfissionalPorId);
router.put('/profissionais/:id', profissionaisController.atualizarProfissional);
router.delete('/profissionais/:id', profissionaisController.deletarProfissional);

module.exports = router;
