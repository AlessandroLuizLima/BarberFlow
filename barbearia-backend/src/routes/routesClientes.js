const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { exigirBarbeiro, exigirProprioClienteOuBarbeiro } = require('../middlewares/auth');
const { limiteLogin, limiteCadastro, limiteSensivel } = require('../middlewares/seguranca');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Públicas: cadastro e login (com limite contra força bruta)
router.post('/clientes', limiteCadastro, clientesController.criarCliente);
router.post('/clientes/login', limiteLogin, clientesController.loginCliente);

// Lista de clientes: só o barbeiro
router.get('/clientes', exigirBarbeiro, clientesController.listarClientes);

// Cadastro e foto: o próprio cliente ou o barbeiro
router.get('/clientes/:id', exigirProprioClienteOuBarbeiro, clientesController.buscarClientePorId);
router.put('/clientes/:id', exigirProprioClienteOuBarbeiro, clientesController.atualizarCliente);
router.delete('/clientes/:id', exigirProprioClienteOuBarbeiro, clientesController.deletarCliente);
router.put('/clientes/:id/foto', exigirProprioClienteOuBarbeiro, clientesController.atualizarFoto);
router.delete('/clientes/:id/foto', exigirProprioClienteOuBarbeiro, clientesController.removerFoto);

// Consulta de endereço por CEP (usada no cadastro, antes de ter conta)
router.get('/cep/:cep', limiteSensivel, clientesController.consultarCep);

module.exports = router;
