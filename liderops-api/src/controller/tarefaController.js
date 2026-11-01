const Tarefa = require('../models/tarefa');

const naoEncontrada = (res, id) =>
    res.status(404).json({ erro: 'Não encontrado', mensagem: `Tarefa ${id} não existe ou não pertence a você.` });

const erroInterno = (res, mensagem, error) =>
    res.status(500).json({ erro: mensagem, detalhes: error.message });

// Aplica a alteração e devolve a tarefa já atualizada
async function atualizarERetornar(req, res, campos, mensagem) {
    const { id } = req.params;
    try {
        const alteradas = await Tarefa.atualizar(id, req.user.id, campos);
        if (alteradas === 0) return naoEncontrada(res, id);

        const tarefa = await Tarefa.buscar(id, req.user.id);
        return res.status(200).json({ mensagem, dados: tarefa });
    } catch (error) {
        return erroInterno(res, 'Erro ao atualizar tarefa.', error);
    }
}

module.exports = {
    // GET /api/tarefas
    async listar(req, res) {
        try {
            const tarefas = await Tarefa.listarDoUsuario(req.user.id);
            return res.status(200).json(tarefas);
        } catch (error) {
            return erroInterno(res, 'Erro ao listar tarefas.', error);
        }
    },

    // POST /api/tarefas
    async criar(req, res) {
        try {
            const tarefa = await Tarefa.criar(req.user.id, req.body);
            return res.status(201).json({ mensagem: 'Tarefa criada com sucesso!', dados: tarefa });
        } catch (error) {
            return erroInterno(res, 'Erro ao criar tarefa.', error);
        }
    },

    // PUT /api/tarefas/:id
    async atualizar(req, res) {
        return atualizarERetornar(req, res, req.body, 'Tarefa atualizada com sucesso!');
    },

    // PATCH /api/tarefas/:id/status — move o card entre as colunas do kanban
    async moverStatus(req, res) {
        return atualizarERetornar(req, res, { status: req.body.status }, 'Status da tarefa atualizado!');
    },

    // PATCH /api/tarefas/:id/ocultar
    async alternarOculta(req, res) {
        const { oculta } = req.body;
        return atualizarERetornar(
            req, res, { oculta: oculta ? 1 : 0 },
            oculta ? 'Tarefa ocultada.' : 'Tarefa visível novamente.'
        );
    },

    // DELETE /api/tarefas/:id
    async excluir(req, res) {
        const { id } = req.params;
        try {
            const removidas = await Tarefa.excluir(id, req.user.id);
            if (removidas === 0) return naoEncontrada(res, id);
            return res.status(200).json({ mensagem: 'Tarefa excluída com sucesso!' });
        } catch (error) {
            return erroInterno(res, 'Erro ao excluir tarefa.', error);
        }
    }
};
