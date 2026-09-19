const axios = require('axios');
const db = require('../config/db');

module.exports = {
    async enriquecerEmpresa(req, res) {
        const { cnpj } = req.body;
        try {
            const respostaApi = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            const razaoSocial = respostaApi.data.razao_social;

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
    }
};