# LiderOps

## 📌 Visão do Produto

O *LiderOps* é uma aplicação web focada em oferecer assistência comercial inteligente. Desenvolvido para otimizar a rotina de vendas e operações, o sistema atua como um facilitador técnico, centralizando dados e automatizando processos para a equipe comercial.

O grande diferencial do projeto é a utilização de Inteligência Artificial integrada para a criação automatizada de e-mails de primeiro contato. Isso permite que a equipe ganhe agilidade e reduza o tempo gasto em tarefas manuais, mantendo uma comunicação comercial estruturada e eficiente.

## 🎯 Público-Alvo

Assistentes comerciais, vendedores e analistas de operações que buscam otimizar seu tempo, automatizar a redação de e-mails e contar com um sistema web leve e direto para apoiar o relacionamento inicial com os clientes.

## ⚙️ Arquitetura e Tecnologias

O projeto foi construído priorizando uma arquitetura simples e funcional:

* *Front-end:* Interface de usuário desenvolvida com *React e Tailwind*, garantindo um layout responsivo, leve e de fácil manutenção.
* *Integração Externa (APIs):* Conexões com APIs de Inteligência Artificial e Banco de Dados em Nuvem para o processamento e geração dinâmica dos textos e e-mails comerciais.
* *Banco de Dados:* Estrutura relacional para armazenamento das informações dos contatos, configurações de sistema e históricos, garantindo a persistência dos dados de forma segura.

## LiderOps - Front-end (Avaliação P1)

Esta é a interface da aplicação LiderOps, desenvolvida com React, Vite, TypeScript e Tailwind CSS, correspondente à entrega da P1 (Desenvolvimento de Interfaces de Usuário para Web).

### 🚀 Como rodar o projeto localmente

Como o projeto foi construído utilizando Node.js e Vite, é necessário instalar as dependências antes de executá-lo pela primeira vez. Siga os passos abaixo:

**Passo 1: Extrair e abrir a pasta**
Após baixar o repositório em `.zip`, extraia os arquivos.
Abra a pasta do projeto no VS Code (ou no seu terminal de preferência).

**Passo 2: Navegar para o diretório do Front-end**
No terminal, certifique-se de estar dentro da pasta do front-end:
```bash
cd liderops-web
```

**Passo 3: Instalar as dependências**
Execute o comando abaixo para que o Node Package Manager (NPM) baixe todas as bibliotecas necessárias (como o React, Vite e Tailwind CSS):
```bash
npm install
```

**Passo 4: Iniciar o servidor local**
Com as dependências instaladas, inicie a aplicação com o comando:
```bash
npm run dev
```

**Passo 5: Acessar no navegador**
O terminal exibirá um link local (geralmente `http://localhost:5173/`). Segure a tecla `Ctrl` (ou `Cmd` no Mac) e clique no link, ou copie e cole a URL no seu navegador. A interface do LiderOps com dados simulados será carregada imediatamente.