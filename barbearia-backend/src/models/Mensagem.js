const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Mensagem = sequelize.define('Mensagem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    type: DataTypes.ENUM('confirmacao', 'lembrete', 'lista_espera'),
    allowNull: false
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false
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
