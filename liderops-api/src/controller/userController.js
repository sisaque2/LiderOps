const db = require('../config/db');

module.exports = {
    // CREATE (POST) - Criar novo usuário
    async createUser(req, res) {
        const { nome, email, cargo } = req.body;
        try {
            const [resultado] = await db.query(
                'INSERT INTO usuarios (nome, email, cargo) VALUES (?, ?, ?)',
                [nome, email, cargo]
            );
            res.status(201).json({ 
                mensagem: 'Usuário criado com sucesso!', 
                id_usuario: resultado.insertId 
            });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: error.message });
        }
    },

    // READ (GET) - Listar todos os usuários
    async getAllUsers(req, res) {
        try {
            const [usuarios] = await db.query('SELECT * FROM usuarios');
            res.status(200).json(usuarios);
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }
    },

    // UPDATE (PUT) - Atualizar dados de um usuário
    async updateUser(req, res) {
        const { id } = req.params;
        const { nome, email, cargo } = req.body;
        try {
            const [resultado] = await db.query(
                'UPDATE usuarios SET nome = ?, email = ?, cargo = ? WHERE id_usuario = ?',
                [nome, email, cargo, id]
            );
            
            if (resultado.affectedRows === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            res.status(200).json({ mensagem: 'Usuário atualizado com sucesso!' });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao atualizar usuário' });
        }
    },

    // DELETE (DELETE) - Remover um usuário
    async deleteUser(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query(
                'DELETE FROM usuarios WHERE id_usuario = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            res.status(200).json({ mensagem: 'Usuário removido com sucesso!' });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao remover usuário' });
        }
    }
};