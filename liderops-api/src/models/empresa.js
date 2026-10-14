// liderops-api/src/models/empresa.js
const db = require('../config/db');

class Empresa {
    /**
     * 1. BULK INSERT (Inserção em Lote)
     * Recebe um array de arrays com várias empresas filtradas da Receita Federal
     * e salva todas de uma única vez no MySQL.
     */
    static async inserirLoteBruto(loteEmpresas) {
        if (!loteEmpresas || loteEmpresas.length === 0) {
            return 0;
        }

        const sql = `
            INSERT IGNORE INTO empresas_receita_bruta 
            (cnpj, razao_social, nome_fantasia, cnae_principal, uf, municipio, porte, capital_social, telefone, email) 
            VALUES ?
        `;

        // No mysql2, passar [loteEmpresas] substitui o '?' por múltiplos blocos: (...), (...), (...)
        const [resultado] = await db.query(sql, [loteEmpresas]);
        return resultado.affectedRows;
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