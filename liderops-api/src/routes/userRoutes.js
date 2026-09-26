const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const userValidator = require('../helpers/userValidator');

// Mapeamento dos endpoints CRUD
router.post('/register', userValidator, userController.createUser);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;