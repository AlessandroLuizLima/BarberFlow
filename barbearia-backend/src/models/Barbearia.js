const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Cada barbearia que assina um plano (dados, logo, endereço, horários, notificações e assinatura).
// Profissionais, serviços, agendamentos e contas do painel pertencem a uma barbearia (barbearia_id).
const Barbearia = sequelize.define('Barbearia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  // Assinatura: plano comprado, situação e validade (pagamento mensal pelo Mercado Pago)
  plano: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'profissional'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'ativa'
  },
  assinatura_expira_em: {
    type: DataTypes.DATE,
    allowNull: true
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  atualizado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'barbearias',
  timestamps: false,
  freezeTableName: true
});

// Dias de tolerância depois do vencimento antes de a barbearia sair do ar para os clientes
const TOLERANCIA_DIAS = 3;

// A barbearia aparece para os clientes e aceita agendamentos?
Barbearia.prototype.estaAtiva = function () {
  if (this.status !== 'ativa') return false;
  if (!this.assinatura_expira_em) return true;
  return new Date(this.assinatura_expira_em).getTime() + TOLERANCIA_DIAS * 86400000 > Date.now();
};

module.exports = Barbearia;
