const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    const token = bearerHeader && bearerHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'liderops_super_secret';
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ erro: 'Token inválido.' });
    }
};

module.exports = verifyToken;