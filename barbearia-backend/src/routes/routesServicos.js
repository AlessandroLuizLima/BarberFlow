const express = require('express');
const router = express.Router();
const servicosController = require('../controllers/servicosController');

router.post('/servicos', servicosController.criarServico);
router.get('/servicos', servicosController.listarServicos);
router.get('/servicos/:id', servicosController.buscarServicoPorId);
router.put('/servicos/:id', servicosController.atualizarServico);
router.delete('/servicos/:id', servicosController.deletarServico);

module.exports = router;
