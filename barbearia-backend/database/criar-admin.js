require('dotenv').config();
const { sequelize, Administrador, Barbearia } = require('../src/models');
const { executarMigracoes } = require('../src/database/migrations');
const { validarSenha } = require('../src/utils/senha');
const { perguntar, fecharTerminal } = require('./_terminal');

/**
 * Cria (ou redefine a senha de) uma conta de acesso ao painel do barbeiro.
 * Normalmente a conta nasce sozinha quando o pagamento do plano é aprovado.
 * Este comando serve para criar uma barbearia manualmente (sem pagamento, plano Enterprise)
 * ou para redefinir a senha de uma conta que já existe.
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
    existente.senha_temporaria = false;
    await existente.save();
    console.log(`\nSenha de ${email} redefinida. Sessões antigas foram encerradas.`);
  } else {
    const nomeBarbearia = await perguntar('Nome da barbearia: ');
    if (!nomeBarbearia || nomeBarbearia.length < 2) throw new Error('Informe o nome da barbearia.');
    await sequelize.transaction(async (transaction) => {
      const barbearia = await Barbearia.create({
        nome: nomeBarbearia,
        email,
        email_notificacoes: email,
        plano: 'enterprise',
        status: 'ativa',
        endereco_detalhado: {},
        dias_atendimento: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
        notificacoes: { novosAgendamentos: true, cancelamentos: true, reagendamentos: true, lembretes: true, relatorios: true }
      }, { transaction });
      await Administrador.create({ nome, email, senha, barbearia_id: barbearia.id }, { transaction });
    });
    console.log(`\nBarbearia "${nomeBarbearia}" e conta criadas! Entre em /auth/barbeiro com ${email}.`);
  }
}

main()
  .finally(fecharTerminal)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\nNão foi possível concluir: ${error.message}`);
    process.exit(1);
  });
