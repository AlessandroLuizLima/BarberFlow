const express = require('express');
const router = express.Router();
const imagensController = require('../controllers/imagensController');

router.get('/imagens/:id', imagensController.obterImagem);

module.exports = router;
