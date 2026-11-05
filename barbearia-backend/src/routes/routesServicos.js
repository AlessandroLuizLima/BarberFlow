const express = require('express');
const router = express.Router();
const servicosController = require('../controllers/servicosController');
const { exigirBarbeiro } = require('../middlewares/auth');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Leitura pública (o cliente escolhe o serviço)
router.get('/servicos', servicosController.listarServicos);
router.get('/servicos/:id', servicosController.buscarServicoPorId);

// Cadastro, edição e exclusão: só o barbeiro
router.post('/servicos', exigirBarbeiro, servicosController.criarServico);
router.put('/servicos/:id', exigirBarbeiro, servicosController.atualizarServico);
router.delete('/servicos/:id', exigirBarbeiro, servicosController.deletarServico);

module.exports = router;
