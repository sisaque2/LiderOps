const db = require('../config/db');

module.exports = {
    // CREATE (POST)
    async createUser(req, res) {
        const { nome, email, cargo } = req.body;
        try {
            const [resultado] = await db.query(
                'INSERT INTO usuarios (nome, email, cargo) VALUES (?, ?, ?)',
                [nome.trim(), email.trim().toLowerCase(), cargo.trim()]
            );
            return res.status(201).json({
                mensagem: 'Usuário criado com sucesso!',
                dados: { id_usuario: resultado.insertId, nome, email, cargo }
            });
        } catch (error) {
            // Tratamento de erro específico para e-mail já cadastrado (UNIQUE no MySQL)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Já existe um usuário cadastrado com este e-mail.'
                });
            }
            return res.status(500).json({
                erro: 'Erro interno do servidor ao criar usuário.',
                detalhes: error.message
            });
        }
    },

    // READ ALL (GET)
    async getAllUsers(req, res) {
        try {
            const [usuarios] = await db.query('SELECT * FROM usuarios');
            return res.status(200).json(usuarios);
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro interno ao buscar usuários.',
                detalhes: error.message
            });
        }
    },

    // READ BY ID (GET /:id)
    async getUserById(req, res) {
        const { id } = req.params;
        try {
            const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
            
            if (usuarios.length === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Nenhum usuário encontrado com o ID ${id}.`
                });
            }

            return res.status(200).json(usuarios[0]);
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro interno ao buscar usuário.',
                detalhes: error.message
            });
        }
    },

    // UPDATE (PUT /:id)
    async updateUser(req, res) {
        const { id } = req.params;
        const { nome, email, cargo } = req.body;
        try {
            const [resultado] = await db.query(
                'UPDATE usuarios SET nome = ?, email = ?, cargo = ? WHERE id_usuario = ?',
                [nome.trim(), email.trim().toLowerCase(), cargo.trim(), id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível atualizar: usuário com ID ${id} não existe.`
                });
            }

            return res.status(200).json({
                mensagem: 'Usuário atualizado com sucesso!',
                dados: { id_usuario: Number(id), nome, email, cargo }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Conflito de dados',
                    mensagem: 'Este e-mail já está em uso por outro usuário.'
                });
            }
            return res.status(500).json({
                erro: 'Erro interno ao atualizar usuário.',
                detalhes: error.message
            });
        }
    },

    // DELETE (DELETE /:id)
    async deleteUser(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: 'Não encontrado',
                    mensagem: `Não foi possível excluir: usuário com ID ${id} não existe.`
                });
            }

            return res.status(200).json({ mensagem: 'Usuário removido com sucesso!' });
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro interno ao remover usuário.',
                detalhes: error.message
            });
        }
    }
};