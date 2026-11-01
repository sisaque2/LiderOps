const STATUS = ['aguardando', 'em_andamento', 'concluida'];
const PRIORIDADES = ['baixa', 'media', 'alta'];

const falha = (res, mensagem) => res.status(422).json({ erro: 'Validação falhou', mensagem });

function prazoValido(prazo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return false;
    const data = new Date(`${prazo}T00:00:00Z`);
    return !isNaN(data.getTime()) && data.toISOString().startsWith(prazo);
}

const tarefaValidator = {
    // POST e PUT: valida o corpo completo e normaliza os campos opcionais
    validateBody(req, res, next) {
        const { titulo, descricao, status, prioridade, prazo } = req.body;

        if (!titulo || String(titulo).trim().length < 3) {
            return falha(res, 'O título é obrigatório e deve ter pelo menos 3 caracteres.');
        }
        if (String(titulo).trim().length > 150) {
            return falha(res, 'O título pode ter no máximo 150 caracteres.');
        }
        if (descricao && String(descricao).length > 2000) {
            return falha(res, 'A descrição pode ter no máximo 2000 caracteres.');
        }
        if (status !== undefined && !STATUS.includes(status)) {
            return falha(res, `Status inválido. Use: ${STATUS.join(', ')}.`);
        }
        if (prioridade !== undefined && !PRIORIDADES.includes(prioridade)) {
            return falha(res, `Prioridade inválida. Use: ${PRIORIDADES.join(', ')}.`);
        }
        if (prazo && !prazoValido(prazo)) {
            return falha(res, 'Prazo inválido. Use o formato AAAA-MM-DD.');
        }

        req.body = {
            titulo: String(titulo).trim(),
            descricao: descricao ? String(descricao).trim() : null,
            status: status || 'aguardando',
            prioridade: prioridade || 'media',
            prazo: prazo || null
        };
        next();
    },

    validateStatus(req, res, next) {
        if (!STATUS.includes(req.body.status)) {
            return falha(res, `Status inválido. Use: ${STATUS.join(', ')}.`);
        }
        next();
    },

    validateOculta(req, res, next) {
        if (typeof req.body.oculta !== 'boolean') {
            return falha(res, 'Envie o campo "oculta" como true ou false.');
        }
        next();
    },

    validateId(req, res, next) {
        const { id } = req.params;
        if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                erro: 'Parâmetro inválido',
                mensagem: 'O ID da tarefa informado na URL deve ser um número inteiro positivo.'
            });
        }
        next();
    }
};

module.exports = tarefaValidator;
