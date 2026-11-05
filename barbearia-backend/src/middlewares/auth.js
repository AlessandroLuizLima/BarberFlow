/**
 * Autenticação por token (JWT) e controle de acesso.
 *
 * - O login (cliente ou barbeiro) devolve um token assinado com JWT_SECRET.
 * - O frontend manda o token em "Authorization: Bearer <token>".
 * - A cada requisição o usuário é buscado no banco: conta apagada, desativada
 *   ou com senha trocada depois do login (token_versao) invalida o token na hora.
 *
 * req.usuario = { id, papel: 'cliente' | 'barbeiro', nome, email }
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Cliente, Administrador } = require('../models');

const EM_PRODUCAO = process.env.NODE_ENV === 'production' || Boolean(process.env.WEBSITE_SITE_NAME);

// Sem JWT_SECRET em desenvolvimento, gera um segredo aleatório (as sessões caem ao reiniciar).
// Em produção é obrigatório: server.js não sobe as rotas sem ele.
const SEGREDO = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
  ? process.env.JWT_SECRET
  : crypto.randomBytes(48).toString('hex');
const SEGREDO_CONFIGURADO = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
if (!SEGREDO_CONFIGURADO && !EM_PRODUCAO) {
  console.warn('[auth] JWT_SECRET não definido (ou com menos de 32 caracteres): usando um segredo temporário.');
}

const DURACAO = { cliente: '7d', barbeiro: '12h' };
const ALGORITMO = 'HS256';

function gerarToken(usuario, papel) {
  return jwt.sign(
    { sub: String(usuario.id), papel, v: usuario.token_versao || 0 },
    SEGREDO,
    { algorithm: ALGORITMO, expiresIn: DURACAO[papel], issuer: 'barberflow' }
  );
}

function lerToken(req) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

async function carregarUsuario(token) {
  let dados;
  try {
    dados = jwt.verify(token, SEGREDO, { algorithms: [ALGORITMO], issuer: 'barberflow' });
  } catch {
    return null;
  }
  const id = Number(dados.sub);
  if (!Number.isInteger(id)) return null;

  if (dados.papel === 'cliente') {
    const cliente = await Cliente.findByPk(id, { attributes: ['id', 'nome_completo', 'email', 'token_versao'] });
    if (!cliente || cliente.token_versao !== dados.v) return null;
    return { id: cliente.id, papel: 'cliente', nome: cliente.nome_completo, email: cliente.email };
  }
  if (dados.papel === 'barbeiro') {
    const admin = await Administrador.findByPk(id);
    if (!admin || !admin.ativo || admin.token_versao !== dados.v) return null;
    return { id: admin.id, papel: 'barbeiro', nome: admin.nome, email: admin.email };
  }
  return null;
}

// Lê o token se existir (rotas públicas que mostram mais dados para quem está logado)
async function autenticacaoOpcional(req, res, next) {
  try {
    const token = lerToken(req);
    req.usuario = token ? await carregarUsuario(token) : null;
    next();
  } catch (error) {
    next(error);
  }
}

// Exige estar logado com um dos papéis informados
const exigir = (...papeis) => async (req, res, next) => {
  try {
    const token = lerToken(req);
    const usuario = token ? await carregarUsuario(token) : null;
    if (!usuario) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    }
    if (papeis.length > 0 && !papeis.includes(usuario.papel)) {
      return res.status(403).json({ error: 'Você não tem permissão para esta ação.' });
    }
    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};

const exigirLogin = exigir('cliente', 'barbeiro');
const exigirBarbeiro = exigir('barbeiro');
const exigirCliente = exigir('cliente');

// Cliente só acessa o próprio cadastro (:id); o barbeiro acessa qualquer um
const exigirProprioClienteOuBarbeiro = [
  exigirLogin,
  (req, res, next) => {
    if (req.usuario.papel === 'barbeiro') return next();
    if (String(req.usuario.id) === String(req.params.id)) return next();
    return res.status(403).json({ error: 'Você não tem permissão para acessar este cadastro.' });
  }
];

const ehBarbeiro = (req) => req.usuario?.papel === 'barbeiro';

module.exports = {
  gerarToken,
  autenticacaoOpcional,
  exigirLogin,
  exigirBarbeiro,
  exigirCliente,
  exigirProprioClienteOuBarbeiro,
  ehBarbeiro,
  SEGREDO_CONFIGURADO,
  EM_PRODUCAO
};
