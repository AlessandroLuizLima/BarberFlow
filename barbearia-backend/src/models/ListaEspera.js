const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const ListaEspera = sequelize.define('ListaEspera', {
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
  data_desejada: {
    // Dia em que o cliente deseja ser atendido, caso vague um horário
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('aguardando', 'notificado', 'expirado'),
    allowNull: false,
    defaultValue: 'aguardando'
  }
}, {
  tableName: 'lista_espera',
  timestamps: false,
  freezeTableName: true
});

module.exports = ListaEspera;
