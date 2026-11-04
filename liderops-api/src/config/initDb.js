const db = require('./db');
const User = require('../models/User');
const Empresa = require('../models/empresa');
const Configuracao = require('../models/configuracao');
const { linhasSeedReceita } = require('./seedReceita');
const { gerarCodigoConvite } = require('../helpers/codigo-convite');

// Colunas esperadas em cada tabela. Usadas para atualizar bancos criados por versões antigas do projeto.
// As definições aceitam nulo ou têm default para poderem ser adicionadas em tabelas que já têm linhas.
const COLUNAS_ESPERADAS = {
    usuarios: {
        nome: "VARCHAR(150) NOT NULL DEFAULT ''",
        email: 'VARCHAR(150) NULL',
        senha_hash: 'VARCHAR(255) NULL',
        cargo: "VARCHAR(80) NOT NULL DEFAULT ''",
        perfil: "ENUM('admin', 'comum') NOT NULL DEFAULT 'comum'",
        criado_em: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    empresas_prospectadas: {
        razao_social: "VARCHAR(255) NOT NULL DEFAULT ''",
        endereco: "VARCHAR(255) DEFAULT 'Não informado'",
        cnae: "VARCHAR(50) DEFAULT 'Não informado'",
        status_sincronizacao: "VARCHAR(50) DEFAULT 'Enriquecida'",
        criado_em: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    empresas_receita_bruta: {
        razao_social: "VARCHAR(255) NOT NULL DEFAULT ''",
        nome_fantasia: 'VARCHAR(255) NULL',
        cnae_principal: "VARCHAR(10) NOT NULL DEFAULT ''",
        uf: "CHAR(2) NOT NULL DEFAULT ''",
        municipio: "VARCHAR(100) NOT NULL DEFAULT ''",
        porte: "VARCHAR(20) NOT NULL DEFAULT ''",
        capital_social: 'DECIMAL(15, 2) DEFAULT 0.00',
        telefone: 'VARCHAR(30) NULL',
        email: 'VARCHAR(150) NULL',
        importado_em: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    }
};

async function colunasDaTabela(tabela) {
    const [colunas] = await db.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLUMN_KEY
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tabela]
    );
    return colunas;
}

// Migração: adiciona colunas que faltam e libera colunas antigas obrigatórias que o código atual não preenche
async function atualizarEstrutura(tabela, esperadas) {
    const existentes = await colunasDaTabela(tabela);
    const nomes = new Set(existentes.map(c => c.COLUMN_NAME));

    for (const [coluna, definicao] of Object.entries(esperadas)) {
        if (!nomes.has(coluna)) {
            await db.query(`ALTER TABLE \`${tabela}\` ADD COLUMN \`${coluna}\` ${definicao}`);
            console.log(`🔧 Coluna ${tabela}.${coluna} adicionada.`);
        }
    }

    const legadasObrigatorias = existentes.filter(c =>
        !(c.COLUMN_NAME in esperadas) &&
        c.IS_NULLABLE === 'NO' &&
        c.COLUMN_DEFAULT === null &&
        !c.EXTRA.includes('auto_increment') &&
        c.COLUMN_KEY !== 'PRI' &&
        !['cnpj', 'id_usuario', 'id_empresa'].includes(c.COLUMN_NAME)
    );
    for (const c of legadasObrigatorias) {
        await db.query(`ALTER TABLE \`${tabela}\` MODIFY \`${c.COLUMN_NAME}\` ${c.COLUMN_TYPE} NULL`);
        console.log(`🔧 Coluna antiga ${tabela}.${c.COLUMN_NAME} agora aceita valor vazio.`);
    }
}

// Código exigido no cadastro público; o admin troca pela tela de Administração
async function garantirCodigoConvite() {
    if (await Configuracao.obter('codigo_convite')) return;
    const codigo = (process.env.CODIGO_CONVITE || gerarCodigoConvite()).trim().toUpperCase();
    await Configuracao.definir('codigo_convite', codigo);
    console.log(`🔑 Código de convite inicial: ${codigo}`);
}

// Cria o primeiro administrador quando o banco ainda não tem nenhum (dados vêm do .env)
async function garantirAdminPadrao() {
    const [admins] = await db.query("SELECT id_usuario FROM usuarios WHERE perfil = 'admin' LIMIT 1");
    if (admins.length > 0) return;

    const nome = process.env.ADMIN_NOME || 'Administrador LiderOps';
    const cargo = process.env.ADMIN_CARGO || 'Administrador';
    const email = (process.env.ADMIN_EMAIL || 'admin@liderembalagens.com.br').trim().toLowerCase();
    const senhaHash = await User.hashSenha(process.env.ADMIN_PASSWORD || '123456');

    await db.query(
        `INSERT INTO usuarios (nome, email, senha_hash, cargo, perfil)
         VALUES (?, ?, ?, ?, 'admin')
         ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash), perfil = 'admin'`,
        [nome, email, senhaHash, cargo]
    );
    console.log(`👤 Administrador criado: ${email}`);
}

async function inicializarBanco() {
    try {
        // 1. Usuários
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                senha_hash VARCHAR(255) DEFAULT NULL,
                cargo VARCHAR(80) NOT NULL,
                perfil ENUM('admin', 'comum') NOT NULL DEFAULT 'comum',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Empresas prospectadas (resultado do enriquecimento)
        await db.query(`
            CREATE TABLE IF NOT EXISTS empresas_prospectadas (
                id_empresa INT AUTO_INCREMENT PRIMARY KEY,
                cnpj CHAR(14) NOT NULL UNIQUE,
                razao_social VARCHAR(255) NOT NULL,
                endereco VARCHAR(255) DEFAULT 'Não informado',
                cnae VARCHAR(50) DEFAULT 'Não informado',
                status_sincronizacao VARCHAR(50) DEFAULT 'Enriquecida',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Base bruta da Receita Federal (motor de garimpo)
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

        // 4. Migração de bancos criados por versões antigas
        for (const [tabela, colunas] of Object.entries(COLUNAS_ESPERADAS)) {
            await atualizarEstrutura(tabela, colunas);
        }

        // O sistema só exporta .xlsx: troca o status antigo "Pronto HubSpot" por "Enriquecida"
        await db.query("ALTER TABLE empresas_prospectadas ALTER status_sincronizacao SET DEFAULT 'Enriquecida'");
        await db.query(
            "UPDATE empresas_prospectadas SET status_sincronizacao = 'Enriquecida' WHERE status_sincronizacao = 'Pronto HubSpot'"
        );

        // 5. Tarefas do kanban. O tipo do id segue o de usuarios para a chave estrangeira funcionar em bancos antigos
        const tipoIdUsuario = (await colunasDaTabela('usuarios'))
            .find(c => c.COLUMN_NAME === 'id_usuario')?.COLUMN_TYPE || 'INT';
        await db.query(`
            CREATE TABLE IF NOT EXISTS tarefas (
                id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario ${tipoIdUsuario} NOT NULL,
                titulo VARCHAR(150) NOT NULL,
                descricao TEXT DEFAULT NULL,
                status ENUM('aguardando', 'em_andamento', 'concluida') NOT NULL DEFAULT 'aguardando',
                prioridade ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
                prazo DATE DEFAULT NULL,
                oculta TINYINT(1) NOT NULL DEFAULT 0,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tarefas_usuario (id_usuario, status),
                CONSTRAINT fk_tarefas_usuario FOREIGN KEY (id_usuario)
                    REFERENCES usuarios (id_usuario) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Configurações gerais (chave/valor) e histórico de e-mails da IA
        await db.query(`
            CREATE TABLE IF NOT EXISTS configuracoes (
                chave VARCHAR(50) PRIMARY KEY,
                valor VARCHAR(255) NOT NULL,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS emails_gerados (
                id_email INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario ${tipoIdUsuario} NOT NULL,
                empresa VARCHAR(255) NOT NULL,
                objetivo VARCHAR(30) NOT NULL,
                produto VARCHAR(20) NOT NULL,
                assunto VARCHAR(255) NOT NULL,
                corpo TEXT NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_emails_usuario (id_usuario, criado_em),
                CONSTRAINT fk_emails_usuario FOREIGN KEY (id_usuario)
                    REFERENCES usuarios (id_usuario) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Seeds idempotentes. A base de exemplo da Receita só entra quando a tabela está vazia,
        //    para não voltar depois que a base real for carregada
        await garantirAdminPadrao();
        await garantirCodigoConvite();
        if ((await Empresa.contarBaseBruta()) === 0) {
            const { novas } = await Empresa.salvarLoteBruto(linhasSeedReceita());
            console.log(`🌱 Seed da Receita: ${novas} empresas inseridas.`);
        }

        console.log('✅ Estrutura do banco de dados verificada e pronta!');
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar as tabelas do banco:', error.message);
        process.exit(1);
    }
}

module.exports = inicializarBanco;
