const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');
const empresaRoutes = require('./src/routes/empresaRoutes');
const iaRoutes = require('./src/routes/iaRoutes');
const tarefaRoutes = require('./src/routes/tarefaRoutes');
const configRoutes = require('./src/routes/configRoutes');
const inicializarBanco = require('./src/config/initDb');
const db = require('./src/config/db');
const { version } = require('./package.json');

const app = express();
app.disable('x-powered-by');
// Headers de segurança. Enquanto o servidor roda sem HTTPS, o upgrade para https e o HSTS ficam desligados
// (senão o navegador tentaria carregar o site em https e ele ficaria em branco).
// O cross-origin libera o front de desenvolvimento (porta 5173) a ler as respostas.
const usaHttps = process.env.HTTPS === 'true';
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: usaHttps,
    contentSecurityPolicy: { directives: { upgradeInsecureRequests: usaHttps ? [] : null } }
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check: usado no monitoramento da EC2 e pelo indicador "API online" do front
app.get('/api/status', async (req, res) => {
    const base = { versao: version, uptime_segundos: Math.round(process.uptime()) };
    const inicio = Date.now();
    try {
        await db.query('SELECT 1');
        res.json({ status: 'online', ...base, banco: { conectado: true, latencia_ms: Date.now() - inicio } });
    } catch (error) {
        res.status(503).json({ status: 'degradado', ...base, banco: { conectado: false, erro: error.message } });
    }
});

app.use('/api/usuarios', userRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/tarefas', tarefaRoutes);
app.use('/api/config', configRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada', mensagem: `${req.method} ${req.originalUrl} não existe na API.` });
});

// Em produção (EC2) a própria API entrega o front já buildado (liderops-web/dist)
const distPath = path.join(__dirname, '..', 'liderops-web', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;

async function iniciar() {
    await inicializarBanco();
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

iniciar();
