const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usersController');

router.post('/users', usuarioController.criarUsuario);
router.get('/users', usuarioController.listarUsuarios);
router.put('/users/:id', usuarioController.atualizarUsuario);
router.delete('/users/:id', usuarioController.deletarUsuario);

module.exports = router;
