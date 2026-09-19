const express = require('express');
const router = express.Router();
const empresaController = require('../controller/empresaController');

// Quando acessarem /api/empresas/enriquecer, ele chama o controller
router.post('/enriquecer', empresaController.enriquecerEmpresa);

module.exports = router;