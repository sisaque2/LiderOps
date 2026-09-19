const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// Mapeamento dos endpoints CRUD
router.post('/', userController.createUser);           // Create
router.get('/', userController.getAllUsers);           // Read
router.put('/:id', userController.updateUser);         // Update
router.delete('/:id', userController.deleteUser);      // Delete

module.exports = router;