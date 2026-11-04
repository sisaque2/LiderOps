const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const User = require('../models/User');
const EmailGerado = require('../models/emailGerado');

const PRODUTOS = {
    ondulado: 'caixas de papelão ondulado (onda simples e dupla) para transporte e armazenagem',
    offset: 'embalagens premium em papelão acoplado ao offset (micro-ondulado com impressão de alta qualidade)',
    ambos: 'caixas de papelão ondulado para transporte e embalagens premium em papelão acoplado ao offset'
};

const OBJETIVOS = {
    primeiro_contato: 'Primeiro contato (cold mail). O cliente não conhece a Liderkraft. Objetivo: abrir uma conversa, não vender.',
    follow_up: 'Follow-up de um contato anterior sem resposta. Retome em uma frase o assunto anterior e traga um ângulo novo, sem cobrar resposta.',
    pos_orcamento: 'Retorno após envio de orçamento. Objetivo: entender se ficou alguma dúvida ou objeção e avançar para a decisão.',
    reativacao: 'Reativação de cliente que já comprou e parou. Reconheça a relação anterior e mostre o que mudou desde então.'
};

const TONS = {
    consultivo: 'consultivo: faz uma pergunta inteligente sobre a operação do cliente',
    direto: 'direto: frases curtas, vai ao ponto em até 3 parágrafos',
    cordial: 'cordial: próximo e educado, sem ser informal demais'
};

const INSTRUCOES_SISTEMA = `Você escreve e-mails comerciais B2B em português do Brasil para a Liderkraft Embalagens, fabricante de caixas de papelão ondulado e de embalagens premium em papelão acoplado ao offset.
Você escreve EM NOME do vendedor informado, em primeira pessoa, como uma pessoa real escreveria.

Regras de conteúdo:
- A primeira frase fala do cliente (operação, segmento ou contexto), nunca da Liderkraft.
- Use UMA dor e UM benefício concreto, ligados ao produto informado:
  * papelão ondulado: resistência ao empilhamento, avarias no transporte, regularidade de entrega, ruptura por atraso de fornecedor;
  * offset: apresentação no ponto de venda, qualidade de impressão, percepção de marca, embalagem que vende.
- Nunca invente números, prazos, clientes, certificações ou cases que não estejam no contexto.
- Uma única chamada para ação de baixo atrito (pergunta de sim/não ou conversa de 10 a 15 minutos).

Regras de forma:
- Corpo entre 80 e 140 palavras, em parágrafos de 1 a 3 frases.
- Assunto com no máximo 7 palavras, sem caixa alta, sem emojis e sem clickbait.
- Proibido: "Espero que este e-mail o encontre bem", "Venho por meio deste", "soluções inovadoras", "parceria de sucesso", "no mercado há X anos", "não perca", excesso de exclamações, emojis e colchetes/placeholders.
- Se o nome do contato for informado, cumprimente pelo primeiro nome; se não, use uma saudação neutra (ex.: "Olá, tudo bem?").
- Termine com a assinatura exatamente no formato:
  <nome do vendedor>
  <cargo do vendedor> | Liderkraft Embalagens
  <e-mail do vendedor>

Responda somente com JSON no formato {"assunto": "...", "corpo": "..."}. O corpo inclui saudação e assinatura, com quebras de linha "\\n".`;

// Fallback caso o modelo devolva texto em vez de JSON
function interpretarResposta(texto) {
    try {
        const json = JSON.parse(texto);
        if (json.assunto && json.corpo) return { assunto: String(json.assunto).trim(), corpo: String(json.corpo).trim() };
    } catch {
        // segue para o fallback
    }
    const linhas = texto.trim().split('\n');
    const idxAssunto = linhas.findIndex(l => /^assunto:/i.test(l.trim()));
    if (idxAssunto >= 0) {
        const assunto = linhas[idxAssunto].replace(/^assunto:/i, '').trim();
        const corpo = linhas.slice(idxAssunto + 1).join('\n').trim();
        return { assunto, corpo };
    }
    return { assunto: 'Embalagens Liderkraft', corpo: texto.trim() };
}

module.exports = {
    // GERADOR DE E-MAIL B2B (POST /api/ia/gerar-email)
    async gerarEmailProspeccao(req, res) {
        const {
            idEmpresa, nomeEmpresa, segmento, nomeContato, cargoContato,
            produto = 'ondulado', objetivo = 'primeiro_contato', tom = 'consultivo', contexto
        } = req.body;

        if (!contexto || String(contexto).trim().length < 10) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Descreva o contexto do cliente com pelo menos 10 caracteres.'
            });
        }
        if (!idEmpresa && (!nomeEmpresa || String(nomeEmpresa).trim().length < 2)) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Selecione uma empresa da base ou informe o nome da empresa alvo.'
            });
        }
        if (!PRODUTOS[produto] || !OBJETIVOS[objetivo] || !TONS[tom]) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Produto, objetivo ou tom inválido.'
            });
        }
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                erro: 'Configuração ausente',
                mensagem: 'A variável GEMINI_API_KEY não foi configurada no .env do servidor.'
            });
        }

        try {
            const vendedor = await User.findById(req.user.id);
            if (!vendedor) {
                return res.status(401).json({ erro: 'Sessão inválida', mensagem: 'Faça login novamente.' });
            }

            // Dados reais da empresa enriquecida, quando ela vem da base
            let empresa = null;
            if (idEmpresa) {
                const [rows] = await db.query(
                    'SELECT razao_social, endereco, cnae FROM empresas_prospectadas WHERE id_empresa = ?',
                    [idEmpresa]
                );
                empresa = rows[0];
                if (!empresa) {
                    return res.status(404).json({
                        erro: 'Não encontrado',
                        mensagem: 'A empresa selecionada não existe mais na base.'
                    });
                }
            }

            const prompt = `
Vendedor (remetente):
- Nome: ${vendedor.nome}
- Cargo: ${vendedor.cargo}
- E-mail: ${vendedor.email}

Cliente:
- Empresa: ${nomeEmpresa?.trim() || empresa?.razao_social}
${empresa ? `- Endereço: ${empresa.endereco}\n- CNAE principal: ${empresa.cnae}` : ''}
- Segmento: ${segmento?.trim() || 'não informado (deduza pelo CNAE, se houver)'}
- Contato: ${nomeContato?.trim() || 'não informado'}${cargoContato?.trim() ? ` (${cargoContato.trim()})` : ''}

Produto em foco: ${PRODUTOS[produto]}
Objetivo do e-mail: ${OBJETIVOS[objetivo]}
Tom: ${TONS[tom]}

Contexto levantado pelo vendedor:
${String(contexto).trim()}
`.trim();

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
                systemInstruction: INSTRUCOES_SISTEMA,
                generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
            });

            const resultado = await model.generateContent(prompt);
            const email = interpretarResposta(resultado.response.text());

            const historico = await EmailGerado.salvar(req.user.id, {
                empresa: (nomeEmpresa?.trim() || empresa?.razao_social || 'Empresa').slice(0, 255),
                objetivo,
                produto,
                assunto: email.assunto.slice(0, 255),
                corpo: email.corpo
            });

            return res.status(200).json({
                mensagem: 'E-mail gerado com sucesso pela IA!',
                email,
                historico,
                remetente: { nome: vendedor.nome, cargo: vendedor.cargo, email: vendedor.email }
            });
        } catch (error) {
            return res.status(502).json({
                erro: 'Falha ao comunicar com a API de Inteligência Artificial.',
                mensagem: 'A IA não respondeu agora. Tente novamente em alguns segundos.',
                detalhes: error.message
            });
        }
    },

    // HISTÓRICO DO USUÁRIO (GET /api/ia/emails) — últimos 20 e-mails gerados
    async listarHistorico(req, res) {
        try {
            const emails = await EmailGerado.listarDoUsuario(req.user.id);
            return res.status(200).json(emails);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao buscar o histórico de e-mails.', detalhes: error.message });
        }
    },

    // DELETE /api/ia/emails/:id — só remove e-mails do próprio usuário
    async excluirDoHistorico(req, res) {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ erro: 'Parâmetro inválido', mensagem: 'ID de e-mail inválido.' });
        }
        try {
            const removidos = await EmailGerado.excluir(id, req.user.id);
            if (removidos === 0) {
                return res.status(404).json({ erro: 'Não encontrado', mensagem: 'E-mail não encontrado no seu histórico.' });
            }
            return res.status(200).json({ mensagem: 'E-mail removido do histórico.' });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao remover o e-mail.', detalhes: error.message });
        }
    }
};
