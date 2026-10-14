// liderops-api/src/routes/iaRoutes.js
const express = require('express');
const router = express.Router();
const iaController = require('../controller/iaController');

router.post('/gerar-email', iaController.gerarEmailProspeccao);

module.exports = router;