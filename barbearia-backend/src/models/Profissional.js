const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Profissional = sequelize.define('Profissional', {
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
  nome_completo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
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
  },
  // Foto de perfil (tabela imagens)
  foto_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'profissionais',
  // O mesmo email pode existir em barbearias diferentes, mas não duas vezes na mesma
  // (índice único criado pela migração 013, para funcionar também em bancos antigos)
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    beforeValidate: (profissional) => {
      if (typeof profissional.email === 'string') {
        profissional.email = profissional.email.trim().toLowerCase();
      }
    }
  },
  freezeTableName: true
});

module.exports = Profissional;
