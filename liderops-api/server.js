const express = require('express');
require('dotenv').config();

// 1. Importação dos roteadores
const userRoutes = require('./src/routes/userRoutes');
const empresaRoutes = require('./src/routes/empresaRoutes');

const app = express();
app.use(express.json());

// 2. Rota de teste status
app.get('/api/status', (req, res) => {
    res.json({ mensagem: 'API LiderOps rodando com sucesso!' });
});

// 3. Rotas
app.use('/api/usuarios', userRoutes);
app.use('/api/empresas', empresaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});