const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const { validateBody, validateId } = require('../helpers/userValidator');

router.post('/', validateBody, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', validateId, userController.getUserById);
router.put('/:id', validateId, validateBody, userController.updateUser);
router.delete('/:id', validateId, userController.deleteUser);

module.exports = router;