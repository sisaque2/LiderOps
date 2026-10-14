// liderops-api/src/config/initDb.js
const db = require('./db');

async function inicializarBanco() {
    try {
        // 1. Garante a tabela de Usuários (usada em user.js e userController.js)
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                senha_hash VARCHAR(255) DEFAULT NULL,
                cargo VARCHAR(80) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Garante a tabela de Empresas Prospectadas (usada em empresaController.js)
        await db.query(`
            CREATE TABLE IF NOT EXISTS empresas_prospectadas (
                id_empresa INT AUTO_INCREMENT PRIMARY KEY,
                cnpj CHAR(14) NOT NULL UNIQUE,
                razao_social VARCHAR(255) NOT NULL,
                endereco VARCHAR(255) DEFAULT 'Não informado',
                cnae VARCHAR(50) DEFAULT 'Não informado',
                status_sincronizacao VARCHAR(50) DEFAULT 'Pronto HubSpot',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Garante a nova tabela da Base Bruta da Receita Federal (Motor de Garimpo)
        await db.query(`
            CREATE TABLE IF NOT EXISTS empresas_receita_bruta (
                cnpj CHAR(14) NOT NULL,
                razao_social VARCHAR(255) NOT NULL,
                nome_fantasia VARCHAR(255) DEFAULT NULL,
                cnae_principal VARCHAR(10) NOT NULL,
                uf CHAR(2) NOT NULL,
                municipio VARCHAR(100) NOT NULL,
                porte VARCHAR(20) NOT NULL,
                capital_social DECIMAL(15, 2) DEFAULT 0.00,
                telefone VARCHAR(30) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                importado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (cnpj),
                INDEX idx_filtro_icp (uf, cnae_principal, capital_social),
                INDEX idx_municipio (municipio)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Estrutura do banco de dados verificada e pronta!');
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar as tabelas do banco:', error.message);
        process.exit(1); // Para o servidor se o banco estiver inacessível ou com erro
    }
}

module.exports = inicializarBanco;