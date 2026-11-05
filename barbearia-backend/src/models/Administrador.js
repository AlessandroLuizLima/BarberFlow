const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/sequelize');

// Contas de acesso ao painel do barbeiro, uma por barbearia. São criadas automaticamente
// quando o pagamento do plano é aprovado (ou pelo terminal com "npm run criar-admin").
const Administrador = sequelize.define('Administrador', {
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
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  senha: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  // Aumenta a cada troca de senha: tokens emitidos antes deixam de valer
  token_versao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Senha gerada automaticamente na compra (enviada por e-mail): o painel obriga a trocar
  senha_temporaria: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ultimo_login_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'administradores',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    beforeValidate: (admin) => {
      if (typeof admin.email === 'string') admin.email = admin.email.trim().toLowerCase();
    },
    beforeSave: async (admin) => {
      if (admin.changed('senha') && admin.senha) {
        admin.senha = await bcrypt.hash(admin.senha, 12);
        if (!admin.isNewRecord) admin.token_versao += 1;
      }
    }
  },
  defaultScope: { attributes: { exclude: ['senha'] } },
  scopes: { comSenha: { attributes: { include: ['senha'] } } }
});

Administrador.prototype.verificarSenha = function (senhaDigitada) {
  return bcrypt.compare(String(senhaDigitada || ''), this.senha);
};

module.exports = Administrador;
