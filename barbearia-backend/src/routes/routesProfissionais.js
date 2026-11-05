const express = require('express');
const router = express.Router();
const profissionaisController = require('../controllers/profissionaisController');
const { autenticacaoOpcional, exigirBarbeiro } = require('../middlewares/auth');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Leitura pública (sem email/telefone para quem não é o barbeiro)
router.get('/profissionais', autenticacaoOpcional, profissionaisController.listarProfissionais);
router.get('/profissionais/:id', autenticacaoOpcional, profissionaisController.buscarProfissionalPorId);

// Cadastro, edição, exclusão e foto: só o barbeiro
router.post('/profissionais', exigirBarbeiro, profissionaisController.criarProfissional);
router.put('/profissionais/:id', exigirBarbeiro, profissionaisController.atualizarProfissional);
router.delete('/profissionais/:id', exigirBarbeiro, profissionaisController.deletarProfissional);
router.put('/profissionais/:id/foto', exigirBarbeiro, profissionaisController.atualizarFoto);
router.delete('/profissionais/:id/foto', exigirBarbeiro, profissionaisController.removerFoto);

module.exports = router;
