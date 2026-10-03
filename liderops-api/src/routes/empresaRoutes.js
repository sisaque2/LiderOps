const express = require('express');
const router = express.Router();
const empresaController = require('../controller/empresaController');
const { validateCnpjOnly, validateBody, validateId } = require('../helpers/empresaValidator');

// Rota de enriquecimento automático via Brasil API
router.post('/enriquecer', validateCnpjOnly, empresaController.enriquecerEmpresa);

// Rotas CRUD padrão
router.post('/', validateBody, empresaController.createEmpresa);
router.get('/', empresaController.getAllEmpresas);
router.get('/:id', validateId, empresaController.getEmpresaById);
router.put('/:id', validateId, validateBody, empresaController.updateEmpresa);
router.delete('/:id', validateId, empresaController.deleteEmpresa);

module.exports = router;