const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Histórico das notificações enviadas para a BARBEARIA (e-mail do barbeiro):
// novo agendamento, cancelamento, remarcação, lembrete e resumo do dia.
// As mensagens enviadas aos CLIENTES ficam na tabela "mensagens".
const NotificacaoBarbearia = sequelize.define('NotificacaoBarbearia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('novo_agendamento', 'cancelamento', 'reagendamento', 'lembrete', 'resumo_diario', 'teste'),
    allowNull: false
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  email_destino: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  // enviado = e-mail saiu; simulado = SMTP não configurado; falhou = erro do provedor
  status_envio: {
    type: DataTypes.ENUM('enviado', 'simulado', 'falhou'),
    allowNull: false
  },
  erro_envio: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notificacoes_barbearia',
  timestamps: false,
  freezeTableName: true
});

module.exports = NotificacaoBarbearia;
