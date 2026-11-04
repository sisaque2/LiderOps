const db = require('../config/db');

class EmailGerado {
    static async salvar(idUsuario, { empresa, objetivo, produto, assunto, corpo }) {
        const [resultado] = await db.query(
            `INSERT INTO emails_gerados (id_usuario, empresa, objetivo, produto, assunto, corpo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idUsuario, empresa, objetivo, produto, assunto, corpo]
        );
        const [rows] = await db.query('SELECT * FROM emails_gerados WHERE id_email = ?', [resultado.insertId]);
        return rows[0];
    }

    static async listarDoUsuario(idUsuario, limite = 20) {
        const [rows] = await db.query(
            `SELECT id_email, empresa, objetivo, produto, assunto, corpo, criado_em
             FROM emails_gerados WHERE id_usuario = ? ORDER BY criado_em DESC, id_email DESC LIMIT ?`,
            [idUsuario, limite]
        );
        return rows;
    }

    static async excluir(idEmail, idUsuario) {
        const [resultado] = await db.query(
            'DELETE FROM emails_gerados WHERE id_email = ? AND id_usuario = ?',
            [idEmail, idUsuario]
        );
        return resultado.affectedRows;
    }
}

module.exports = EmailGerado;
