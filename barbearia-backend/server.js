const express = require('express');
const app = express();
const port = 3000;
const sequelize = require('./config/sequelize');

const routerHome = require('./src/routes/routesHome')
const routerBarber = require('./src/routes/routesBarber')
const routerUsers = require('./src/routes/routesUsers')

app.use(express.json())

//Rotas
app.use(routerHome)
app.use(routerBarber)
app.use(routerUsers)

// Conexão com o banco de dados 
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(error => {
    console.error('Não foi possível conectar ao banco de dados:', error);
  });

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});