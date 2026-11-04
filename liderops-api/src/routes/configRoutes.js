const express = require('express');
const router = express.Router();
const configController = require('../controller/configController');
const verifyToken = require('../helpers/verify-token');
const { requireAdmin } = require('../helpers/verify-perfil');

router.use(verifyToken, requireAdmin);

router.get('/convite', configController.obterConvite);
router.put('/convite', configController.definirConvite);

module.exports = router;
