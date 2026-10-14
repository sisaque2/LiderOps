const axios = require('axios');
const db = require('../config/db');
const Empresa = require('../models/empresa');
const { processarArquivoReceita } = require('../services/receitaService');
const ExcelJS = require('exceljs');

// Função utilitária que cria um "freio" (delay em milissegundos) usando Promises
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    },

    // GARIMPO NA BASE BRUTA (GET /api/empresas/garimpar?uf=SP&cnae=10&capitalMinimo=500000)
    async garimparBaseBruta(req, res) {
        try {
            const { uf, municipio, cnae, capitalMinimo, limite } = req.query;
            const empresas = await Empresa.buscarNaBaseBruta({
                uf,
                municipio,
                cnae,
                capitalMinimo,
                limite: limite || 50
            });
            return res.status(200).json({
                total_encontrado: empresas.length,
                dados: empresas
            });
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro ao consultar a base bruta da Receita Federal.',
                detalhes: error.message
            });
        }
    },

    // IMPORTAÇÃO VIA STREAM (POST /api/empresas/importar-receita)
    async importarBaseReceita(req, res) {
        const { caminhoArquivo } = req.body;
        if (!caminhoArquivo) {
            return res.status(400).json({
                erro: 'Parâmetro obrigatório',
                mensagem: 'Informe o "caminhoArquivo" do CSV a ser processado.'
            });
        }

        try {
            const resultado = await processarArquivoReceita(caminhoArquivo);
            return res.status(200).json({
                mensagem: 'Processamento via Stream concluído com sucesso!',
                estatisticas: resultado
            });
        } catch (error) {
            return res.status(500).json({
                erro: 'Falha ao processar arquivo da Receita Federal.',
                detalhes: error.message
            });
        }
    },

    // ENRIQUECIMENTO EM LOTE COM CONTROLE DE FILA (POST /api/empresas/enriquecer-lote)
    async enriquecerLote(req, res) {
        const { cnpjs } = req.body;
        const sucesso = [];
        const falhas = [];

        for (let i = 0; i < cnpjs.length; i++) {
            const cnpj = cnpjs[i];

            try {
                const respostaApi = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
                const dados = respostaApi.data;

                const razaoSocial = dados.razao_social || 'Não informado';
                const endereco = `${dados.logradouro || ''}, ${dados.numero || 'S/N'} - ${dados.municipio || ''}/${dados.uf || ''}`.trim();
                const cnae = dados.cnae_fiscal ? String(dados.cnae_fiscal) : 'Não informado';

                await db.query(
                    `INSERT INTO empresas_prospectadas (cnpj, razao_social, endereco, cnae, status_sincronizacao)
                     VALUES (?, ?, ?, ?, 'Pronto HubSpot')
                     ON DUPLICATE KEY UPDATE
                        razao_social = VALUES(razao_social),
                        endereco = VALUES(endereco),
                        cnae = VALUES(cnae)`,
                    [cnpj, razaoSocial, endereco, cnae]
                );

                sucesso.push({
                    cnpj,
                    razao_social: razaoSocial,
                    endereco,
                    cnae,
                    status_sincronizacao: 'Pronto HubSpot'
                });
            } catch (error) {
                falhas.push({
                    cnpj,
                    motivo: error.response?.status === 404 ? 'CNPJ não encontrado na Receita' : error.message
                });
            }

            // Aplica o freio de 800ms entre um CNPJ e outro (exceto no último item da fila)
            if (i < cnpjs.length - 1) {
                await esperar(800);
            }
        }

        return res.status(200).json({
            mensagem: 'Processamento de lote finalizado.',
            resumo: {
                total_processado: cnpjs.length,
                total_sucesso: sucesso.length,
                total_falhas: falhas.length
            },
            dados: sucesso,
            erros: falhas
        });
    },
    // EXPORTAÇÃO PARA EXCEL FORMATADO (GET /api/empresas/exportar)
    async exportarEmpresasExcel(req, res) {
        try {
            const [empresas] = await db.query(
                'SELECT cnpj, razao_social, endereco, cnae, status_sincronizacao, criado_em FROM empresas_prospectadas ORDER BY criado_em DESC'
            );

            // 1. Cria um novo arquivo Excel em memória e adiciona uma aba
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Leads Higienizados');

            // 2. Define as colunas, chaves de mapeamento e larguras automáticas
            worksheet.columns = [
                { header: 'CNPJ', key: 'cnpj', width: 20 },
                { header: 'Razão Social', key: 'razao_social', width: 42 },
                { header: 'Endereço Principal', key: 'endereco', width: 48 },
                { header: 'CNAE', key: 'cnae', width: 16 },
                { header: 'Status HubSpot', key: 'status_sincronizacao', width: 20 },
                { header: 'Data de Captura', key: 'criado_em', width: 22 }
            ];

            // 3. Estiliza a linha de cabeçalho (Linha 1: Fundo Azul Escuro #0F172A e Texto Branco em Negrito)
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0F172A' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 24;

            // 4. Popula as linhas com os dados do banco MySQL
            empresas.forEach(emp => {
                worksheet.addRow({
                    cnpj: emp.cnpj,
                    razao_social: emp.razao_social,
                    endereco: emp.endereco,
                    cnae: emp.cnae,
                    status_sincronizacao: emp.status_sincronizacao,
                    criado_em: emp.criado_em ? new Date(emp.criado_em).toLocaleString('pt-BR') : ''
                });
            });

            // 5. Configura os Headers HTTP para o navegador baixar o arquivo automaticamente
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="LiderOps_Base_Higienizada.xlsx"'
            );

            // 6. Escreve o binário do Excel direto no fluxo de resposta (Stream do Express)
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro ao gerar planilha Excel.',
                detalhes: error.message
            });
        }
    }
};