const { rateLimit } = require('express-rate-limit');

// Resposta no mesmo formato de erro do resto da API (o front mostra o campo "mensagem")
const limitador = ({ janelaMinutos, maximo, mensagem, contarSoFalhas = false }) =>
    rateLimit({
        windowMs: janelaMinutos * 60 * 1000,
        limit: maximo,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skipSuccessfulRequests: contarSoFalhas,
        handler: (req, res) => res.status(429).json({ erro: 'Muitas tentativas', mensagem })
    });

module.exports = {
    // Força bruta de senha: 10 tentativas erradas a cada 15 minutos por IP
    limiteLogin: limitador({
        janelaMinutos: 15,
        maximo: 10,
        contarSoFalhas: true,
        mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.'
    }),
    // Tentativas de adivinhar o código de convite
    limiteCadastro: limitador({
        janelaMinutos: 60,
        maximo: 10,
        mensagem: 'Muitas tentativas de cadastro. Aguarde 1 hora e tente de novo.'
    }),
    // Protege a cota da API do Gemini
    limiteIA: limitador({
        janelaMinutos: 10,
        maximo: 30,
        mensagem: 'Limite de gerações atingido. Aguarde alguns minutos para gerar novos e-mails.'
    })
};
