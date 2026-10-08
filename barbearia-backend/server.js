require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const { sequelize } = require('./src/models');
const { iniciarJobDeLembretes } = require('./src/jobs/lembreteJob');

const routerHome = require('./src/routes/routesHome');
const routerBarber = require('./src/routes/routesBarber');
const routerClientes = require('./src/routes/routesClientes');
const routerProfissionais = require('./src/routes/routesProfissionais');
const routerServicos = require('./src/routes/routesServicos');
const routerAgendamentos = require('./src/routes/routesAgendamentos');
const routerListaEspera = require('./src/routes/routesListaEspera');
const routerMensagens = require('./src/routes/routesMensagens');

app.use(cors());
app.use(express.json());

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

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros não capturados
app.use((err, req, res, next) => {
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

    iniciarJobDeLembretes();

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  })
  .catch((error) => {
    console.error('Não foi possível conectar ao banco de dados:', error);
  });

module.exports = app;