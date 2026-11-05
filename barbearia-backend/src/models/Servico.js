const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Servico = sequelize.define('Servico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Barbearia dona do registro
  barbearia_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    allowNull: false,
    validate: { min: { args: [1], msg: 'A duração deve ser de pelo menos 1 minuto' } }
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: { args: [0], msg: 'O preço não pode ser negativo' } }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'servicos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  freezeTableName: true
});

module.exports = Servico;
