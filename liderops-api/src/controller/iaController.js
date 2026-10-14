// liderops-api/src/controller/iaController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = {
    // GERADOR DE SCRIPTS E E-MAILS B2B (POST /api/ia/gerar-email)
    async gerarEmailProspeccao(req, res) {
        const { nomeEmpresa, segmento, tipoEmbalagem, contexto } = req.body;

        if (!contexto || String(contexto).trim().length < 5) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'Forneça um contexto ou histórico mínimo do cliente (pelo menos 5 caracteres).'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                erro: 'Configuração ausente',
                mensagem: 'A variável GEMINI_API_KEY não foi configurada no arquivo .env do servidor.'
            });
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            // Inicializa o modelo Flash com instruções de sistema (System Instruction) blindadas para B2B
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
                systemInstruction: `Você é um especialista sênior em prospecção B2B (LDR/SDR) da Liderkraft / Lider Embalagens.
Sua missão é redigir e-mails de prospecção fria (cold mail) ou follow-up comercial altamente persuasivos, diretos e sem clichês robóticos.
Regras estritas de negócio:
1. Adapte o argumento técnico ao tipo de embalagem que o cliente consome: se for transporte/logística pesada, foque em caixas de papelão ondulado (onda simples/dupla, resistência ao empilhamento/coluna, proteção contra avarias e cumprimento rigoroso de SLA). Se for ponto de venda/varejo, destaque embalagens em offset acoplado ao micro-ondulado.
2. Mantenha o e-mail curto (máximo de 4 parágrafos curtos), escaneável e focado em dores reais de compradores industriais (ruptura de estoque, atraso de fornecedor, custo logístico ou quebra no transporte).
3. Termine sempre com uma chamada para ação (CTA) de baixo atrito pedindo uma breve conversa de 5 a 10 minutos.
4. Responda APENAS com o texto do e-mail (incluindo a linha de "Assunto:"), em Português do Brasil (pt-BR), sem introduções ou comentários extras.`
            });

            const promptUsuario = `
Dados do Prospecto:
- Empresa Alvo: ${nomeEmpresa || '[Nome da Empresa]'}
- Segmento de Atuação: ${segmento || 'Industrial / Logístico'}
- Foco de Produto: ${tipoEmbalagem || 'Caixas de Papelão Ondulado'}
- Contexto / Dor mapeada pelo LDR: ${contexto.trim()}

Gere o script de e-mail comercial personalizado seguindo as diretrizes.
            `.trim();

            const resultado = await model.generateContent(promptUsuario);
            const textoGerado = resultado.response.text();

            return res.status(200).json({
                mensagem: 'Script gerado com sucesso pela IA!',
                script: textoGerado
            });
        } catch (error) {
            return res.status(500).json({
                erro: 'Falha ao comunicar com a API de Inteligência Artificial.',
                detalhes: error.message
            });
        }
    }
};