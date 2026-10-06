const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Agendamento = sequelize.define('Agendamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  profissional_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servico_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('agendado', 'confirmado', 'cancelado', 'concluido'),
    allowNull: false,
    defaultValue: 'agendado'
  },
  lembrete_enviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'agendamentos',
  timestamps: false,
  freezeTableName: true
});

module.exports = Agendamento;
