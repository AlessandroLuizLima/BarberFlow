require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const { sequelize } = require('./src/models');
const { iniciarJobDeLembretes } = require('./src/jobs/lembreteJob');
const { executarMigracoes } = require('./src/database/migrations');

const routerHome = require('./src/routes/routesHome');
const routerBarber = require('./src/routes/routesBarber');
const routerClientes = require('./src/routes/routesClientes');
const routerProfissionais = require('./src/routes/routesProfissionais');
const routerServicos = require('./src/routes/routesServicos');
const routerAgendamentos = require('./src/routes/routesAgendamentos');
const routerListaEspera = require('./src/routes/routesListaEspera');
const routerMensagens = require('./src/routes/routesMensagens');
const routerConfiguracoes = require('./src/routes/routesConfiguracoes');

app.use(cors());
// Limite maior por causa da logo da barbearia (enviada como imagem em base64)
app.use(express.json({ limit: '2mb' }));

// Se o banco/migrações falharem na inicialização, o servidor continua de pé e
// responde 503 com o motivo, em vez de ficar fora do ar sem explicação.
let erroDeInicializacao = null;
app.use((req, res, next) => {
  if (erroDeInicializacao) {
    return res.status(503).json({
      error: 'Backend iniciou com erro',
      detalhe: erroDeInicializacao.message
    });
  }
  next();
});

// Rota principal para testar o funcionamento da API
app.get('/', (req, res) => {
  res.json({
    message: 'BarberFlow Backend funcionando!',
    status: 'online'
  });
});

// Rotas
app.use(routerHome);
app.use(routerBarber);
app.use(routerClientes);
app.use(routerProfissionais);
app.use(routerServicos);
app.use(routerAgendamentos);
app.use(routerListaEspera);
app.use(routerMensagens);
app.use(routerConfiguracoes);

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros não capturados
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Arquivo muito grande. Use uma imagem menor.' });
  }
  console.error(err.stack);
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