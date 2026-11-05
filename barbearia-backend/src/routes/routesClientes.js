const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { exigirBarbeiro, exigirProprioClienteOuBarbeiro, exigirProprioCliente } = require('../middlewares/auth');
const { limiteLogin, limiteCadastro, limiteSensivel } = require('../middlewares/seguranca');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Públicas: cadastro e login (com limite contra força bruta)
router.post('/clientes', limiteCadastro, clientesController.criarCliente);
router.post('/clientes/login', limiteLogin, clientesController.loginCliente);

// Lista de clientes: o barbeiro vê quem já agendou na barbearia dele
router.get('/clientes', exigirBarbeiro, clientesController.listarClientes);

// Ver o cadastro: o próprio cliente, ou o barbeiro de uma barbearia onde ele agendou
router.get('/clientes/:id', exigirProprioClienteOuBarbeiro, clientesController.buscarClientePorId);
// Alterar, excluir e foto: só o próprio cliente (a conta é dele, não de uma barbearia)
router.put('/clientes/:id', exigirProprioCliente, clientesController.atualizarCliente);
router.delete('/clientes/:id', exigirProprioCliente, clientesController.deletarCliente);
router.put('/clientes/:id/foto', exigirProprioCliente, clientesController.atualizarFoto);
router.delete('/clientes/:id/foto', exigirProprioCliente, clientesController.removerFoto);

// Consulta de endereço por CEP (usada no cadastro, antes de ter conta)
router.get('/cep/:cep', limiteSensivel, clientesController.consultarCep);

module.exports = router;
