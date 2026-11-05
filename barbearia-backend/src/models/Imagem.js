const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Imagens enviadas pelo sistema (logo da barbearia, foto de perfil de clientes e profissionais).
// Ficam numa tabela própria, em binário (BYTEA), e são servidas por GET /imagens/:id.
// Assim as tabelas principais guardam só a referência (foto_id / logo_id) e não ficam
// carregando base64 pesado a cada consulta.
// O id é UUID para que as imagens não possam ser "adivinhadas" por número sequencial.
const Imagem = sequelize.define('Imagem', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  mime_type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  dados: {
    type: DataTypes.BLOB,
    allowNull: false
  },
  tamanho_bytes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'imagens',
  timestamps: false,
  freezeTableName: true
});

module.exports = Imagem;
