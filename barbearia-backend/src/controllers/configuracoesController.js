const { sequelize, ConfiguracaoBarbearia } = require('../models');
const imagemService = require('../services/imagemService');
const { geocodificarEndereco } = require('../services/geocodingService');

const DIAS_VALIDOS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const NOTIFICACOES = ['novosAgendamentos', 'cancelamentos', 'reagendamentos', 'lembretes', 'relatorios'];
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
  logo_id: null,
  latitude: null,
  longitude: null,
  email_notificacoes: '',
  notificacoes: { novosAgendamentos: true, cancelamentos: true, reagendamentos: false, lembretes: true, relatorios: false }
};

const minutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const paraNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

const paraResposta = (registro) => {
  const dados = registro ? registro.toJSON() : { ...PADRAO };
  const logoUrl = imagemService.urlDaImagem(dados.logo_id);
  return {
    ...dados,
    id: 1,
    configurado: Boolean(registro),
    logo_url: logoUrl,
    logo: logoUrl, // compatibilidade com versões antigas do frontend
    latitude: paraNumero(dados.latitude),
    longitude: paraNumero(dados.longitude)
  };
};

// Endereço no formato do serviço de geocodificação
const enderecoParaGeocodificar = (d = {}) => ({
  rua: d.rua,
  numero: d.numero,
  bairro: d.bairro,
  cidade: d.cidade,
  uf: d.estado
});

const mesmoEndereco = (a = {}, b = {}) =>
  ['rua', 'numero', 'bairro', 'cidade', 'estado'].every((campo) => (a[campo] || '') === (b[campo] || ''));

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

  // Logo: data URL = imagem nova; vazio/null = remover; qualquer outra string (a URL atual) = manter
  let logo;
  if (!corpo.logo) logo = { acao: 'remover' };
  else if (imagemService.ehDataUrl(corpo.logo)) logo = { acao: 'trocar', dataUrl: corpo.logo };
  else logo = { acao: 'manter' };

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
      email_notificacoes: emailNotificacoes || null,
      notificacoes
    },
    logo
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

// UPDATE - Salva as configurações (cria o registro na primeira vez).
// Também troca/remove a logo e recalcula as coordenadas quando o endereço muda.
exports.salvarConfiguracao = async (req, res) => {
  try {
    const { dados, logo, erro } = validar(req.body || {});
    if (erro) return res.status(400).json({ error: erro });

    const atual = await ConfiguracaoBarbearia.findByPk(1);

    // Geocodifica fora da transação (é uma chamada externa e pode demorar alguns segundos)
    let coordenadas = { latitude: atual?.latitude ?? null, longitude: atual?.longitude ?? null };
    const enderecoMudou = !atual || !mesmoEndereco(atual.endereco_detalhado, dados.endereco_detalhado);
    if (enderecoMudou || coordenadas.latitude === null) {
      const encontradas = await geocodificarEndereco(enderecoParaGeocodificar(dados.endereco_detalhado));
      coordenadas = encontradas || { latitude: null, longitude: null };
    }

    const logoAntiga = atual?.logo_id ?? null;
    await sequelize.transaction(async (transaction) => {
      let logoId = logoAntiga;
      if (logo.acao === 'trocar') logoId = await imagemService.salvarImagem(logo.dataUrl, { transaction });
      if (logo.acao === 'remover') logoId = null;

      await ConfiguracaoBarbearia.upsert(
        { ...dados, ...coordenadas, logo_id: logoId, id: 1, atualizado_em: new Date() },
        { transaction }
      );
      if (logoAntiga && logoAntiga !== logoId) {
        await imagemService.removerImagem(logoAntiga, { transaction });
      }
    });

    const registro = await ConfiguracaoBarbearia.findByPk(1);
    res.status(200).json({
      message: 'Configurações salvas com sucesso!',
      configuracao: paraResposta(registro),
      localizacao_encontrada: registro.latitude !== null
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
