const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const verifyToken = require('../helpers/verify-token');
const { requireAdmin } = require('../helpers/verify-perfil');
const { limiteLogin, limiteCadastro } = require('../helpers/limites');
const {
    validateCadastro, validateLogin, validateUpdate, validateId, validateTrocaSenha, validateNovaSenha
} = require('../helpers/userValidator');

// Rotas públicas
router.post('/login', limiteLogin, validateLogin, userController.login);
router.post('/', limiteCadastro, validateCadastro, userController.register);

// Rotas autenticadas
router.get('/me', verifyToken, userController.me);
router.patch('/me/senha', verifyToken, validateTrocaSenha, userController.trocarMinhaSenha);
router.patch('/:id/senha', verifyToken, requireAdmin, validateId, validateNovaSenha, userController.redefinirSenha);
router.get('/', verifyToken, requireAdmin, userController.getAllUsers);
router.get('/:id', verifyToken, validateId, userController.getUserById);
router.put('/:id', verifyToken, validateId, validateUpdate, userController.updateUser);
router.delete('/:id', verifyToken, requireAdmin, validateId, userController.deleteUser);

module.exports = router;
