# Requisitos Funcionais

### RF01 - Autenticação e Controle de Acesso
O sistema deve permitir cadastro e login de usuários com senha criptografada (bcrypt) e sessão via token JWT.
Deve haver dois perfis de acesso:
- **Administrador:** gerencia usuários e perfis, exclui empresas da base e importa a base da Receita Federal.
- **Comum:** usa garimpo, enriquecimento, exportação, gerador de e-mail e tarefas.

Todo cadastro feito pela tela cria um usuário comum. O primeiro administrador é criado automaticamente pela API (seed).

### RF02 - Garimpo na Base da Receita Federal por ICP
O sistema deve buscar empresas na base bruta da Receita Federal filtrando pelo Perfil de Cliente Ideal (UF, município atendido, CNAE, porte e capital social mínimo), devolvendo até 50 CNPJs por consulta.

### RF03 - Enriquecimento em Lote e Exportação
O sistema deve validar e enriquecer até 50 CNPJs por vez via Brasil API (razão social, endereço e CNAE), salvar o resultado no banco e permitir exportar a base higienizada em planilha **.xlsx**.

### RF04 - Gerador de E-mail com IA
O sistema deve gerar e-mails comerciais B2B com IA (Google Gemini) a partir de um briefing do prospecto (empresa, contato, produto, objetivo e tom), assinados com os dados do usuário logado, e permitir transformar o e-mail enviado em uma tarefa de follow-up.

### RF05 - Pipeline de Tarefas (Kanban)
O sistema deve permitir que cada usuário crie, edite, oculte e exclua tarefas, organizadas em um kanban com as colunas **Aguardando**, **Em andamento** e **Concluídas**, movendo os cards entre colunas.

---

# Requisitos Não Funcionais

- **RNF01:** API REST em Node.js + Express com banco MySQL (Amazon RDS).
- **RNF02:** Front-end em React + TypeScript + Tailwind, responsivo.
- **RNF03:** Senhas armazenadas apenas como hash bcrypt; o hash nunca é retornado pela API.
- **RNF04:** Respostas de erro padronizadas com códigos HTTP (400, 401, 403, 404, 409, 422, 500, 502).
- **RNF05:** Consultas à Brasil API com intervalo de 800 ms entre CNPJs para evitar bloqueio por limite de requisições.
