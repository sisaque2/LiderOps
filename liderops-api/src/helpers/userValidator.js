const { PERFIS } = require('../config/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const falha = (res, mensagem) => res.status(422).json({ erro: 'Validação falhou', mensagem });

// Regras comuns de nome, e-mail e cargo (cadastro e edição)
function validarDadosBasicos(body) {
    const { nome, email, cargo } = body;

    if (!nome || String(nome).trim().length < 3) {
        return 'O nome é obrigatório e deve ter pelo menos 3 caracteres.';
    }
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
        return 'Forneça um endereço de e-mail válido.';
    }
    if (!cargo || String(cargo).trim() === '') {
        return 'O cargo (ex: SDR, RevOps, Gestor) é obrigatório.';
    }
    return null;
}

const userValidator = {
    validateCadastro(req, res, next) {
        const erro = validarDadosBasicos(req.body);
        if (erro) return falha(res, erro);

        const { senha } = req.body;
        if (!senha || String(senha).length < 6) {
            return falha(res, 'A senha é obrigatória e deve ter pelo menos 6 caracteres.');
        }

        req.body.nome = req.body.nome.trim();
        req.body.email = req.body.email.trim().toLowerCase();
        req.body.cargo = req.body.cargo.trim();
        next();
    },

    validateLogin(req, res, next) {
        const { email, senha } = req.body;

        if (!email || !EMAIL_REGEX.test(String(email).trim())) {
            return falha(res, 'Informe um e-mail válido.');
        }
        if (!senha) {
            return falha(res, 'Informe a senha.');
        }

        req.body.email = String(email).trim().toLowerCase();
        next();
    },

    validateTrocaSenha(req, res, next) {
        const { senhaAtual, novaSenha } = req.body;
        if (!senhaAtual) return falha(res, 'Informe a senha atual.');
        if (!novaSenha || String(novaSenha).length < 6) {
            return falha(res, 'A nova senha deve ter pelo menos 6 caracteres.');
        }
        if (senhaAtual === novaSenha) return falha(res, 'A nova senha deve ser diferente da atual.');
        next();
    },

    validateNovaSenha(req, res, next) {
        const { novaSenha } = req.body;
        if (!novaSenha || String(novaSenha).length < 6) {
            return falha(res, 'A nova senha deve ter pelo menos 6 caracteres.');
        }
        next();
    },

    validateUpdate(req, res, next) {
        const erro = validarDadosBasicos(req.body);
        if (erro) return falha(res, erro);

        const { perfil } = req.body;
        if (perfil !== undefined && !PERFIS.includes(perfil)) {
            return falha(res, `Perfil inválido. Use: ${PERFIS.join(' ou ')}.`);
        }

        req.body.nome = req.body.nome.trim();
        req.body.email = req.body.email.trim().toLowerCase();
        req.body.cargo = req.body.cargo.trim();
        next();
    },

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
