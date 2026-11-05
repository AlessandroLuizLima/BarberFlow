require('dotenv').config();
const { sequelize } = require('../src/models');
const { executarMigracoes } = require('../src/database/migrations');
const { perguntar, fecharTerminal } = require('./_terminal');

/**
 * APAGA TODOS OS DADOS do banco configurado no .env: clientes, barbeiros, contas do painel,
 * serviços, agendamentos, lista de espera, mensagens, notificações, imagens e configurações.
 * A estrutura (tabelas e migrações) continua; os IDs voltam a começar do 1.
 *
 * Não tem volta. Faça um backup antes se houver algo que você queira manter.
 *
 * Uso: npm run reset-db
 */
async function main() {
  const banco = process.env.DB_NAME;
  const host = process.env.DB_HOST || 'localhost';
  const local = ['localhost', '127.0.0.1', '::1'].includes(host);

  await sequelize.authenticate();
  await sequelize.sync();
  await executarMigracoes(sequelize);

  const [tabelas] = await sequelize.query(
    `SELECT tablename FROM pg_tables
      WHERE schemaname = current_schema() AND tablename <> 'schema_migrations'
      ORDER BY tablename`
  );
  const nomes = tabelas.map((t) => t.tablename);
  const contagens = [];
  for (const nome of nomes) {
    const [[{ total }]] = await sequelize.query(`SELECT COUNT(*)::int AS total FROM "${nome}"`);
    contagens.push(`${nome}: ${total}`);
  }

  console.log('\n!!! ATENÇÃO: isto apaga TODOS os dados, sem volta !!!\n');
  console.log(`Banco: ${banco}  |  Servidor: ${host}${local ? ' (local)' : ' (REMOTO / produção?)'}`);
  console.log(`Registros atuais -> ${contagens.join(' | ')}\n`);

  const resposta = await perguntar(`Para confirmar, digite o nome do banco (${banco}): `);
  if (resposta !== banco) {
    console.log('Nome diferente. Nada foi apagado.');
    return;
  }

  await sequelize.query(`TRUNCATE ${nomes.map((n) => `"${n}"`).join(', ')} RESTART IDENTITY CASCADE`);
  console.log('\nBanco zerado. Próximos passos:');
  console.log('  1. npm run criar-admin   (cria a conta do painel do barbeiro)');
  console.log('  2. npm run seed          (opcional: serviços e barbeiros de exemplo)');
}

main()
  .finally(fecharTerminal)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\nNão foi possível concluir: ${error.message}`);
    process.exit(1);
  });
