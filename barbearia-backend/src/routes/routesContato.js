const express = require('express');
const router = express.Router();
const contatoController = require('../controllers/contatoController');
const { limiteContato } = require('../middlewares/seguranca');

router.post('/contato', limiteContato, contatoController.enviarContato);

module.exports = router;
