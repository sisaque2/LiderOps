// liderops-api/src/services/receitaService.js
const fs = require('fs');
const readline = require('readline');
const Empresa = require('../models/empresa');
const { atendeRegiaoIcp, REGRAS_ICP } = require('../config/filtrosIcp');

const TAMANHO_LOTE = 1000;

/**
 * Processa um arquivo CSV da Receita Federal linha por linha via Stream
 * @param {string} caminhoArquivo - Caminho físico do arquivo CSV no servidor
 */
async function processarArquivoReceita(caminhoArquivo) {
    if (!fs.existsSync(caminhoArquivo)) {
        throw new Error(`Arquivo não encontrado no caminho: ${caminhoArquivo}`);
    }

    // 1. Cria um fluxo de leitura em pedaços (chunks) de 64KB por vez
    const fileStream = fs.createReadStream(caminhoArquivo, { encoding: 'latin1' });

    // 2. Conecta o leitor de linhas ao fluxo com controle automático de pausa (crlfDelay)
    const leitorLinhas = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let loteAtual = [];
    let totalLidas = 0;
    let totalAprovadas = 0;

    // 3. Loop assíncrono sobre a Stream (Backpressure controlado)
    for await (const linha of leitorLinhas) {
        totalLidas++;

        // Ignora cabeçalho caso exista na primeira linha
        if (totalLidas === 1 && linha.toUpperCase().includes('CNPJ')) {
            continue;
        }

        // Os arquivos da Receita usam ';' como separador e aspas duplas em volta dos campos
        const colunas = linha.split(';').map(col => col.replace(/^"|"$/g, '').trim());
        if (colunas.length < 7) continue;

        const [
            cnpj,
            razaoSocial,
            nomeFantasia,
            cnaePrincipal,
            uf,
            municipio,
            porte,
            capitalSocialStr,
            telefone,
            email
        ] = colunas;

        // Filtro 1: Checagem geográfica em memória RAM (O(1) via Set)
        if (!atendeRegiaoIcp(uf, municipio)) {
            continue;
        }

        // Filtro 2: Checagem de Porte (ignora MEI, ME e EPP se não estiver nas regras)
        if (porte && !REGRAS_ICP.portesPermitidos.has(porte.toUpperCase())) {
            continue;
        }

        // Filtro 3: Converte capital social do formato brasileiro ("1500000,00") para número ("1500000.00")
        const capitalSocial = parseFloat(String(capitalSocialStr || '0').replace(',', '.')) || 0;
        if (capitalSocial < REGRAS_ICP.capitalSocialMinimo) {
            continue;
        }

        const cnpjLimpo = cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) continue;

        // Se passou na peneira do ICP, entra no lote de gravação
        loteAtual.push([
            cnpjLimpo,
            razaoSocial || 'Não informado',
            nomeFantasia || null,
            cnaePrincipal.replace(/\D/g, ''),
            uf.toUpperCase(),
            municipio.toUpperCase(),
            porte.toUpperCase(),
            capitalSocial,
            telefone || null,
            email || null
        ]);

        // 4. Quando o balde atinge 1.000 empresas, pausa a leitura do disco e grava no MySQL
        if (loteAtual.length >= TAMANHO_LOTE) {
            const inseridas = await Empresa.inserirLoteBruto(loteAtual);
            totalAprovadas += inseridas;
            loteAtual = []; // Esvazia o balde na RAM
        }
    }

    // 5. Grava o restante que sobrou no balde (menos de 1.000 no final do arquivo)
    if (loteAtual.length > 0) {
        const inseridas = await Empresa.inserirLoteBruto(loteAtual);
        totalAprovadas += inseridas;
    }

    return { totalLidas, totalAprovadas };
}

module.exports = { processarArquivoReceita };