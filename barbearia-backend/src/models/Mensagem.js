const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Mensagem = sequelize.define('Mensagem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Barbearia que enviou (vazio em mensagens antigas)
  barbearia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  agendamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo: {
    // confirmacao: enviada ao criar o agendamento
    // lembrete: enviada 2h antes do horário
    // lista_espera: enviada quando um horário vaga
    // remarcacao: enviada quando o agendamento muda de horário/profissional
    // cancelamento: enviada quando o agendamento é cancelado
    type: DataTypes.ENUM('confirmacao', 'lembrete', 'lista_espera', 'remarcacao', 'cancelamento'),
    allowNull: false
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Canal real de envio: e-mail para o endereço cadastrado do cliente
  email_destino: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  // enviado = e-mail saiu; simulado = SMTP não configurado; falhou = erro do provedor
  status_envio: {
    type: DataTypes.ENUM('enviado', 'simulado', 'falhou'),
    allowNull: true
  },
  erro_envio: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  enviada_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mensagens',
  timestamps: false,
  freezeTableName: true
});

module.exports = Mensagem;
