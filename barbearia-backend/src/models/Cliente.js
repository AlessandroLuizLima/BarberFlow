const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/sequelize');

const Cliente = sequelize.define('Cliente', {
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
  },
  // Endereço - preenchido automaticamente via API ViaCEP a partir do CEP
  cep: {
    type: DataTypes.STRING(9),
    allowNull: true
  },
  logradouro: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  bairro: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  uf: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  complemento: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'clientes',
  timestamps: false,
  freezeTableName: true,
  hooks: {
    beforeCreate: async (cliente) => {
      if (cliente.senha) {
        cliente.senha = await bcrypt.hash(cliente.senha, 10);
      }
    },
    beforeUpdate: async (cliente) => {
      // Só re-hasheia se a senha foi de fato alterada nesta operação
      if (cliente.changed('senha') && cliente.senha) {
        cliente.senha = await bcrypt.hash(cliente.senha, 10);
      }
    }
  }
});

Cliente.prototype.verificarSenha = function (senhaDigitada) {
  return bcrypt.compare(senhaDigitada, this.senha);
};

module.exports = Cliente;
