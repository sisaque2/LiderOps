const os = require('os');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const empresaController = require('../controller/empresaController');
const verifyToken = require('../helpers/verify-token');
const { requireAdmin } = require('../helpers/verify-perfil');
const { validateCnpjOnly, validateBody, validateId, validateCnpjLote } = require('../helpers/empresaValidator');

// Upload do CSV da Receita: vai para a pasta temporária do sistema e é apagado depois de processado
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, /\.(csv|txt)$/i.test(file.originalname))
});

function receberArquivo(req, res, next) {
    upload.single('arquivo')(req, res, (erro) => {
        if (erro?.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ erro: 'Arquivo muito grande', mensagem: 'O arquivo pode ter no máximo 200 MB.' });
        }
        if (erro) {
            return res.status(400).json({ erro: 'Falha no upload', mensagem: erro.message });
        }
        next();
    });
}

// Todas as rotas de empresas exigem login
router.use(verifyToken);

// Motor de Prospecção em Massa (Garimpo, ETL e Enriquecimento em Lote)
router.get('/garimpar', empresaController.garimparBaseBruta);
router.post('/importar-receita', requireAdmin, receberArquivo, empresaController.importarBaseReceita);
router.get('/receita/resumo', requireAdmin, empresaController.resumoBaseReceita);
router.post('/enriquecer-lote', validateCnpjLote, empresaController.enriquecerLote);
router.get('/exportar', empresaController.exportarEmpresasExcel);
router.post('/exportar', empresaController.exportarEmpresasExcel);

// Enriquecimento unitário via Brasil API
router.post('/enriquecer', validateCnpjOnly, empresaController.enriquecerEmpresa);

// CRUD padrão (exclusão restrita ao admin)
router.post('/', validateBody, empresaController.createEmpresa);
router.get('/', empresaController.getAllEmpresas);
router.get('/:id', validateId, empresaController.getEmpresaById);
router.put('/:id', validateId, validateBody, empresaController.updateEmpresa);
router.delete('/:id', requireAdmin, validateId, empresaController.deleteEmpresa);

module.exports = router;
