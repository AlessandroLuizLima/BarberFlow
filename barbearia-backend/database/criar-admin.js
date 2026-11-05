require('dotenv').config();
const { sequelize, Administrador } = require('../src/models');
const { executarMigracoes } = require('../src/database/migrations');
const { validarSenha } = require('../src/utils/senha');
const { perguntar, fecharTerminal } = require('./_terminal');

/**
 * Cria (ou redefine a senha de) uma conta de acesso ao painel do barbeiro.
 * Não existe cadastro de barbeiro pelo site: esta é a única forma de criar uma conta.
 *
 * Uso: npm run criar-admin
 */
async function main() {
  await sequelize.authenticate();
  await sequelize.sync();
  await executarMigracoes(sequelize);

  console.log('\n=== Conta do painel do barbeiro ===\n');
  const email = (await perguntar('Email: ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido.');

  const existente = await Administrador.findOne({ where: { email } });
  const nome = existente
    ? existente.nome
    : await perguntar('Nome: ');
  if (!nome || nome.length < 3) throw new Error('Informe o nome (mínimo de 3 letras).');

  const senha = await perguntar(existente ? 'Nova senha: ' : 'Senha: ', { oculto: true });
  const erro = validarSenha(senha);
  if (erro) throw new Error(erro);
  const confirmacao = await perguntar('Repita a senha: ', { oculto: true });
  if (senha !== confirmacao) throw new Error('As senhas não conferem.');

  if (existente) {
    existente.senha = senha; // o hook faz o hash e derruba as sessões abertas
    existente.ativo = true;
    await existente.save();
    console.log(`\nSenha de ${email} redefinida. Sessões antigas foram encerradas.`);
  } else {
    await Administrador.create({ nome, email, senha });
    console.log(`\nConta criada! Entre em /auth/barbeiro com ${email}.`);
  }
}

main()
  .finally(fecharTerminal)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\nNão foi possível concluir: ${error.message}`);
    process.exit(1);
  });
