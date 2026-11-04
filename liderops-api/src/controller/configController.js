const Configuracao = require('../models/configuracao');
const { gerarCodigoConvite, normalizarCodigo, FORMATO_CODIGO } = require('../helpers/codigo-convite');
const { DOMINIOS_CADASTRO } = require('../config/auth');

const erroInterno = (res, mensagem, error) =>
    res.status(500).json({ erro: mensagem, detalhes: error.message });

module.exports = {
    // GET /api/config/convite — admin
    async obterConvite(req, res) {
        try {
            const codigo = await Configuracao.obter('codigo_convite');
            return res.status(200).json({ codigo, dominios: DOMINIOS_CADASTRO });
        } catch (error) {
            return erroInterno(res, 'Erro ao buscar o código de convite.', error);
        }
    },

    // PUT /api/config/convite — admin define um código próprio ({ codigo }) ou pede um aleatório ({ gerar: true })
    async definirConvite(req, res) {
        const codigo = req.body.gerar ? gerarCodigoConvite() : normalizarCodigo(req.body.codigo);

        if (!FORMATO_CODIGO.test(codigo)) {
            return res.status(422).json({
                erro: 'Validação falhou',
                mensagem: 'O código deve ter de 6 a 8 caracteres, apenas letras e números.'
            });
        }

        try {
            await Configuracao.definir('codigo_convite', codigo);
            return res.status(200).json({
                mensagem: 'Código de convite atualizado. O código anterior deixou de valer.',
                codigo
            });
        } catch (error) {
            return erroInterno(res, 'Erro ao salvar o código de convite.', error);
        }
    }
};
