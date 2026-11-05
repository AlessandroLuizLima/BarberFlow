const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Compra de um plano pelo checkout do Mercado Pago.
// O id (UUID) vai como external_reference para o Mercado Pago e identifica o pedido no retorno.
// Quando o pagamento é aprovado, o sistema cria a barbearia e a conta do painel (ou renova a assinatura).
const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  plano: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // nova = primeira compra (cria barbearia e conta); renovacao = barbearia já existe
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'nova'
  },
  nome_responsavel: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nome_barbearia: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // pendente -> aprovado | recusado | cancelado
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pendente'
  },
  mp_preference_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  mp_payment_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  barbearia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  email_enviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  pago_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pedidos',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = Pedido;
