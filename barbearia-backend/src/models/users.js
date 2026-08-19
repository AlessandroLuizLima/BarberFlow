const { DataTypes } = require("sequelize")
const sequelize = require('../../config/sequelize');

const Usuario = sequelize.define('Usuario', {
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
  senha: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'usuarios', // Nome da tabela no banco
  timestamps: false, // Se não quiser created_at e updated_at
  freezeTableName: true // Mantém o nome da tabela como definido
});
module.exports = Usuario;