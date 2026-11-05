require('dotenv').config();

const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const { sequelize } = require('./src/models');
const { iniciarJobDeLembretes } = require('./src/jobs/lembreteJob');
const { executarMigracoes } = require('./src/database/migrations');
const { SEGREDO_CONFIGURADO, EM_PRODUCAO } = require('./src/middlewares/auth');
const { corsRestrito, cabecalhos, limiteGeral } = require('./src/middlewares/seguranca');

const routerAuth = require('./src/routes/routesAuth');
const routerClientes = require('./src/routes/routesClientes');
const routerProfissionais = require('./src/routes/routesProfissionais');
const routerServicos = require('./src/routes/routesServicos');
const routerAgendamentos = require('./src/routes/routesAgendamentos');
const routerListaEspera = require('./src/routes/routesListaEspera');
const routerMensagens = require('./src/routes/routesMensagens');
const routerConfiguracoes = require('./src/routes/routesConfiguracoes');
const routerImagens = require('./src/routes/routesImagens');
const routerBarbearias = require('./src/routes/routesBarbearias');
const routerAssinaturas = require('./src/routes/routesAssinaturas');
const routerContato = require('./src/routes/routesContato');

// Atrás de proxy (Azure App Service), o IP real do cliente vem no X-Forwarded-For.
// Só confia nesse cabeçalho quando há proxy; senão qualquer um forjaria o IP e furaria o limite de tentativas.
const atrasDeProxy = process.env.TRUST_PROXY ?? (process.env.WEBSITE_SITE_NAME ? '1' : '0');
if (atrasDeProxy !== '0') app.set('trust proxy', Number(atrasDeProxy) || 1);

app.disable('x-powered-by');
app.use(cabecalhos);
app.use(corsRestrito);
app.use(limiteGeral);
// Limite maior por causa das imagens (logo e fotos de perfil chegam em base64)
app.use(express.json({ limit: '2mb' }));

// Se o banco/migrações falharem na inicialização, o servidor continua de pé e responde 503.
// O motivo aparece no log; em produção não é enviado ao navegador (pode conter dados do banco).
let erroDeInicializacao = null;
if (EM_PRODUCAO && !SEGREDO_CONFIGURADO) {
  erroDeInicializacao = new Error('JWT_SECRET não configurado (mínimo de 32 caracteres).');
  console.error(`[segurança] ${erroDeInicializacao.message} A API fica indisponível até ele ser definido.`);
}
app.use((req, res, next) => {
  if (erroDeInicializacao) {
    return res.status(503).json({
      error: 'Serviço temporariamente indisponível',
      ...(EM_PRODUCAO ? {} : { detalhe: erroDeInicializacao.message })
    });
  }
  next();
});

// Rota principal para testar o funcionamento da API
app.get('/', (req, res) => {
  res.json({ message: 'BarberFlow Backend funcionando!', status: 'online' });
});

// Rotas
app.use(routerAuth);
app.use(routerClientes);
app.use(routerProfissionais);
app.use(routerServicos);
app.use(routerAgendamentos);
app.use(routerListaEspera);
app.use(routerMensagens);
app.use(routerConfiguracoes);
app.use(routerImagens);
app.use(routerBarbearias);
app.use(routerAssinaturas);
app.use(routerContato);

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros não capturados (nunca devolve detalhes internos)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Arquivo muito grande. Use uma imagem menor.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  console.error(err.stack || err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Conexão com o banco de dados e sincronização das tabelas
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    return sequelize.sync();
  })
  .then(() => {
    console.log('Modelos sincronizados com o banco de dados.');
    return executarMigracoes(sequelize);
  })
  .then(() => {
    iniciarJobDeLembretes();
  })
  .catch((error) => {
    erroDeInicializacao = error;
    console.error('Falha ao iniciar (banco de dados/migrações):', error);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  });

module.exports = app;
