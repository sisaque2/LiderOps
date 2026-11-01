// Middleware de autorização: usar sempre depois do verifyToken
const requireAdmin = (req, res, next) => {
    if (req.user?.perfil !== 'admin') {
        return res.status(403).json({
            erro: 'Acesso restrito',
            mensagem: 'Esta ação é permitida apenas para administradores.'
        });
    }
    next();
};

module.exports = { requireAdmin };
