const crypto = require('crypto');

// Sem 0/O e 1/I para o código não gerar confusão ao ser ditado ou digitado
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FORMATO_CODIGO = /^[A-Z0-9]{6,8}$/;

function gerarCodigoConvite(tamanho = 8) {
    return Array.from(crypto.randomBytes(tamanho), byte => ALFABETO[byte % ALFABETO.length]).join('');
}

function normalizarCodigo(codigo) {
    return String(codigo || '').trim().toUpperCase();
}

module.exports = { gerarCodigoConvite, normalizarCodigo, FORMATO_CODIGO };
