const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Profissional = sequelize.define('Profissional', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome_completo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  especialidade: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'profissionais',
  timestamps: false,
  freezeTableName: true
});

module.exports = Profissional;
