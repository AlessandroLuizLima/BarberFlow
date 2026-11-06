const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Cada venda de produto registrada no painel. Entra no Financeiro e baixa o estoque.
// Guarda preço e custo do momento da venda (mudar o produto depois não altera o histórico).
const VendaProduto = sequelize.define('VendaProduto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  barbearia_id: { type: DataTypes.INTEGER, allowNull: false },
  produto_id: { type: DataTypes.INTEGER, allowNull: false },
  quantidade: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  valor_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  custo_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
}, {
  tableName: 'vendas_produtos',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false,
  indexes: [{ fields: ['barbearia_id', 'criado_em'] }, { fields: ['produto_id'] }]
});

module.exports = VendaProduto;
