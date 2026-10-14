const empresaValidator = {
    // Valida apenas o CNPJ (usado na rota da Brasil API)
    validateCnpjOnly(req, res, next) {
        const { cnpj } = req.body;
        const cnpjLimpo = cnpj ? String(cnpj).replace(/\D/g, '') : '';

        if (!cnpjLimpo || cnpjLimpo.length !== 14) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'O CNPJ é obrigatório e deve conter exatamente 14 dígitos numéricos.'
            });
        }

        req.body.cnpj = cnpjLimpo; // Já repassa o CNPJ limpo para o controller
        next();
    },

    // Valida o corpo completo para criação e edição manual (POST e PUT)
    validateBody(req, res, next) {
        const { cnpj, razao_social } = req.body;
        const cnpjLimpo = cnpj ? String(cnpj).replace(/\D/g, '') : '';

        if (!cnpjLimpo || cnpjLimpo.length !== 14) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'O CNPJ é obrigatório e deve conter exatamente 14 dígitos numéricos.'
            });
        }

        if (!razao_social || razao_social.trim().length < 3) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'A Razão Social é obrigatória e deve ter pelo menos 3 caracteres.'
            });
        }

        req.body.cnpj = cnpjLimpo;
        next();
    },

    // Valida se o ID na URL é um número inteiro positivo
    validateId(req, res, next) {
        const { id } = req.params;

        if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                erro: 'Parâmetro inválido',
                mensagem: 'O ID da empresa informado na URL deve ser um número inteiro positivo.'
            });
        }

        next();
    },

    // Valida um array de CNPJs para o enriquecimento em lote (máximo de 50 por requisição)
    validateCnpjLote(req, res, next) {
        const { cnpjs } = req.body;

        if (!Array.isArray(cnpjs) || cnpjs.length === 0) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Envie uma lista (array) contendo pelo menos 1 CNPJ no campo "cnpjs".'
            });
        }

        if (cnpjs.length > 50) {
            return res.status(422).json({
                erro: 'Limite excedido',
                mensagem: 'O lote máximo permitido por operação é de 50 CNPJs para evitar bloqueio na Brasil API.'
            });
        }

        const cnpjsLimpos = cnpjs
            .map(c => String(c).replace(/\D/g, ''))
            .filter(c => c.length === 14);

        if (cnpjsLimpos.length === 0) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Nenhum CNPJ válido (com 14 dígitos numéricos) foi encontrado no lote enviado.'
            });
        }

        // Remove eventuais CNPJs duplicados que o LDR tenha colado sem querer
        req.body.cnpjs = [...new Set(cnpjsLimpos)];
        next();
    }
};

module.exports = empresaValidator;