const jwt = require('jsonwebtoken');

const createUserToken = async (user, req, res) => {
    // Criação do token com validade (ex: 24h)
    const token = jwt.sign(
        {
            nome: user.nome,
            id: user.id_usuario
        },
        process.env.JWT_SECRET
    );

    res.status(200).json({
        mensagem: 'Autenticação realizada com sucesso!',
        token: token,
        usuarioId: user.id_usuario
    });
};

module.exports = createUserToken;