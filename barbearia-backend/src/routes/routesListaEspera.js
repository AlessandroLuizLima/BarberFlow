const express = require('express');
const router = express.Router();
const listaEsperaController = require('../controllers/listaEsperaController');

router.post('/lista-espera', listaEsperaController.entrarNaListaDeEspera);
router.get('/lista-espera', listaEsperaController.listarListaDeEspera);
router.delete('/lista-espera/:id', listaEsperaController.sairDaListaDeEspera);

module.exports = router;
