const express = require('express');
const router = express.Router();
const iaController = require('../controller/iaController');
const verifyToken = require('../helpers/verify-token');
const { limiteIA } = require('../helpers/limites');

router.use(verifyToken);

router.post('/gerar-email', limiteIA, iaController.gerarEmailProspeccao);
router.get('/emails', iaController.listarHistorico);
router.delete('/emails/:id', iaController.excluirDoHistorico);

module.exports = router;
