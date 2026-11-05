/**
 * Venda de planos: pedido -> pagamento no Mercado Pago -> barbearia e conta criadas automaticamente.
 *
 * Fluxo de uma compra nova:
 *  1. iniciarCheckout cria o Pedido (pendente) e a preferência no Mercado Pago, e devolve o link.
 *  2. O comprador paga no Mercado Pago.
 *  3. O Mercado Pago avisa o backend (webhook) e/ou o comprador volta para /assinar/retorno.
 *     Nos dois casos o pagamento é consultado NO Mercado Pago (processarPagamento).
 *  4. Aprovado e com o valor certo: cria a barbearia + a conta do painel com senha temporária
 *     e envia o e-mail com os dados de acesso. Tudo isso acontece uma vez só por pedido.
 *
 * Renovação: o barbeiro logado compra pelo painel; o pagamento aprovado soma 30 dias e aplica o plano.
 */
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, Pedido, Barbearia, Administrador } = require('../models');
const { PLANOS, DIAS_POR_PAGAMENTO, obterPlano } = require('../utils/planos');
const mercadoPago = require('./mercadoPagoService');
const { enviarEmail } = require('./emailService');
const { EM_PRODUCAO } = require('../middlewares/auth');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_FRONTEND = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
// No Azure o endereço público da API vem em WEBSITE_HOSTNAME (não precisa configurar BACKEND_URL)
const URL_BACKEND = () =>
  (process.env.BACKEND_URL || (process.env.WEBSITE_HOSTNAME ? `https://${process.env.WEBSITE_HOSTNAME}` : '')).replace(/\/$/, '');

// Pagamento de demonstração (sem Mercado Pago). Nunca vale em produção.
const pagamentoSimulado = () => !EM_PRODUCAO && process.env.PAGAMENTO_SIMULADO === 'true';

class ErroAssinatura extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Senha temporária forte e fácil de digitar (sem 0/O, 1/l/I)
function gerarSenha(tamanho = 12) {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  const todos = letras + numeros;
  const escolher = (conjunto) => conjunto[crypto.randomInt(conjunto.length)];
  const caracteres = [escolher(letras), escolher(numeros), ...Array.from({ length: tamanho - 2 }, () => escolher(todos))];
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}

const somarDias = (data, dias) => new Date(data.getTime() + dias * 86400000);
const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');
const mascararEmail = (email) => String(email).replace(/^(.)(.*)(@.*)$/, (_, a, meio, dominio) => `${a}${'*'.repeat(Math.min(6, meio.length))}${dominio}`);

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

/**
 * Cria o pedido e devolve para onde mandar o comprador pagar.
 * @param {object} corpo  - { plano, nome_responsavel, email, telefone, nome_barbearia }
 * @param {object|null} barbeiro - req.usuario quando é renovação pelo painel
 */
async function iniciarCheckout(corpo, barbeiro = null) {
  const plano = obterPlano(corpo.plano);
  if (!plano) throw new ErroAssinatura(400, 'Plano inválido.');
  if (!mercadoPago.configurado() && !pagamentoSimulado()) {
    throw new ErroAssinatura(503, 'O pagamento ainda não está configurado. Tente novamente mais tarde.');
  }

  let dados;
  if (barbeiro) {
    // Renovação / troca de plano da barbearia do barbeiro logado
    const barbearia = await Barbearia.findByPk(barbeiro.barbearia_id);
    if (!barbearia) throw new ErroAssinatura(404, 'Barbearia não encontrada.');
    dados = {
      tipo: 'renovacao',
      barbearia_id: barbearia.id,
      nome_responsavel: barbeiro.nome,
      email: barbeiro.email,
      telefone: barbearia.telefone,
      nome_barbearia: barbearia.nome
    };
  } else {
    const email = texto(corpo.email, 150).toLowerCase();
    dados = {
      tipo: 'nova',
      nome_responsavel: texto(corpo.nome_responsavel, 100),
      email,
      telefone: texto(corpo.telefone, 20) || null,
      nome_barbearia: texto(corpo.nome_barbearia, 100)
    };
    if (dados.nome_responsavel.length < 3) throw new ErroAssinatura(400, 'Informe seu nome completo.');
    if (!REGEX_EMAIL.test(email)) throw new ErroAssinatura(400, 'Email inválido.');
    if (dados.nome_barbearia.length < 2) throw new ErroAssinatura(400, 'Informe o nome da barbearia.');
    // Um e-mail = uma conta. Quem já tem conta renova pelo painel (evita que outra pessoa
    // mude o plano de uma barbearia só sabendo o e-mail do dono).
    if (await Administrador.findOne({ where: { email } })) {
      throw new ErroAssinatura(409, 'Já existe uma barbearia com este e-mail. Entre no painel para renovar ou mudar de plano.');
    }
  }

  const pedido = await Pedido.create({ ...dados, plano: plano.chave, valor: plano.preco, status: 'pendente' });

  if (pagamentoSimulado()) {
    return { pedido_id: pedido.id, url: `${URL_FRONTEND()}/assinar/simulado/${pedido.id}`, simulado: true };
  }

  const preferencia = await mercadoPago.criarPreferencia({ pedido, plano, urlFrontend: URL_FRONTEND(), urlBackend: URL_BACKEND() });
  await pedido.update({ mp_preference_id: preferencia.id });
  return { pedido_id: pedido.id, url: preferencia.url, simulado: false };
}

// Cria a barbearia e a conta do painel (pedido novo) ou estende a assinatura (renovação).
// Roda dentro da transação que trava o pedido, então nunca acontece duas vezes.
async function provisionar(pedido, transaction) {
  const plano = obterPlano(pedido.plano);
  const agora = new Date();

  if (pedido.tipo === 'renovacao') {
    const barbearia = await Barbearia.findByPk(pedido.barbearia_id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!barbearia) throw new Error(`Barbearia ${pedido.barbearia_id} do pedido ${pedido.id} não existe mais`);
    const base = barbearia.assinatura_expira_em && new Date(barbearia.assinatura_expira_em) > agora
      ? new Date(barbearia.assinatura_expira_em)
      : agora;
    await barbearia.update({
      plano: plano.chave,
      status: 'ativa',
      assinatura_expira_em: somarDias(base, DIAS_POR_PAGAMENTO),
      atualizado_em: agora
    }, { transaction });
    return { barbearia, senha: null };
  }

  const barbearia = await Barbearia.create({
    nome: pedido.nome_barbearia,
    email: pedido.email,
    telefone: pedido.telefone,
    email_notificacoes: pedido.email,
    endereco_detalhado: {},
    dias_atendimento: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    horario_inicio: '08:00',
    horario_fim: '18:00',
    notificacoes: { novosAgendamentos: true, cancelamentos: true, reagendamentos: true, lembretes: true, relatorios: true },
    plano: plano.chave,
    status: 'ativa',
    assinatura_expira_em: somarDias(agora, DIAS_POR_PAGAMENTO)
  }, { transaction });

  const senha = gerarSenha();
  await Administrador.create({
    barbearia_id: barbearia.id,
    nome: pedido.nome_responsavel,
    email: pedido.email,
    senha,
    senha_temporaria: true
  }, { transaction });

  await pedido.update({ barbearia_id: barbearia.id }, { transaction });
  return { barbearia, senha };
}

async function enviarEmailDeAcesso(pedido, barbearia, senha) {
  const plano = obterPlano(pedido.plano);
  const linkPainel = `${URL_FRONTEND()}/auth/barbeiro`;
  const conteudo = senha
    ? {
        assunto: `Sua barbearia ${barbearia.nome} está pronta no BarberFlow`,
        titulo: 'Pagamento aprovado! Aqui está seu acesso',
        paragrafos: [
          `Olá, ${pedido.nome_responsavel.split(' ')[0]}! Obrigado por assinar o ${plano.nome}.`,
          `Entre no painel em ${linkPainel} com os dados abaixo. No primeiro acesso você vai criar uma senha nova.`,
          'Depois, em Configurações, cadastre o endereço, a logo, os horários, os barbeiros e os serviços.'
        ],
        linhas: [
          ['Painel', linkPainel],
          ['E-mail', pedido.email],
          ['Senha temporária', senha],
          ['Plano', `${plano.nome} (${formatarMoeda(pedido.valor)})`],
          ['Válido até', formatarData(barbearia.assinatura_expira_em)]
        ],
        rodape: 'Não compartilhe esta senha. Se não foi você que fez esta compra, responda este e-mail.'
      }
    : {
        assunto: `Assinatura renovada: ${barbearia.nome}`,
        titulo: 'Pagamento aprovado!',
        paragrafos: [`A assinatura da ${barbearia.nome} foi renovada.`],
        linhas: [
          ['Plano', `${plano.nome} (${formatarMoeda(pedido.valor)})`],
          ['Válido até', formatarData(barbearia.assinatura_expira_em)]
        ]
      };

  const resultado = await enviarEmail({ para: pedido.email, assunto: conteudo.assunto, conteudo, nomeRemetente: 'BarberFlow' });
  await Pedido.update({ email_enviado: resultado.status === 'enviado' }, { where: { id: pedido.id } });
  if (resultado.status !== 'enviado' && senha && !EM_PRODUCAO) {
    // Só em desenvolvimento, para testar sem SMTP configurado
    console.log(`[assinatura] (dev) acesso de ${pedido.email}: senha temporária ${senha}`);
  }
  return resultado;
}

// Marca o pedido como aprovado e libera o acesso (uma única vez, mesmo com avisos repetidos)
async function aprovarPedido(pedidoId, { pagamentoId = null, valorPago = null } = {}) {
  let resultado = null;
  await sequelize.transaction(async (transaction) => {
    const pedido = await Pedido.findByPk(pedidoId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!pedido || pedido.status === 'aprovado') return;
    if (valorPago !== null && Math.abs(Number(valorPago) - Number(pedido.valor)) > 0.009) {
      console.error(`[assinatura] valor pago (${valorPago}) diferente do pedido ${pedido.id} (${pedido.valor}). Não liberado.`);
      await pedido.update({ status: 'recusado', mp_payment_id: pagamentoId }, { transaction });
      return;
    }
    const { barbearia, senha } = await provisionar(pedido, transaction);
    await pedido.update({ status: 'aprovado', mp_payment_id: pagamentoId, pago_em: new Date() }, { transaction });
    resultado = { pedido, barbearia, senha };
  });

  // E-mail depois de gravar (se o envio falhar, a compra já está garantida)
  if (resultado) {
    console.log(`[assinatura] pedido ${resultado.pedido.id} aprovado: barbearia ${resultado.barbearia.id} (${resultado.pedido.tipo})`);
    await enviarEmailDeAcesso(resultado.pedido, resultado.barbearia, resultado.senha).catch((e) =>
      console.error('[assinatura] falha ao enviar e-mail de acesso:', e.message));
  }
  return resultado;
}

// Consulta o pagamento no Mercado Pago e atualiza o pedido correspondente
async function processarPagamento(pagamentoId) {
  if (!mercadoPago.configurado()) return null;
  const pagamento = await mercadoPago.buscarPagamento(pagamentoId);
  const pedidoId = pagamento.external_reference;
  if (!pedidoId || !/^[0-9a-f-]{36}$/i.test(pedidoId)) return null;

  const pedido = await Pedido.findByPk(pedidoId);
  if (!pedido) return null;

  if (pagamento.status === 'approved' && pagamento.currency_id === 'BRL') {
    await aprovarPedido(pedido.id, { pagamentoId: String(pagamento.id), valorPago: pagamento.transaction_amount });
  } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pagamento.status) && pedido.status === 'pendente') {
    await pedido.update({ status: pagamento.status === 'rejected' ? 'recusado' : 'cancelado', mp_payment_id: String(pagamento.id) });
  }
  return Pedido.findByPk(pedido.id);
}

// Situação do pedido para a página de retorno (sem expor dados pessoais)
async function situacaoDoPedido(pedidoId, pagamentoId) {
  let pedido = await Pedido.findByPk(pedidoId);
  if (!pedido) return null;

  // Se o webhook ainda não chegou (ou não alcança o backend, como em localhost),
  // confere o pagamento informado no retorno, desde que ele seja deste pedido
  if (pedido.status === 'pendente' && pagamentoId && /^\d{1,20}$/.test(String(pagamentoId))) {
    try {
      const atualizado = await processarPagamento(pagamentoId);
      if (atualizado && atualizado.id === pedido.id) pedido = atualizado;
    } catch (error) {
      console.warn('[assinatura] não foi possível consultar o pagamento:', error.message);
    }
  }

  const plano = obterPlano(pedido.plano);
  return {
    status: pedido.status,
    tipo: pedido.tipo,
    plano: plano?.nome,
    valor: Number(pedido.valor),
    email: mascararEmail(pedido.email),
    email_enviado: pedido.email_enviado
  };
}

// Pedidos pendentes há mais de 3 dias não serão mais pagos: viram "cancelado"
async function expirarPedidosAntigos() {
  await Pedido.update(
    { status: 'cancelado' },
    { where: { status: 'pendente', criado_em: { [Op.lt]: new Date(Date.now() - 3 * 86400000) } } }
  );
}

const listarPlanos = () => Object.values(PLANOS).map(({ chave, nome, preco, maxProfissionais, maxAgendamentosMes }) => ({
  chave, nome, preco, max_profissionais: maxProfissionais, max_agendamentos_mes: maxAgendamentosMes, dias: DIAS_POR_PAGAMENTO
}));

module.exports = {
  ErroAssinatura,
  iniciarCheckout,
  aprovarPedido,
  processarPagamento,
  situacaoDoPedido,
  expirarPedidosAntigos,
  listarPlanos,
  pagamentoSimulado,
  gerarSenha
};
