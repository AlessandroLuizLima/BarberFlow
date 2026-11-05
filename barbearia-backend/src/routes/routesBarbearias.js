const express = require('express');
const router = express.Router();
const barbeariasController = require('../controllers/barbeariasController');
const servicosController = require('../controllers/servicosController');
const profissionaisController = require('../controllers/profissionaisController');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);
router.param('barbeariaId', validarIdNumerico);

// Públicas: o cliente escolhe a barbearia e vê serviços e profissionais dela
router.get('/barbearias', barbeariasController.listarBarbearias);
router.get('/barbearias/:id', barbeariasController.obterBarbearia);
router.get('/barbearias/:barbeariaId/servicos', servicosController.listarServicos);
router.get('/barbearias/:barbeariaId/profissionais', profissionaisController.listarProfissionais);

module.exports = router;
