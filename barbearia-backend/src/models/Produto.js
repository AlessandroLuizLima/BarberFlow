const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Produtos que a barbearia vende no balcão (pomada, shampoo, óleo de barba...), com estoque.
const CATEGORIAS_PRODUTO = ['cuidados', 'styling', 'barba', 'acessorios'];

const Produto = sequelize.define('Produto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  barbearia_id: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  descricao: { type: DataTypes.STRING(255), allowNull: true },
  categoria: { type: DataTypes.ENUM(...CATEGORIAS_PRODUTO), allowNull: false, defaultValue: 'cuidados' },
  // Preço de venda e custo de compra (para calcular a margem)
  preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  custo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  // Unidades em estoque
  quantidade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'produtos',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  indexes: [{ fields: ['barbearia_id'] }]
});

Produto.CATEGORIAS = CATEGORIAS_PRODUTO;
module.exports = Produto;
