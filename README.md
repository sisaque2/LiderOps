# LiderOps

[![CI](https://github.com/sisaque2/LiderOps/actions/workflows/ci.yml/badge.svg)](https://github.com/sisaque2/LiderOps/actions/workflows/ci.yml)

## 📌 Visão do Produto

O **LiderOps** é um hub web de Revenue Operations e pré-vendas B2B feito para a Liderkraft Embalagens (papelão ondulado e papelão acoplado ao offset). Ele centraliza a rotina do time comercial: garimpar empresas dentro do ICP, enriquecer CNPJs em lote, exportar a base higienizada em planilha .xlsx, gerar e-mails de prospecção com IA e acompanhar as tarefas do dia em um kanban.

## 🎯 Público-Alvo

LDRs, SDRs, vendedores e analistas de RevOps que precisam de dados cadastrais confiáveis e menos trabalho manual na prospecção.

## ✅ Funcionalidades

| Requisito | Tela | Descrição |
|---|---|---|
| RF01 | Login / Administração | Login com JWT + bcrypt, perfis **admin** e **comum**, cadastro restrito por e-mail corporativo e código de convite |
| RF02 | Higienizar Dados / Administração | Garimpo na base da Receita Federal por UF e CNAE dentro do ICP, com carga mensal da base por upload |
| RF03 | Higienizar Dados | Enriquecimento em lote via Brasil API, busca na base e exportação `.xlsx` das empresas selecionadas |
| RF04 | Gerar E-mail | E-mails B2B com Google Gemini, assinados pelo usuário logado, com histórico salvo no banco |
| RF05 | Tarefas | Kanban Aguardando → Em andamento → Concluídas |

Detalhes em [`docs/rf.md`](docs/rf.md). Protótipo de interface no [Figma](https://www.figma.com/proto/tcWaP4FhD3sBwlDNuPu5Wq/LiderOps?node-id=211-443&p=f&t=QDjjNqRtODtXfowo-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=211%3A443&show-proto-sidebar=1).

## ⚙️ Arquitetura e Tecnologias

```
liderops-web  (React 19 + TypeScript + Vite + Tailwind)
      │  fetch + Authorization: Bearer <JWT>
      ▼
liderops-api  (Node.js + Express 5)
      ├── MySQL no Amazon RDS (mysql2)
      ├── Brasil API (enriquecimento de CNPJ)
      └── Google Gemini (geração de e-mails)
```

Tabelas criadas automaticamente pela API ao iniciar (`src/config/initDb.js`): `usuarios`, `empresas_prospectadas`, `empresas_receita_bruta` e `tarefas`. No primeiro boot ela também cria o administrador padrão e carrega 26 empresas reais (conferidas na Brasil API) na base da Receita, para o garimpo funcionar sem o CSV completo.

## 🗂️ Carga da base da Receita Federal

A base completa de CNPJs (dados abertos da Receita, atualizada mensalmente) tem dezenas de GB e não é processada pelo LiderOps. Ela é tratada fora do projeto por um script Python com DuckDB, que cruza os arquivos de Empresas, Estabelecimentos e Municípios e mantém só as empresas ativas dentro do ICP (UF/cidades atendidas, porte e capital social mínimo). O CSV resultante, com algumas dezenas de milhares de linhas, é enviado pelo administrador na aba *Administração*. A API lê o arquivo via stream e grava em lotes no MySQL com "insere ou atualiza": empresas novas entram e as existentes têm os dados atualizados. Na carga mensal completa, a opção *Substituir a base* remove as empresas que deixaram de constar no arquivo.

## 🚀 Como rodar localmente

Pré-requisitos: Node.js 20+ e um MySQL acessível (local ou RDS).

**1. API**
```bash
cd liderops-api
npm install
cp .env.example .env   # preencha banco, JWT_SECRET e GEMINI_API_KEY
npm start              # http://localhost:3000/api/status
```

**2. Front-end** (em outro terminal)
```bash
cd liderops-web
npm install
npm run dev            # http://localhost:5173
```

**Acesso inicial:** na primeira vez que a API sobe sem nenhum administrador no banco, ela cria um a partir de `ADMIN_NOME`, `ADMIN_CARGO`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env` (padrão: `admin@liderembalagens.com.br` / `123456`). Novas contas criadas pela tela entram como perfil comum.

**Cadastro restrito:** só aceita e-mails dos domínios em `DOMINIOS_CADASTRO` (padrão `liderkraft.com.br`) e exige o código de convite. O código inicial vem de `CODIGO_CONVITE` ou é gerado e exibido no log da API no primeiro boot; depois, o admin vê e troca o código na aba *Administração*.

**Senhas:** cada usuário troca a própria senha em *Minha conta* (clicando no nome, no topo). Em caso de esquecimento, um administrador define uma senha provisória na aba *Administração*.

**Banco antigo:** se o banco já tiver tabelas de versões anteriores do projeto, a API adiciona sozinha as colunas que faltarem ao iniciar, sem apagar dados.

## 🔌 Endpoints da API

Todas as rotas, exceto login e cadastro, exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/usuarios/login` | público | Login, devolve token e usuário |
| POST | `/api/usuarios` | público | Cadastro com e-mail corporativo e código de convite (perfil comum), devolve token |
| GET | `/api/usuarios/me` | logado | Usuário da sessão |
| PATCH | `/api/usuarios/me/senha` | logado | Troca a própria senha |
| PATCH | `/api/usuarios/:id/senha` | admin | Redefine a senha de um usuário |
| GET | `/api/usuarios` | admin | Lista usuários |
| GET | `/api/usuarios/:id` | admin ou o próprio | Detalhe |
| PUT | `/api/usuarios/:id` | admin ou o próprio | Edita (só admin muda perfil) |
| DELETE | `/api/usuarios/:id` | admin | Exclui usuário |
| GET | `/api/empresas/garimpar?uf=&cnae=&limite=` | logado | Garimpo na base da Receita |
| POST | `/api/empresas/enriquecer-lote` | logado | Enriquece até 50 CNPJs |
| GET | `/api/empresas/exportar` | logado | Planilha `.xlsx` da base inteira |
| POST | `/api/empresas/exportar` | logado | Planilha `.xlsx` só dos `ids` enviados |
| POST | `/api/empresas/importar-receita` | admin | Upload (multipart, campo `arquivo`) do CSV da Receita; `substituir=true` remove o que não veio |
| GET | `/api/empresas/receita/resumo` | admin | Total da base de garimpo por UF e data da última carga |
| GET/POST/PUT | `/api/empresas[/:id]` | logado | CRUD de empresas prospectadas |
| DELETE | `/api/empresas/:id` | admin | Exclui empresa |
| POST | `/api/ia/gerar-email` | logado | Gera e-mail com IA e salva no histórico |
| GET | `/api/ia/emails` | logado | Últimos 20 e-mails gerados pelo usuário |
| DELETE | `/api/ia/emails/:id` | dono | Remove um e-mail do histórico |
| GET/PUT | `/api/config/convite` | admin | Consulta ou troca o código de convite |
| GET | `/api/status` | público | Health check: versão, uptime e conexão com o banco |
| GET/POST | `/api/tarefas` | logado | Lista / cria tarefas do usuário |
| PUT | `/api/tarefas/:id` | dono | Edita tarefa |
| PATCH | `/api/tarefas/:id/status` | dono | Move no kanban |
| PATCH | `/api/tarefas/:id/ocultar` | dono | Oculta ou mostra |
| DELETE | `/api/tarefas/:id` | dono | Exclui tarefa |

## 🔒 Segurança

- Senhas com bcrypt e sessão por JWT com expiração.
- Headers de segurança com Helmet (CSP, proteção contra clickjacking e MIME sniffing).
- Limite de tentativas por IP: 10 logins errados a cada 15 min, 10 cadastros por hora e 30 gerações de e-mail a cada 10 min.
- Cadastro restrito a e-mails corporativos com código de convite.
- Ao publicar com HTTPS, defina `HTTPS=true` no `.env` para ativar o HSTS e o upgrade automático para https.

## ☁️ Deploy na AWS (EC2 + RDS)

A API também serve o front buildado, então basta um único processo Node na EC2:

```bash
git clone https://github.com/sisaque2/LiderOps.git && cd LiderOps
cd liderops-web && npm install && npm run build && cd ..
cd liderops-api && npm install && cp .env.example .env   # preencha com o endpoint do RDS
sudo npm install -g pm2
pm2 start server.js --name liderops && pm2 save
```

Libere a porta da API (padrão 3000) no Security Group da EC2 e a porta 3306 do RDS para o Security Group da EC2. A aplicação fica em `http://<ip-publico-da-ec2>:3000`.
