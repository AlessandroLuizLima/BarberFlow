const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Servico = sequelize.define('Servico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duracao_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'servicos',
  timestamps: false,
  freezeTableName: true
});

module.exports = Servico;
