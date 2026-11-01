const jwt = require('jsonwebtoken');
const getToken = require('./get-token');
const { JWT_SECRET } = require('../config/auth');

// Middleware de autenticação: só deixa passar requisições com JWT válido
const verifyToken = (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            erro: 'Acesso negado',
            mensagem: 'Faça login para acessar este recurso.'
        });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        const expirado = error.name === 'TokenExpiredError';
        return res.status(401).json({
            erro: expirado ? 'Sessão expirada' : 'Token inválido',
            mensagem: expirado
                ? 'Sua sessão expirou. Faça login novamente.'
                : 'Token de acesso inválido. Faça login novamente.'
        });
    }
};

module.exports = verifyToken;
