const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');
const empresaRoutes = require('./src/routes/empresaRoutes');
const iaRoutes = require('./src/routes/iaRoutes');
const inicializarBanco = require('./src/config/initDb');

const app = express();
app.use(cors());
app.use(express.json());

// 2. Rota de teste status
app.get('/api/status', (req, res) => {
    res.json({ mensagem: 'API LiderOps rodando com sucesso!' });
});

// 3. Rotas
app.use('/api/usuarios', userRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/ia', iaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    inicializarBanco();
    console.log(`Servidor rodando na porta ${PORT}`);
});