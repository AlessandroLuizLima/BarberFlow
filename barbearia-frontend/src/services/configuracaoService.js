import api, { urlImagem } from './api';

// Configurações da barbearia (nome, logo, endereço, horários, notificações).
// O painel do barbeiro edita; a sidebar e o app do cliente apenas leem.
const CHAVE_CACHE = 'configuracaoBarbearia';
export const EVENTO_CONFIGURACAO = 'configuracao-barbearia';

const PADRAO = {
  nome: 'Barbearia',
  telefone: '',
  email: '',
  endereco: '',
  enderecoDetalhado: { cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', pontoReferencia: '' },
  diasAtendimento: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  horarioInicio: '08:00',
  horarioFim: '18:00',
  logo: null,
  latitude: null,
  longitude: null,
  emailNotificacoes: '',
  notificacoes: { novosAgendamentos: true, cancelamentos: true, reagendamentos: false, lembretes: true, relatorios: false }
};

const paraCoordenada = (valor) => (valor === null || valor === undefined || valor === '' ? null : Number(valor));

// API (snake_case) -> formato usado no app (camelCase)
export const deApi = (d = {}) => ({
  nome: d.nome || PADRAO.nome,
  telefone: d.telefone || '',
  email: d.email || '',
  endereco: d.endereco || '',
  enderecoDetalhado: { ...PADRAO.enderecoDetalhado, ...(d.endereco_detalhado || {}) },
  diasAtendimento: Array.isArray(d.dias_atendimento) && d.dias_atendimento.length > 0 ? d.dias_atendimento : PADRAO.diasAtendimento,
  horarioInicio: d.horario_inicio || PADRAO.horarioInicio,
  horarioFim: d.horario_fim || PADRAO.horarioFim,
  // A logo fica na tabela de imagens do backend; aqui vira uma URL completa para o <img>
  logo: urlImagem(d.logo_url || d.logo),
  latitude: paraCoordenada(d.latitude),
  longitude: paraCoordenada(d.longitude),
  emailNotificacoes: d.email_notificacoes || '',
  notificacoes: { ...PADRAO.notificacoes, ...(d.notificacoes || {}) }
});

// App (camelCase) -> API (snake_case)
export const paraApi = (c) => ({
  nome: c.nomeEstabelecimento ?? c.nome,
  telefone: c.telefone,
  email: c.email,
  endereco: c.endereco,
  endereco_detalhado: c.enderecoDetalhado,
  dias_atendimento: c.diasAtendimento,
  horario_inicio: c.horarioInicio,
  horario_fim: c.horarioFim,
  // data URL = logo nova; a URL atual = manter; null = remover (o backend decide pelo formato)
  logo: typeof c.logo === 'string' ? c.logo : null,
  email_notificacoes: c.emailNotificacoes,
  notificacoes: c.notificacoes
});

export const lerCache = () => {
  try {
    const dados = localStorage.getItem(CHAVE_CACHE);
    return dados ? JSON.parse(dados) : null;
  } catch {
    return null;
  }
};

const gravarCache = (config) => {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(config));
  } catch {
    // cache é só uma otimização (ex.: cota cheia): ignora
  }
};

export const obterConfiguracao = () =>
  api.get('/configuracoes').then((r) => {
    const config = deApi(r.data);
    gravarCache(config);
    return config;
  });

// Salva no banco e avisa o resto do app (sidebar, área do cliente) para atualizar na hora
// Devolve a configuração salva com o campo extra "localizacaoEncontrada" (o backend tenta
// transformar o endereço em coordenadas para o cliente achar a barbearia mais próxima).
export const salvarConfiguracao = (formulario) =>
  api.put('/configuracoes', paraApi(formulario)).then((r) => {
    const config = deApi(r.data.configuracao);
    gravarCache(config);
    window.dispatchEvent(new CustomEvent(EVENTO_CONFIGURACAO, { detail: config }));
    return { ...config, localizacaoEncontrada: Boolean(r.data.localizacao_encontrada) };
  });

// ---- Notificações da barbearia (e-mail) ----
// { smtp_configurado, email_destino }
export const obterStatusNotificacoes = () => api.get('/configuracoes/notificacoes/status').then((r) => r.data);
// Envia um e-mail de teste. Resposta: { status: 'enviado' | 'simulado', message }
export const testarNotificacoes = () => api.post('/configuracoes/notificacoes/teste').then((r) => r.data);
// Últimas notificações enviadas para a barbearia
export const listarNotificacoesBarbearia = (limite = 15) =>
  api.get('/notificacoes-barbearia', { params: { limite } }).then((r) => r.data);
