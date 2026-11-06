// Catálogo de barbearias do lado do cliente: só as reais, com assinatura ativa (GET /barbearias).
// Nome, logo, endereço e horários são os das Configurações de cada painel.

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const pagamentos = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'];

const horarioPadrao = [
  { day: 'Segunda-feira', hours: '09:00 - 19:00' },
  { day: 'Terça-feira', hours: '09:00 - 19:00' },
  { day: 'Quarta-feira', hours: '09:00 - 19:00' },
  { day: 'Quinta-feira', hours: '09:00 - 19:00' },
  { day: 'Sexta-feira', hours: '09:00 - 20:00' },
  { day: 'Sábado', hours: '08:00 - 18:00' },
];

// Logo gerada para as barbearias de demonstração: círculo colorido com as iniciais do nome
export const logoPadrao = (nome, cor = '#3b82f6') => {
  const iniciais = nome
    .split(/\s+/)
    .filter((p) => /[A-Za-zÀ-ú]/.test(p[0]))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${cor}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs>` +
    `<circle cx="64" cy="64" r="64" fill="url(#g)"/>` +
    `<text x="64" y="64" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#ffffff">${iniciais}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// [latitude, longitude] aproximados do endereço de cada barbearia de demonstração



// Horário de funcionamento no formato da página de detalhes (dias fechados aparecem como "Fechado")
const horariosDaConfig = (config) =>
  DIAS_SEMANA.filter((dia) => dia !== 'Domingo' || config?.diasAtendimento?.includes('Domingo')).map((dia) => ({
    day: dia,
    hours: config?.diasAtendimento?.includes(dia) ? `${config.horarioInicio} - ${config.horarioFim}` : 'Fechado',
  }));

// Endereço em uma linha: "Rua 14 de Dezembro, 67 - Centro, Paulo Frontin/PR"
const enderecoEmLinha = (d = {}) => {
  const rua = [d.rua, d.numero].filter(Boolean).join(', ');
  const cidade = [d.cidade, d.estado].filter(Boolean).join('/');
  return [[rua, d.bairro].filter(Boolean).join(' - '), cidade].filter(Boolean).join(', ');
};

// Barbearia real, montada a partir das Configurações salvas pelo barbeiro dela
export function montarBarbeariaReal(config) {
  const d = config?.enderecoDetalhado || {};
  const rua = [d.rua, d.numero].filter(Boolean).join(', ');
  return {
    id: config?.id,
    real: true,
    diasAtendimento: config?.diasAtendimento,
    name: config?.nome || 'Barbearia',
    logo: config?.logo || null,
    rating: 5,
    // Coordenadas calculadas pelo backend a partir do endereço salvo nas Configurações
    latitude: config?.latitude ?? null,
    longitude: config?.longitude ?? null,
    distance: '',
    phone: config?.telefone || '',
    email: config?.email || '',
    address: config?.endereco || enderecoEmLinha(d) || 'Endereço ainda não informado',
    services: [],
    products: [],
    reviews: [],
    averageRating: 5,
    totalReviews: 0,
    details: {
      address: { street: rua, neighborhood: d.bairro || '', city: d.cidade || '', state: d.estado || '', cep: d.cep || '' },
      openingHours: config ? horariosDaConfig(config) : horarioPadrao,
      paymentMethods: pagamentos,
    },
  };
}

// Lista exibida ao cliente: só barbearias reais (assinatura ativa, vindas do banco)
export const listarBarbearias = (reais = []) => reais.filter((c) => c?.id).map(montarBarbeariaReal);

export const obterBarbearia = (id, reais) =>
  listarBarbearias(reais).find((b) => String(b.id) === String(id));

// Texto de busca do endereço (o Google Maps localiza melhor pelo endereço escrito do que
// por coordenadas aproximadas). Sem endereço, cai nas coordenadas ou no nome da barbearia.
export function destinoNoMaps(barbearia) {
  const e = barbearia?.details?.address || {};
  const partes = [e.street, e.neighborhood, e.city, e.state, e.cep].filter(Boolean);
  if (partes.length > 0 && (e.city || e.street)) return [...partes, 'Brasil'].join(', ');
  if (Number.isFinite(barbearia?.latitude) && Number.isFinite(barbearia?.longitude)) {
    return `${barbearia.latitude},${barbearia.longitude}`;
  }
  return `${barbearia?.name || ''} barbearia`.trim();
}

export function linkGoogleMaps(barbearia) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinoNoMaps(barbearia))}`;
}
