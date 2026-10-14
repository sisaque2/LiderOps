// liderops-api/src/config/filtrosIcp.js

// Função auxiliar para remover acentos e padronizar textos (Ex: "Poços" -> "POCOS")
function normalizarTexto(texto) {
    if (!texto) return '';
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}

// Usamos a estrutura Set() em vez de Array [] para busca instantânea O(1) na memória RAM
const CIDADES_ALVO = {
    MG: new Set([
        'POCOS DE CALDAS', 'ANDRADAS', 'CALDAS', 'CAMPESTRE', 'BANDEIRA DO SUL',
        'BOTELHOS', 'CABO VERDE', 'MUZAMBINHO', 'GUAXUPE', 'ALFENAS', 'MACHADO',
        'POUSO ALEGRE', 'SANTA RITA DE CALDAS', 'IPUIUNA', 'ALBERTINA',
        'JACUTINGA', 'MONTE SIAO', 'OURO FINO', 'INCONFIDENTES', 'BORDA DA MATA', 'BUENO BRANDAO'
    ]),
    ES: new Set([
        'VITORIA', 'SERRA', 'VILA VELHA', 'CARIACICA', 'VIANA', 'GUARAPARI',
        'FUNDAO', 'ARACRUZ', 'DOMINGOS MARTINS', 'MARECHAL FLORIANO',
        'SANTA TERESA', 'IBIRACU', 'JOAO NEIVA', 'ANCHIETA', 'ALFREDO CHAVES', 'ICONHA'
    ]),
    GO: new Set([
        'ANAPOLIS', 'GOIANIA', 'APARECIDA DE GOIANIA', 'ABADIANIA', 'ALEXANIA',
        'NEROPOLIS', 'TEREZOPOLIS DE GOIAS', 'SENADOR CANEDO', 'GOIANAPOLIS',
        'PIRENOPOLIS', 'CAMPO LIMPO DE GOIAS', 'OURO VERDE DE GOIAS', 'SILVANIA'
    ])
};

// Regras de corte do ICP para o filtro de carga (ETL)
const REGRAS_ICP = {
    ufsPermitidas: new Set(['SP', 'MG', 'ES', 'GO']),
    // Na Receita Federal: '05' representa empresas de porte "DEMAIS" (Médio/Grande Porte, fora do Simples/ME/EPP)
    portesPermitidos: new Set(['05', 'DEMAIS', 'MEDIO', 'GRANDE']),
    capitalSocialMinimo: 500000.00 // R$ 500 mil de capital social mínimo inicial para filtrar micro-operações
};

/**
 * Avalia em memória RAM se uma linha do CSV atende aos critérios geográficos da Liderkraft
 */
function atendeRegiaoIcp(uf, municipio) {
    const ufLimpa = normalizarTexto(uf);
    
    // 1. Se não for SP, MG, ES ou GO, descarta na hora
    if (!REGRAS_ICP.ufsPermitidas.has(ufLimpa)) {
        return false;
    }

    // 2. Para São Paulo, aceitamos o estado inteiro
    if (ufLimpa === 'SP') {
        return true;
    }

    // 3. Para MG, ES e GO, verificamos se a cidade está no nosso Set de raio de atendimento
    const municipioLimpo = normalizarTexto(municipio);
    return CIDADES_ALVO[ufLimpa].has(municipioLimpo);
}

module.exports = {
    normalizarTexto,
    CIDADES_ALVO,
    REGRAS_ICP,
    atendeRegiaoIcp
};