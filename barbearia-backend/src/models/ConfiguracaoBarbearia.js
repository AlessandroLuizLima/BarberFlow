const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Configurações da barbearia (nome, logo, endereço, horários, notificações).
// Existe uma única linha (id = 1): o sistema atende uma barbearia.
const ConfiguracaoBarbearia = sequelize.define('ConfiguracaoBarbearia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  endereco: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  endereco_detalhado: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  dias_atendimento: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  horario_inicio: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '08:00'
  },
  horario_fim: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '18:00'
  },
  // Logo (tabela imagens). Antes era um data URL em base64 numa coluna TEXT;
  // a migração 007 move as logos antigas para a tabela imagens.
  logo_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Coordenadas do endereço, calculadas ao salvar (geocodificação via OpenStreetMap).
  // Usadas para mostrar ao cliente a barbearia mais próxima.
  latitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true
  },
  email_notificacoes: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  notificacoes: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  atualizado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'configuracoes_barbearia',
  timestamps: false,
  freezeTableName: true
});

module.exports = ConfiguracaoBarbearia;
