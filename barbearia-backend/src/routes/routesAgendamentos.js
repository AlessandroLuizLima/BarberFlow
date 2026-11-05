const express = require('express');
const router = express.Router();
const agendamentosController = require('../controllers/agendamentosController');
const { exigirLogin, exigirBarbeiro } = require('../middlewares/auth');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Horários livres: público (mostra só horários e IDs de profissionais livres)
router.get('/disponibilidade', agendamentosController.disponibilidade);

// Cliente logado: só os próprios agendamentos. Barbeiro: todos.
router.post('/agendamentos', exigirLogin, agendamentosController.criarAgendamento);
router.get('/agendamentos', exigirLogin, agendamentosController.listarAgendamentos);
router.get('/agendamentos/:id', exigirLogin, agendamentosController.buscarAgendamentoPorId);
router.put('/agendamentos/:id', exigirLogin, agendamentosController.atualizarAgendamento); // remarcar
router.delete('/agendamentos/:id', exigirLogin, agendamentosController.cancelarAgendamento);

// Concluir atendimento: só o barbeiro
router.patch('/agendamentos/:id/concluir', exigirBarbeiro, agendamentosController.concluirAgendamento);

module.exports = router;
