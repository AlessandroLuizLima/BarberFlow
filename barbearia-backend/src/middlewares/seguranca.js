/**
 * Proteções gerais da API: cabeçalhos de segurança (helmet), CORS restrito,
 * limite de requisições (força bruta / abuso) e respostas de erro sem detalhes internos.
 */
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { EM_PRODUCAO } = require('./auth');

// Origens que podem chamar a API pelo navegador.
// Padrão: desenvolvimento local + o frontend publicado no Azure (barberflow-frontend) e no GitHub Pages.
// Para trocar, defina CORS_ORIGINS no .env (URLs separadas por vírgula).
const ORIGENS_PADRAO = [
  /^http:\/\/(localhost|127\.0\.0\.1):(5173|4173)$/,
  /^https:\/\/barberflow-frontend[a-z0-9-]*(\.[a-z0-9-]+)*\.azurewebsites\.net$/,
  /^https:\/\/alessandroluizlima\.github\.io$/
];
const origensConfiguradas = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const ORIGENS = origensConfiguradas.length > 0 ? origensConfiguradas : ORIGENS_PADRAO;
const origemPermitida = (origem) => ORIGENS.some((o) => (o instanceof RegExp ? o.test(origem) : o === origem));

const corsRestrito = cors({
  origin(origem, callback) {
    // Sem Origin = chamada fora do navegador (curl, apps). A proteção real é o token.
    if (!origem || origemPermitida(origem)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
});

const cabecalhos = helmet({
  // A API só devolve JSON e imagens; as imagens são usadas pelo frontend em outro domínio
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }
});

const mensagem = (texto) => ({ error: texto });
const limitador = (opcoes) => rateLimit({
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  ...opcoes
});

// Tentativas de login: 10 a cada 15 minutos por IP (contam só as que falham)
const limiteLogin = limitador({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: mensagem('Muitas tentativas de login. Aguarde 15 minutos e tente novamente.')
});

// Criação de contas: 5 por hora por IP
const limiteCadastro = limitador({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: mensagem('Muitos cadastros feitos a partir desta rede. Tente novamente mais tarde.')
});

// Ações que disparam e-mail ou serviços externos (teste de e-mail, CEP)
const limiteSensivel = limitador({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: mensagem('Muitas requisições. Aguarde alguns minutos.')
});

// Limite geral da API
const limiteGeral = limitador({
  windowMs: 60 * 1000,
  limit: 300,
  message: mensagem('Muitas requisições. Aguarde um instante.')
});

// Erros inesperados: registra no servidor e responde sem expor detalhes (SQL, caminhos, stack)
function responderErroInterno(res, error) {
  console.error('[erro]', error);
  return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
}

// Erros de validação do Sequelize viram 400 com a mensagem do campo
function respostaDeValidacao(error) {
  if (error?.name === 'SequelizeValidationError' || error?.name === 'SequelizeUniqueConstraintError') {
    if (error.name === 'SequelizeUniqueConstraintError') return 'Este email já está cadastrado.';
    const campo = error.errors?.[0];
    if (campo?.validatorKey === 'isEmail') return 'Email inválido.';
    if (campo?.validatorKey === 'len') return `Campo ${campo.path} com tamanho inválido.`;
    return campo?.message || 'Dados inválidos.';
  }
  if (error?.name === 'SequelizeDatabaseError' && /value too long/i.test(error.message)) {
    return 'Um dos campos ultrapassou o tamanho máximo.';
  }
  return null;
}

module.exports = {
  corsRestrito,
  cabecalhos,
  limiteLogin,
  limiteCadastro,
  limiteSensivel,
  limiteGeral,
  responderErroInterno,
  respostaDeValidacao,
  ORIGENS,
  EM_PRODUCAO
};
