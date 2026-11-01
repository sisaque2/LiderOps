const express = require('express');
const router = express.Router();
const empresaController = require('../controller/empresaController');
const verifyToken = require('../helpers/verify-token');
const { requireAdmin } = require('../helpers/verify-perfil');
const { validateCnpjOnly, validateBody, validateId, validateCnpjLote } = require('../helpers/empresaValidator');

// Todas as rotas de empresas exigem login
router.use(verifyToken);

// Motor de Prospecção em Massa (Garimpo, ETL e Enriquecimento em Lote)
router.get('/garimpar', empresaController.garimparBaseBruta);
router.post('/importar-receita', requireAdmin, empresaController.importarBaseReceita);
router.post('/enriquecer-lote', validateCnpjLote, empresaController.enriquecerLote);
router.get('/exportar', empresaController.exportarEmpresasExcel);

// Enriquecimento unitário via Brasil API
router.post('/enriquecer', validateCnpjOnly, empresaController.enriquecerEmpresa);

// CRUD padrão (exclusão restrita ao admin)
router.post('/', validateBody, empresaController.createEmpresa);
router.get('/', empresaController.getAllEmpresas);
router.get('/:id', validateId, empresaController.getEmpresaById);
router.put('/:id', validateId, validateBody, empresaController.updateEmpresa);
router.delete('/:id', requireAdmin, validateId, empresaController.deleteEmpresa);

module.exports = router;
