require('dotenv').config();
const { sequelize, Servico, Profissional, Barbearia } = require('../src/models');
const { executarMigracoes } = require('../src/database/migrations');

/**
 * Popula o banco com serviços e profissionais de exemplo, para que a tela
 * de agendamento do cliente não fique vazia em uma instalação nova.
 * Uso: node database/seed.js
 */
async function seed() {
  await sequelize.authenticate();
  await sequelize.sync();
  await executarMigracoes(sequelize);

  // Os exemplos vão para a primeira barbearia cadastrada (ou para uma "Barbearia Exemplo")
  let barbearia = await Barbearia.findOne({ order: [['id', 'ASC']] });
  if (!barbearia) {
    barbearia = await Barbearia.create({
      nome: 'Barbearia Exemplo',
      plano: 'enterprise',
      status: 'ativa',
      endereco_detalhado: {},
      dias_atendimento: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
      notificacoes: {}
    });
    console.log(`Barbearia criada: ${barbearia.nome} (id ${barbearia.id})`);
  }
  console.log(`Usando a barbearia: ${barbearia.nome} (id ${barbearia.id})`);

  const servicos = [
    { nome: 'Corte de Cabelo', descricao: 'Corte moderno e personalizado', duracao_minutos: 30, preco: 35.0 },
    { nome: 'Barba Completa', descricao: 'Aparar, desenhar e finalizar', duracao_minutos: 20, preco: 25.0 },
    { nome: 'Corte + Barba', descricao: 'Pacote completo de cuidados', duracao_minutos: 50, preco: 55.0 },
    { nome: 'Sobrancelha', descricao: 'Design e aparar sobrancelhas', duracao_minutos: 15, preco: 15.0 },
  ];

  const profissionais = [
    { nome_completo: 'Carlos Santos', email: 'carlos@barbearia.com', telefone: '42999990001', especialidade: 'Cortes Modernos' },
    { nome_completo: 'João Silva', email: 'joao.barbeiro@barbearia.com', telefone: '42999990002', especialidade: 'Barbas e Bigodes' },
    { nome_completo: 'Rafael Costa', email: 'rafael@barbearia.com', telefone: '42999990003', especialidade: 'Cortes Clássicos' },
  ];

  for (const servico of servicos) {
    const [registro, criado] = await Servico.findOrCreate({
      where: { nome: servico.nome, barbearia_id: barbearia.id },
      defaults: { ...servico, barbearia_id: barbearia.id }
    });
    console.log(criado ? `Serviço criado: ${registro.nome}` : `Serviço já existia: ${registro.nome}`);
  }

  for (const profissional of profissionais) {
    const [registro, criado] = await Profissional.findOrCreate({
      where: { email: profissional.email, barbearia_id: barbearia.id },
      defaults: { ...profissional, barbearia_id: barbearia.id }
    });
    console.log(criado ? `Profissional criado: ${registro.nome_completo}` : `Profissional já existia: ${registro.nome_completo}`);
  }

  console.log('Seed concluído com sucesso!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Erro ao popular o banco:', error);
  process.exit(1);
});
