const sequelize = require('../../config/sequelize');
const Cliente = require('./Cliente');
const Profissional = require('./Profissional');
const Servico = require('./Servico');
const Agendamento = require('./Agendamento');
const ListaEspera = require('./ListaEspera');
const Mensagem = require('./Mensagem');
const ConfiguracaoBarbearia = require('./ConfiguracaoBarbearia');

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

module.exports = {
  sequelize,
  Cliente,
  Profissional,
  Servico,
  Agendamento,
  ListaEspera,
  Mensagem,
  ConfiguracaoBarbearia
};
