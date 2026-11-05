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
    // agendado/confirmado/remarcado = ativos (ocupam o horário)
    // concluido/cancelado = finais (não mudam mais)
    type: DataTypes.ENUM('agendado', 'confirmado', 'remarcado', 'cancelado', 'concluido'),
    allowNull: false,
    defaultValue: 'agendado'
  },
  preco_cobrado: {
    // Valor do serviço no momento do agendamento (não muda se o preço do serviço mudar depois)
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  lembrete_enviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'agendamentos',
  // criado_em: quando o cliente marcou; atualizado_em: última mudança (remarcação, cancelamento...)
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  freezeTableName: true
});

module.exports = Agendamento;
