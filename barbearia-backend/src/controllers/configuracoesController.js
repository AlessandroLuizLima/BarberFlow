const ConfiguracaoBarbearia = require('../models/ConfiguracaoBarbearia');

const DIAS_VALIDOS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const NOTIFICACOES = ['novosAgendamentos', 'cancelamentos', 'reagendamentos', 'lembretes', 'relatorios'];
const LOGO_MAX_CARACTERES = 700000; // ~500 KB de imagem em base64
const REGEX_LOGO = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valores usados enquanto a barbearia ainda não salvou nada
const PADRAO = {
  nome: 'Barbearia Estilo Clássico',
  telefone: '',
  email: '',
  endereco: '',
  endereco_detalhado: {},
  dias_atendimento: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  horario_inicio: '08:00',
  horario_fim: '18:00',
  logo: null,
  email_notificacoes: '',
  notificacoes: { novosAgendamentos: true, cancelamentos: true, reagendamentos: false, lembretes: true, relatorios: false }
};

const minutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const paraResposta = (registro) => {
  const dados = registro ? registro.toJSON() : { ...PADRAO };
  return { ...dados, id: 1, configurado: Boolean(registro) };
};

// Valida o corpo da requisição e devolve { dados } ou { erro }
const validar = (corpo) => {
  const nome = String(corpo.nome ?? '').trim();
  if (!nome) return { erro: 'O nome da barbearia é obrigatório.' };
  if (nome.length > 100) return { erro: 'O nome da barbearia deve ter no máximo 100 caracteres.' };

  const telefone = String(corpo.telefone ?? '').trim();
  if (telefone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(telefone)) {
    return { erro: 'Telefone inválido. Use o formato (11) 99999-9999.' };
  }

  const email = String(corpo.email ?? '').trim();
  if (email && !REGEX_EMAIL.test(email)) return { erro: 'Email inválido.' };

  const emailNotificacoes = String(corpo.email_notificacoes ?? '').trim();
  if (emailNotificacoes && !REGEX_EMAIL.test(emailNotificacoes)) return { erro: 'Email de notificações inválido.' };

  const endereco = String(corpo.endereco ?? '').trim();
  if (endereco.length > 255) return { erro: 'O endereço é muito longo.' };

  const detalhado = corpo.endereco_detalhado && typeof corpo.endereco_detalhado === 'object' && !Array.isArray(corpo.endereco_detalhado)
    ? corpo.endereco_detalhado
    : {};
  const enderecoDetalhado = {};
  ['rua', 'numero', 'bairro', 'cidade', 'estado', 'pontoReferencia'].forEach((campo) => {
    enderecoDetalhado[campo] = String(detalhado[campo] ?? '').trim().slice(0, 100);
  });

  const dias = Array.isArray(corpo.dias_atendimento) ? corpo.dias_atendimento : [];
  if (dias.length === 0) return { erro: 'Selecione pelo menos um dia de atendimento.' };
  if (!dias.every((d) => DIAS_VALIDOS.includes(d))) return { erro: 'Dia de atendimento inválido.' };
  const diasOrdenados = DIAS_VALIDOS.filter((d) => dias.includes(d));

  const inicio = String(corpo.horario_inicio ?? '');
  const fim = String(corpo.horario_fim ?? '');
  if (!REGEX_HORA.test(inicio) || !REGEX_HORA.test(fim)) return { erro: 'Horário de funcionamento inválido.' };
  if (minutos(fim) <= minutos(inicio)) return { erro: 'O horário de fim deve ser posterior ao de início.' };

  let logo = null;
  if (corpo.logo) {
    if (typeof corpo.logo !== 'string' || !REGEX_LOGO.test(corpo.logo)) {
      return { erro: 'Logo inválida. Envie uma imagem PNG, JPG, WEBP ou GIF.' };
    }
    if (corpo.logo.length > LOGO_MAX_CARACTERES) return { erro: 'A logo é muito grande. Use uma imagem de até 500 KB.' };
    logo = corpo.logo;
  }

  const recebidas = corpo.notificacoes && typeof corpo.notificacoes === 'object' ? corpo.notificacoes : {};
  const notificacoes = {};
  NOTIFICACOES.forEach((chave) => {
    notificacoes[chave] = Boolean(recebidas[chave]);
  });

  return {
    dados: {
      nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      endereco_detalhado: enderecoDetalhado,
      dias_atendimento: diasOrdenados,
      horario_inicio: inicio,
      horario_fim: fim,
      logo,
      email_notificacoes: emailNotificacoes || null,
      notificacoes
    }
  };
};

// READ - Configurações da barbearia (usadas pelo painel do barbeiro e pelo app do cliente)
exports.obterConfiguracao = async (req, res) => {
  try {
    const registro = await ConfiguracaoBarbearia.findByPk(1);
    res.status(200).json(paraResposta(registro));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Salva as configurações (cria o registro na primeira vez)
exports.salvarConfiguracao = async (req, res) => {
  try {
    const { dados, erro } = validar(req.body || {});
    if (erro) return res.status(400).json({ error: erro });

    const valores = { ...dados, id: 1, atualizado_em: new Date() };
    await ConfiguracaoBarbearia.upsert(valores);

    const registro = await ConfiguracaoBarbearia.findByPk(1);
    res.status(200).json({ message: 'Configurações salvas com sucesso!', configuracao: paraResposta(registro) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
