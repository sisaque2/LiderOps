const db = require('../config/db');
const bcrypt = require('bcrypt');

// Colunas públicas: o hash da senha nunca sai do model
const CAMPOS_PUBLICOS = 'id_usuario, nome, email, cargo, perfil, criado_em';

class User {
    static async hashSenha(senha) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(senha, salt);
    }

    static async create({ nome, email, senha, cargo, perfil = 'comum' }) {
        const senhaHash = await User.hashSenha(senha);
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nome, email, senha_hash, cargo, perfil) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaHash, cargo, perfil]
        );
        return User.findById(resultado.insertId);
    }

    // Retorna o registro completo (com senha_hash) apenas para o login
    static async findByEmailComSenha(email) {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id_usuario = ?`, [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios ORDER BY nome`);
        return rows;
    }

    static async update(id, { nome, email, cargo, perfil }) {
        const [resultado] = await db.query(
            'UPDATE usuarios SET nome = ?, email = ?, cargo = ?, perfil = ? WHERE id_usuario = ?',
            [nome, email, cargo, perfil, id]
        );
        return resultado.affectedRows;
    }

    static async updateSenha(id, novaSenha) {
        const senhaHash = await User.hashSenha(novaSenha);
        const [resultado] = await db.query('UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?', [senhaHash, id]);
        return resultado.affectedRows;
    }

    static async findByIdComSenha(id) {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        return rows[0];
    }

    static async delete(id) {
        const [resultado] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        return resultado.affectedRows;
    }

    static async senhaConfere(senha, senhaHash) {
        if (!senhaHash) return false;
        return bcrypt.compare(senha, senhaHash);
    }
}

module.exports = User;
