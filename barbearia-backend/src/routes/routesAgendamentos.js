const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');

router.post('/agendamentos', agendamentosController.criarAgendamento);
router.get('/agendamentos', agendamentosController.listarAgendamentos);
router.get('/agendamentos/:id', agendamentosController.buscarAgendamentoPorId);
router.put('/agendamentos/:id', agendamentosController.atualizarAgendamento);
router.delete('/agendamentos/:id', agendamentosController.cancelarAgendamento);

module.exports = router;
