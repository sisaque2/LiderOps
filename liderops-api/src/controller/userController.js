const User = require('../models/User');
const createUserToken = require('../helpers/create-user-token');
const Configuracao = require('../models/configuracao');
const { normalizarCodigo } = require('../helpers/codigo-convite');

const erroInterno = (res, mensagem, error) =>
    res.status(500).json({ erro: mensagem, detalhes: error.message });

module.exports = {
    // CADASTRO PÚBLICO (POST /api/usuarios) — sempre cria perfil "comum" e já devolve a sessão
    async register(req, res) {
        const { nome, email, senha, cargo, codigoConvite } = req.body;
        try {
            const codigoValido = await Configuracao.obter('codigo_convite');
            if (!codigoValido || normalizarCodigo(codigoConvite) !== codigoValido) {
                return res.status(403).json({
                    erro: 'Código de convite inválido',
                    mensagem: 'Código de convite inválido. Peça o código atual a um administrador.'
                });
            }

            const usuario = await User.create({ nome, email, senha, cargo, perfil: 'comum' });
            return res.status(201).json({
                mensagem: 'Conta criada com sucesso!',
                token: createUserToken(usuario),
                usuario
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Já existe um usuário cadastrado com este e-mail.'
                });
            }
            return erroInterno(res, 'Erro interno ao criar usuário.', error);
        }
    },

    // LOGIN (POST /api/usuarios/login)
    async login(req, res) {
        const { email, senha } = req.body;
        try {
            const registro = await User.findByEmailComSenha(email);
            const senhaOk = registro && (await User.senhaConfere(senha, registro.senha_hash));

            // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails existem
            if (!senhaOk) {
                return res.status(401).json({
                    erro: 'Credenciais inválidas',
                    mensagem: 'E-mail ou senha incorretos.'
                });
            }

            const usuario = await User.findById(registro.id_usuario);
            return res.status(200).json({
                mensagem: 'Autenticação realizada com sucesso!',
                token: createUserToken(usuario),
                usuario
            });
        } catch (error) {
            return erroInterno(res, 'Erro interno ao autenticar.', error);
        }
    },

    // USUÁRIO DA SESSÃO (GET /api/usuarios/me)
    async me(req, res) {
        try {
            const usuario = await User.findById(req.user.id);
            if (!usuario) {
                return res.status(401).json({
                    erro: 'Sessão inválida',
                    mensagem: 'Usuário da sessão não existe mais. Faça login novamente.'
                });
            }
            return res.status(200).json(usuario);
        } catch (error) {
            return erroInterno(res, 'Erro interno ao buscar a sessão.', error);
        }
    },

    // TROCA DE SENHA DO PRÓPRIO USUÁRIO (PATCH /api/usuarios/me/senha)
    async trocarMinhaSenha(req, res) {
        const { senhaAtual, novaSenha } = req.body;
        try {
            const registro = await User.findByIdComSenha(req.user.id);
            if (!registro) {
                return res.status(401).json({ erro: 'Sessão inválida', mensagem: 'Faça login novamente.' });
            }
            if (!(await User.senhaConfere(senhaAtual, registro.senha_hash))) {
                // 400 e não 401: o token é válido, só a senha digitada está errada (401 derrubaria a sessão no front)
                return res.status(400).json({ erro: 'Senha incorreta', mensagem: 'A senha atual está incorreta.' });
            }
            await User.updateSenha(req.user.id, novaSenha);
            return res.status(200).json({ mensagem: 'Senha alterada com sucesso!' });
        } catch (error) {
            return erroInterno(res, 'Erro interno ao alterar a senha.', error);
        }
    },

    // REDEFINIÇÃO PELO ADMIN (PATCH /api/usuarios/:id/senha) — usada no "esqueci minha senha"
    async redefinirSenha(req, res) {
        const id = Number(req.params.id);
        try {
            const alterados = await User.updateSenha(id, req.body.novaSenha);
            if (alterados === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Usuário com ID ${id} não existe.`
                });
            }
            return res.status(200).json({ mensagem: 'Senha redefinida. Repasse a nova senha ao usuário.' });
        } catch (error) {
            return erroInterno(res, 'Erro interno ao redefinir a senha.', error);
        }
    },

    // READ ALL (GET /api/usuarios) — admin
    async getAllUsers(req, res) {
        try {
            const usuarios = await User.findAll();
            return res.status(200).json(usuarios);
        } catch (error) {
            return erroInterno(res, 'Erro interno ao buscar usuários.', error);
        }
    },

    // READ BY ID (GET /api/usuarios/:id) — admin ou o próprio usuário
    async getUserById(req, res) {
        const id = Number(req.params.id);
        if (req.user.perfil !== 'admin' && req.user.id !== id) {
            return res.status(403).json({
                erro: 'Acesso restrito',
                mensagem: 'Você só pode visualizar o seu próprio cadastro.'
            });
        }

        try {
            const usuario = await User.findById(id);
            if (!usuario) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Nenhum usuário encontrado com o ID ${id}.`
                });
            }
            return res.status(200).json(usuario);
        } catch (error) {
            return erroInterno(res, 'Erro interno ao buscar usuário.', error);
        }
    },

    // UPDATE (PUT /api/usuarios/:id) — admin edita qualquer um; comum edita só a si mesmo e não muda perfil
    async updateUser(req, res) {
        const id = Number(req.params.id);
        const ehAdmin = req.user.perfil === 'admin';
        const ehProprio = req.user.id === id;

        if (!ehAdmin && !ehProprio) {
            return res.status(403).json({
                erro: 'Acesso restrito',
                mensagem: 'Você só pode editar o seu próprio cadastro.'
            });
        }

        try {
            const atual = await User.findById(id);
            if (!atual) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível atualizar: usuário com ID ${id} não existe.`
                });
            }

            const perfilSolicitado = req.body.perfil ?? atual.perfil;
            if (perfilSolicitado !== atual.perfil && (!ehAdmin || ehProprio)) {
                return res.status(403).json({
                    erro: 'Acesso restrito',
                    mensagem: ehProprio
                        ? 'Você não pode alterar o seu próprio perfil de acesso.'
                        : 'Apenas administradores podem alterar perfis.'
                });
            }

            const { nome, email, cargo } = req.body;
            await User.update(id, { nome, email, cargo, perfil: perfilSolicitado });
            const usuario = await User.findById(id);

            return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso!', dados: usuario });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Este e-mail já está em uso por outro usuário.'
                });
            }
            return erroInterno(res, 'Erro interno ao atualizar usuário.', error);
        }
    },

    // DELETE (DELETE /api/usuarios/:id) — admin, sem poder excluir a própria conta
    async deleteUser(req, res) {
        const id = Number(req.params.id);
        if (req.user.id === id) {
            return res.status(400).json({
                erro: 'Operação inválida',
                mensagem: 'Você não pode excluir a sua própria conta enquanto está logado.'
            });
        }

        try {
            const removidos = await User.delete(id);
            if (removidos === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível excluir: usuário com ID ${id} não existe.`
                });
            }
            return res.status(200).json({ mensagem: 'Usuário removido com sucesso!' });
        } catch (error) {
            return erroInterno(res, 'Erro interno ao remover usuário.', error);
        }
    }
};
