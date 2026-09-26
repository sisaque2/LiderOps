const userValidator = (req, res, next) => {
    const { nome, email, senha, confirmasenha, cargo } = req.body;

    if (!nome) {
        return res.status(422).json({ erro: 'O nome é obrigatório!' });
    }
    if (!email) {
        return res.status(422).json({ erro: 'O e-mail é obrigatório!' });
    }
    if (!senha) {
        return res.status(422).json({ erro: 'A senha é obrigatória!' });
    }
    if (senha !== confirmasenha) {
        return res.status(422).json({ erro: 'As senhas não conferem!' });
    }
    if (!cargo) {
        return res.status(422).json({ erro: 'O cargo (ex: SDR, RevOps) é obrigatório!' });
    }

    next();
};

module.exports = userValidator;