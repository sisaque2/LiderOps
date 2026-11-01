const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

// Gera o JWT com o mínimo necessário para autorizar as rotas (id e perfil)
function createUserToken(usuario) {
    return jwt.sign(
        {
            id: usuario.id_usuario,
            nome: usuario.nome,
            perfil: usuario.perfil
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

module.exports = createUserToken;
