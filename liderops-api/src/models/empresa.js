// liderops-api/src/models/empresa.js
const db = require('../config/db');

class Empresa {
    /**
     * 1. UPSERT EM LOTE (insere ou atualiza)
     * Recebe um array de arrays com empresas filtradas da Receita e grava todas de uma vez.
     * Empresas que já existem têm os dados e a data de importação atualizados.
     */
    static async salvarLoteBruto(loteEmpresas) {
        if (!loteEmpresas || loteEmpresas.length === 0) {
            return { novas: 0, atualizadas: 0 };
        }

        const sql = `
            INSERT INTO empresas_receita_bruta
            (cnpj, razao_social, nome_fantasia, cnae_principal, uf, municipio, porte, capital_social, telefone, email)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                razao_social = VALUES(razao_social),
                nome_fantasia = VALUES(nome_fantasia),
                cnae_principal = VALUES(cnae_principal),
                uf = VALUES(uf),
                municipio = VALUES(municipio),
                porte = VALUES(porte),
                capital_social = VALUES(capital_social),
                telefone = VALUES(telefone),
                email = VALUES(email),
                importado_em = CURRENT_TIMESTAMP
        `;

        // No mysql2, passar [loteEmpresas] substitui o '?' por múltiplos blocos: (...), (...), (...)
        const [resultado] = await db.query(sql, [loteEmpresas]);

        // O MySQL informa "Records: N  Duplicates: D"; duplicadas são as que já existiam e foram atualizadas
        const duplicadas = Number((resultado.info || '').match(/Duplicates:\s*(\d+)/)?.[1] || 0);
        return { novas: loteEmpresas.length - duplicadas, atualizadas: duplicadas };
    }

    static async contarBaseBruta() {
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM empresas_receita_bruta');
        return total;
    }

    // Remove empresas que não vieram na última carga (usado no modo "substituir base")
    static async removerNaoImportadasDesde(inicio) {
        const [resultado] = await db.query('DELETE FROM empresas_receita_bruta WHERE importado_em < ?', [inicio]);
        return resultado.affectedRows;
    }

    static async resumoBaseBruta() {
        const [[geral]] = await db.query(
            'SELECT COUNT(*) AS total, MAX(importado_em) AS ultima_importacao FROM empresas_receita_bruta'
        );
        const [porUf] = await db.query(
            'SELECT uf, COUNT(*) AS total FROM empresas_receita_bruta GROUP BY uf ORDER BY total DESC'
        );
        return { ...geral, por_uf: porUf };
    }

    /**
     * 2. BUSCA COM FILTROS DINÂMICOS (Garimpo do LDR)
     * Permite ao frontend buscar empresas na base bruta combinando UF, Município, CNAE e Capital Social.
     */
    static async buscarNaBaseBruta({ uf, municipio, cnae, capitalMinimo, limite = 50 }) {
        let sql = `
            SELECT cnpj, razao_social, nome_fantasia, cnae_principal, uf, municipio, porte, capital_social, telefone, email
            FROM empresas_receita_bruta
            WHERE 1=1
        `;
        const params = [];

        if (uf) {
            sql += ' AND uf = ?';
            params.push(uf.trim().toUpperCase());
        }

        if (municipio) {
            sql += ' AND municipio LIKE ?';
            params.push(`%${municipio.trim().toUpperCase()}%`);
        }

        if (cnae) {
            // Remove pontuação caso o LDR digite "10.99-6-99" para comparar apenas os números
            const cnaeLimpo = String(cnae).replace(/\D/g, '');
            sql += ' AND cnae_principal LIKE ?';
            params.push(`${cnaeLimpo}%`);
        }

        if (capitalMinimo && !isNaN(Number(capitalMinimo))) {
            sql += ' AND capital_social >= ?';
            params.push(Number(capitalMinimo));
        }

        sql += ' ORDER BY capital_social DESC LIMIT ?';
        params.push(Number(limite));

        const [rows] = await db.query(sql, params);
        return rows;
    }
}

module.exports = Empresa;