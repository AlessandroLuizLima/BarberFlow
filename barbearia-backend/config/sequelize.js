require('dotenv').config();

const { Sequelize } = require('sequelize');

const host = process.env.DB_HOST || 'localhost';
const ehLocal = ['localhost', '127.0.0.1', '::1'].includes(host);

// SSL: se DB_SSL estiver definido ('true' ou 'false'), ele manda.
// Se não estiver, usa SSL apenas quando o banco NÃO é local
// (ex.: Azure/Render exigem SSL; o Postgres instalado na máquina não suporta).
const usarSSL =
  process.env.DB_SSL !== undefined && process.env.DB_SSL !== ''
    ? process.env.DB_SSL.toLowerCase() === 'true'
    : !ehLocal;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: usarSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}
  }
);

module.exports = sequelize;