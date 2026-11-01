const db = require('../config/db');

// prazo volta como texto 'AAAA-MM-DD' para não sofrer conversão de fuso no JSON
const CAMPOS = `id_tarefa, titulo, descricao, status, prioridade,
    DATE_FORMAT(prazo, '%Y-%m-%d') AS prazo, oculta, criado_em, atualizado_em`;

class Tarefa {
    static async listarDoUsuario(idUsuario) {
        const [rows] = await db.query(
            `SELECT ${CAMPOS} FROM tarefas WHERE id_usuario = ?
             ORDER BY FIELD(prioridade, 'alta', 'media', 'baixa'), prazo IS NULL, prazo, criado_em`,
            [idUsuario]
        );
        return rows.map(t => ({ ...t, oculta: Boolean(t.oculta) }));
    }

    static async buscar(idTarefa, idUsuario) {
        const [rows] = await db.query(
            `SELECT ${CAMPOS} FROM tarefas WHERE id_tarefa = ? AND id_usuario = ?`,
            [idTarefa, idUsuario]
        );
        return rows[0] ? { ...rows[0], oculta: Boolean(rows[0].oculta) } : undefined;
    }

    static async criar(idUsuario, { titulo, descricao, status, prioridade, prazo }) {
        const [resultado] = await db.query(
            `INSERT INTO tarefas (id_usuario, titulo, descricao, status, prioridade, prazo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idUsuario, titulo, descricao, status, prioridade, prazo]
        );
        return Tarefa.buscar(resultado.insertId, idUsuario);
    }

    // Atualiza só os campos enviados; o WHERE com id_usuario impede mexer em tarefa de outra pessoa
    static async atualizar(idTarefa, idUsuario, campos) {
        const colunas = Object.keys(campos);
        if (colunas.length === 0) return 0;

        const sets = colunas.map(c => `${c} = ?`).join(', ');
        const [resultado] = await db.query(
            `UPDATE tarefas SET ${sets} WHERE id_tarefa = ? AND id_usuario = ?`,
            [...colunas.map(c => campos[c]), idTarefa, idUsuario]
        );
        return resultado.affectedRows;
    }

    static async excluir(idTarefa, idUsuario) {
        const [resultado] = await db.query(
            'DELETE FROM tarefas WHERE id_tarefa = ? AND id_usuario = ?',
            [idTarefa, idUsuario]
        );
        return resultado.affectedRows;
    }
}

module.exports = Tarefa;
