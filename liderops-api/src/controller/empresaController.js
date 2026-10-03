const axios = require('axios');
const db = require('../config/db');

module.exports = {
    // CREATE VIA BRASIL API (POST /api/empresas/enriquecer)
    async enriquecerEmpresa(req, res) {
        const { cnpj } = req.body;

        try {
            const respostaApi = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            const dados = respostaApi.data;

            const razaoSocial = dados.razao_social;
            const endereco = `${dados.logradouro || ''}, ${dados.numero || 'S/N'} - ${dados.uf || ''}`.trim();
            const cnae = dados.cnae_fiscal ? String(dados.cnae_fiscal) : 'Não informado';

            const [resultado] = await db.query(
                'INSERT INTO empresas_prospectadas (cnpj, razao_social, endereco, cnae) VALUES (?, ?, ?, ?)',
                [cnpj, razaoSocial, endereco, cnae]
            );

            return res.status(201).json({
                mensagem: 'Empresa enriquecida na Brasil API e salva com sucesso!',
                dados: {
                    id_empresa: resultado.insertId,
                    cnpj,
                    razao_social: razaoSocial,
                    endereco,
                    cnae,
                    status_sincronizacao: 'Pronto HubSpot'
                }
            });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(404).json({
                    erro: 'CNPJ não encontrado',
                    mensagem: 'Este CNPJ não foi localizado na base da Brasil API / Receita Federal.'
                });
            }
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Esta empresa já foi prospectada e está cadastrada no banco.'
                });
            }
            return res.status(500).json({
                erro: 'Falha na integração externa ou ao salvar no banco.',
                detalhes: error.message
            });
        }
    },

    // CREATE MANUAL (POST /api/empresas)
    async createEmpresa(req, res) {
        const { cnpj, razao_social, endereco, cnae, status_sincronizacao } = req.body;
        try {
            const [resultado] = await db.query(
                `INSERT INTO empresas_prospectadas (cnpj, razao_social, endereco, cnae, status_sincronizacao) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    cnpj,
                    razao_social.trim(),
                    endereco || 'Não informado',
                    cnae || 'Não informado',
                    status_sincronizacao || 'Pronto HubSpot'
                ]
            );

            return res.status(201).json({
                mensagem: 'Empresa cadastrada com sucesso!',
                dados: { id_empresa: resultado.insertId, cnpj, razao_social, endereco, cnae }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Já existe uma empresa cadastrada com este CNPJ.'
                });
            }
            return res.status(500).json({
                erro: 'Erro interno ao cadastrar empresa.',
                detalhes: error.message
            });
        }
    },

    // READ ALL (GET /api/empresas)
    async getAllEmpresas(req, res) {
        try {
            const [empresas] = await db.query('SELECT * FROM empresas_prospectadas ORDER BY criado_em DESC');
            return res.status(200).json(empresas);
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro ao listar empresas prospectadas.',
                detalhes: error.message
            });
        }
    },

    // READ BY ID (GET /api/empresas/:id)
    async getEmpresaById(req, res) {
        const { id } = req.params;
        try {
            const [empresas] = await db.query('SELECT * FROM empresas_prospectadas WHERE id_empresa = ?', [id]);

            if (empresas.length === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Nenhuma empresa encontrada com o ID ${id}.`
                });
            }

            return res.status(200).json(empresas[0]);
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro ao buscar empresa.',
                detalhes: error.message
            });
        }
    },

    // UPDATE (PUT /api/empresas/:id)
    async updateEmpresa(req, res) {
        const { id } = req.params;
        const { cnpj, razao_social, endereco, cnae, status_sincronizacao } = req.body;

        try {
            const [resultado] = await db.query(
                `UPDATE empresas_prospectadas 
                 SET cnpj = ?, razao_social = ?, endereco = ?, cnae = ?, status_sincronizacao = ? 
                 WHERE id_empresa = ?`,
                [
                    cnpj,
                    razao_social.trim(),
                    endereco || 'Não informado',
                    cnae || 'Não informado',
                    status_sincronizacao || 'Pronto HubSpot',
                    id
                ]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível atualizar: empresa com ID ${id} não existe.`
                });
            }

            return res.status(200).json({
                mensagem: 'Empresa atualizada com sucesso!',
                dados: { id_empresa: Number(id), cnpj, razao_social, endereco, cnae, status_sincronizacao }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'O CNPJ informado já pertence a outra empresa cadastrada.'
                });
            }
            return res.status(500).json({
                erro: 'Erro ao atualizar empresa.',
                detalhes: error.message
            });
        }
    },

    // DELETE (DELETE /api/empresas/:id)
    async deleteEmpresa(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query('DELETE FROM empresas_prospectadas WHERE id_empresa = ?', [id]);

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível excluir: empresa com ID ${id} não existe.`
                });
            }

            return res.status(200).json({ mensagem: 'Empresa removida com sucesso!' });
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro ao remover empresa.',
                detalhes: error.message
            });
        }
    }
};