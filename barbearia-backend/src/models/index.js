const sequelize = require('../../config/sequelize');
const Cliente = require('./Cliente');
const Profissional = require('./Profissional');
const Servico = require('./Servico');
const Agendamento = require('./Agendamento');
const ListaEspera = require('./ListaEspera');
const Mensagem = require('./Mensagem');
const Barbearia = require('./Barbearia');
const Imagem = require('./Imagem');
const NotificacaoBarbearia = require('./NotificacaoBarbearia');
const Administrador = require('./Administrador');
const Pedido = require('./Pedido');
const Contato = require('./Contato');

// Tudo que é de uma barbearia aponta para ela. Excluir a barbearia apaga os dados dela.
const daBarbearia = { foreignKey: { name: 'barbearia_id', allowNull: false }, onDelete: 'CASCADE', onUpdate: 'CASCADE' };
Profissional.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
Servico.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
Agendamento.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
ListaEspera.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
NotificacaoBarbearia.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
Administrador.belongsTo(Barbearia, { ...daBarbearia, as: 'barbearia' });
Mensagem.belongsTo(Barbearia, { foreignKey: { name: 'barbearia_id', allowNull: true }, as: 'barbearia', onDelete: 'SET NULL' });
Pedido.belongsTo(Barbearia, { foreignKey: { name: 'barbearia_id', allowNull: true }, as: 'barbearia', onDelete: 'SET NULL' });
Barbearia.hasMany(Profissional, { foreignKey: 'barbearia_id', as: 'profissionais' });
Barbearia.hasMany(Servico, { foreignKey: 'barbearia_id', as: 'servicos' });
Barbearia.hasMany(Agendamento, { foreignKey: 'barbearia_id', as: 'agendamentos' });

// Agendamento pertence a Cliente, Profissional e Servico
// RESTRICT: não deixa apagar quem tem histórico (profissionais/serviços devem ser desativados)
const restrict = { onDelete: 'RESTRICT', onUpdate: 'CASCADE' };
Agendamento.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente', ...restrict });
Agendamento.belongsTo(Profissional, { foreignKey: 'profissional_id', as: 'profissional', ...restrict });
Agendamento.belongsTo(Servico, { foreignKey: 'servico_id', as: 'servico', ...restrict });
Cliente.hasMany(Agendamento, { foreignKey: 'cliente_id', as: 'agendamentos', ...restrict });
Profissional.hasMany(Agendamento, { foreignKey: 'profissional_id', as: 'agendamentos', ...restrict });
Servico.hasMany(Agendamento, { foreignKey: 'servico_id', as: 'agendamentos', ...restrict });

// ListaEspera pertence a Cliente, Profissional e Servico
ListaEspera.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
ListaEspera.belongsTo(Profissional, { foreignKey: 'profissional_id', as: 'profissional' });
ListaEspera.belongsTo(Servico, { foreignKey: 'servico_id', as: 'servico' });
Cliente.hasMany(ListaEspera, { foreignKey: 'cliente_id', as: 'listaEspera' });

// Mensagem pertence a Cliente e (opcionalmente) a um Agendamento
Mensagem.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Mensagem.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento' });
Cliente.hasMany(Mensagem, { foreignKey: 'cliente_id', as: 'mensagens' });

// Fotos e logo apontam para a tabela imagens. Se a imagem for apagada, a referência vira NULL.
const imagemFk = { onDelete: 'SET NULL', onUpdate: 'CASCADE', constraints: true };
Cliente.belongsTo(Imagem, { foreignKey: 'foto_id', as: 'foto', ...imagemFk });
Profissional.belongsTo(Imagem, { foreignKey: 'foto_id', as: 'foto', ...imagemFk });
Barbearia.belongsTo(Imagem, { foreignKey: 'logo_id', as: 'imagemLogo', ...imagemFk });

NotificacaoBarbearia.belongsTo(Agendamento, { foreignKey: 'agendamento_id', as: 'agendamento', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  Cliente,
  Profissional,
  Servico,
  Agendamento,
  ListaEspera,
  Mensagem,
  Barbearia,
  Imagem,
  NotificacaoBarbearia,
  Administrador,
  Pedido,
  Contato
};
