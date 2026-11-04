const db = require('../config/db');

// Configurações simples do sistema no formato chave/valor (ex.: codigo_convite)
class Configuracao {
    static async obter(chave) {
        const [rows] = await db.query('SELECT valor FROM configuracoes WHERE chave = ?', [chave]);
        return rows[0]?.valor ?? null;
    }

    static async definir(chave, valor) {
        await db.query(
            'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
            [chave, valor]
        );
    }
}

module.exports = Configuracao;
