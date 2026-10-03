const userValidator = {
    // Valida os dados enviados no corpo (POST e PUT)
    validateBody(req, res, next) {
        const { nome, email, cargo } = req.body;

        if (!nome || nome.trim().length < 3) {
            return res.status(422).json({ 
                erro: 'Validação falhou', 
                mensagem: 'O nome é obrigatório e deve ter pelo menos 3 caracteres.' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(422).json({ 
                erro: 'Validação falhou', 
                mensagem: 'Forneça um endereço de e-mail válido.' 
            });
        }

        if (!cargo || cargo.trim() === '') {
            return res.status(422).json({ 
                erro: 'Validação falhou', 
                mensagem: 'O cargo (ex: SDR, RevOps, Gestor) é obrigatório.' 
            });
        }

        next();
    },

    // Valida se o ID na URL é um número (GET por ID, PUT e DELETE)
    validateId(req, res, next) {
        const { id } = req.params;

        if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({ 
                erro: 'Parâmetro inválido', 
                mensagem: 'O ID informado na URL deve ser um número inteiro positivo.' 
            });
        }

        next();
    }
};

module.exports = userValidator;