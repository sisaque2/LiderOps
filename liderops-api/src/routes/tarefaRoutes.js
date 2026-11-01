const express = require('express');
const router = express.Router();
const tarefaController = require('../controller/tarefaController');
const verifyToken = require('../helpers/verify-token');
const { validateBody, validateStatus, validateOculta, validateId } = require('../helpers/tarefaValidator');

router.use(verifyToken);

router.get('/', tarefaController.listar);
router.post('/', validateBody, tarefaController.criar);
router.put('/:id', validateId, validateBody, tarefaController.atualizar);
router.patch('/:id/status', validateId, validateStatus, tarefaController.moverStatus);
router.patch('/:id/ocultar', validateId, validateOculta, tarefaController.alternarOculta);
router.delete('/:id', validateId, tarefaController.excluir);

module.exports = router;
