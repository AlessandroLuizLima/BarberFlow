const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
const { exigirBarbeiro } = require('../middlewares/auth');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Tudo do painel do barbeiro (a barbearia vem do login)
router.get('/produtos', exigirBarbeiro, produtosController.listarProdutos);
router.post('/produtos', exigirBarbeiro, produtosController.criarProduto);
router.put('/produtos/:id', exigirBarbeiro, produtosController.atualizarProduto);
router.delete('/produtos/:id', exigirBarbeiro, produtosController.excluirProduto);
router.post('/produtos/:id/vendas', exigirBarbeiro, produtosController.registrarVenda);
router.get('/vendas-produtos', exigirBarbeiro, produtosController.listarVendas);

module.exports = router;
