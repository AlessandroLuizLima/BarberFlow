const express = require('express');
const router = express.Router();
const profissionaisController = require('../controllers/profissionaisController');

router.post('/profissionais', profissionaisController.criarProfissional);
router.get('/profissionais', profissionaisController.listarProfissionais);
router.get('/profissionais/:id', profissionaisController.buscarProfissionalPorId);
router.put('/profissionais/:id', profissionaisController.atualizarProfissional);
router.delete('/profissionais/:id', profissionaisController.deletarProfissional);

// Foto de perfil
router.put('/profissionais/:id/foto', profissionaisController.atualizarFoto);
router.delete('/profissionais/:id/foto', profissionaisController.removerFoto);

module.exports = router;
