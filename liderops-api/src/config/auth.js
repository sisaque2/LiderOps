require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não definido no .env. Usando chave de desenvolvimento (não use assim em produção).');
}

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'liderops_dev_secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
    PERFIS: ['admin', 'comum']
};
