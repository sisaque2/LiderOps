// Extrai o token do header "Authorization: Bearer <token>"
const getToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [tipo, token] = authHeader.split(' ');
    if (tipo !== 'Bearer' || !token) return null;

    return token;
};

module.exports = getToken;
