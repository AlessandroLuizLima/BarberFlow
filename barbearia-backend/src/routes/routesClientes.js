const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.post('/clientes', clientesController.criarCliente);
router.post('/clientes/login', clientesController.loginCliente);
router.get('/clientes', clientesController.listarClientes);
router.get('/clientes/:id', clientesController.buscarClientePorId);
router.put('/clientes/:id', clientesController.atualizarCliente);
router.delete('/clientes/:id', clientesController.deletarCliente);

// Consulta de endereço por CEP (usada pelo formulário de cadastro no frontend)
router.get('/cep/:cep', clientesController.consultarCep);

module.exports = router;
