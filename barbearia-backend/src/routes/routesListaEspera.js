const express = require('express');
const router = express.Router();
const listaEsperaController = require('../controllers/listaEsperaController');
const { exigirLogin } = require('../middlewares/auth');
const validarIdNumerico = require('./_id');

router.param('id', validarIdNumerico);

// Cliente: entra, vê e sai da própria fila. Barbeiro: vê e remove qualquer entrada.
router.post('/lista-espera', exigirLogin, listaEsperaController.entrarNaListaDeEspera);
router.get('/lista-espera', exigirLogin, listaEsperaController.listarListaDeEspera);
router.delete('/lista-espera/:id', exigirLogin, listaEsperaController.sairDaListaDeEspera);

module.exports = router;
