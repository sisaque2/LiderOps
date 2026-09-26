const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    static async create(nome, email, senha, cargo) {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(senha, salt);

        const [resultado] = await db.query(
            'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (?, ?, ?, ?)',
            [nome, email, passwordHash, cargo]
        );
        return resultado.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    }
}

module.exports = User;