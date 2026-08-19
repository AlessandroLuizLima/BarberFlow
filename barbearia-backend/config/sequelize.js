const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Barbearia_Cortae_DB', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

module.exports = sequelize;