const express = require('express');
const router = express.Router();
const iaController = require('../controller/iaController');
const verifyToken = require('../helpers/verify-token');

router.post('/gerar-email', verifyToken, iaController.gerarEmailProspeccao);

module.exports = router;
