const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Mensagens do formulário "Entre em contato" da página inicial.
// Cada uma é enviada por e-mail para o suporte (com "Responder para" o e-mail de quem escreveu)
// e fica registrada aqui, com o resultado do envio.
const Contato = sequelize.define('Contato', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  // cliente | barbeiro | outro
  perfil: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'outro'
  },
  assunto: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status_envio: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'contatos',
  freezeTableName: true,
  timestamps: false
});

module.exports = Contato;
