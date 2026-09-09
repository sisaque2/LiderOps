const express = require('express');
const axios = require('axios');
const db = require('./src/config/db');
require('dotenv').config();

const app = express();
app.use(express.json());

// teste Insomnia
app.get('/api/status', (req, res) => {
    res.json({ mensagem: 'API LiderOps rodando com sucesso!' });
});

// retornar banco de dados
app.get('/api/usuarios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar usuários no banco' });
    }
});

// integração com a fonte externa das empresas
app.post('/api/empresas/enriquecer', async (req, res) => {
    const { cnpj } = req.body;

    try {
        // buscar os dados na fonte externa
        const respostaApi = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        const razaoSocial = respostaApi.data.razao_social;

        // inserção de dados no database
        const [resultado] = await db.query(
            'INSERT INTO empresas_prospectadas (cnpj, razao_social) VALUES (?, ?)',
            [cnpj, razaoSocial]
        );

        res.status(201).json({ 
            mensagem: 'Empresa integrada e salva com sucesso!', 
            dados: { cnpj, razaoSocial } 
        });

    } catch (error) {
        res.status(500).json({ erro: 'Falha na integração externa ou ao salvar no banco.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});