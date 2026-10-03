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
    }
};

module.exports = empresaValidator;