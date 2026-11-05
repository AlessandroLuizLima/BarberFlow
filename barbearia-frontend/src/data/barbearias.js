// Catálogo de barbearias do lado do cliente.
// - id 1 (real: true) é a barbearia cadastrada no sistema: nome, logo, endereço e horários vêm das
//   Configurações do painel do barbeiro (banco) e o agendamento é gravado de verdade pela API.
// - As demais são FICTÍCIAS, só para testar a navegação do cliente (não gravam agendamento no banco).

export const BARBEARIA_REAL_ID = 1;

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const pagamentos = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'];

const servicosBase = [
  { nome: 'Cabelo', preco: 30, duracao: 30 },
  { nome: 'Barba', preco: 20, duracao: 20 },
  { nome: 'Cabelo + Barba', preco: 45, duracao: 50 },
  { nome: 'Sobrancelha', preco: 10, duracao: 10 },
  { nome: 'Limpeza de pele', preco: 30, duracao: 30 },
  { nome: 'Pigmentação', preco: 25, duracao: 30 },
];

// Gera a lista de serviços de uma barbearia aplicando um fator de preço (arredondado de 5 em 5)
const servicos = (fator = 1) =>
  servicosBase.map((s, i) => ({
    id: i + 1,
    name: s.nome,
    price: Math.round((s.preco * fator) / 5) * 5,
    duration: s.duracao,
  }));

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
const criar = (id, name, cor, rating, [latitude, longitude], phone, street, neighborhood, city, state, fator, totalReviews) => ({
  id,
  real: false,
  name,
  logo: logoPadrao(name, cor),
  rating,
  latitude,
  longitude,
  distance: '', // calculada na Home a partir da localização do cliente
  phone,
  email: `contato@${name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')}.com`,
  address: `${street}, ${neighborhood} - ${city}/${state}`,
  services: servicos(fator),
  products: [],
  reviews: [],
  averageRating: rating,
  totalReviews,
  details: {
    address: { street, neighborhood, city, state },
    openingHours: horarioPadrao,
    paymentMethods: pagamentos,
  },
});

const demonstracao = [
  criar(2, 'Estilo Clássico', '#2563eb', 4.9, [-25.4296, -49.2713], '(41) 99811-2200', 'Rua XV de Novembro, 1200', 'Centro', 'Curitiba', 'PR', 1.2, 214),
  criar(3, 'Navalha de Ouro', '#d97706', 4.8, [-23.5614, -46.6559], '(11) 99722-3344', 'Avenida Paulista, 1578', 'Bela Vista', 'São Paulo', 'SP', 1.6, 187),
  criar(4, 'Corte & Cia', '#059669', 4.6, [-25.4322, -49.2733], '(41) 99655-1020', 'Rua das Flores, 345', 'Batel', 'Curitiba', 'PR', 1.0, 96),
  criar(5, 'The Barber House', '#7c3aed', 4.7, [-23.5776, -46.6872], '(11) 99588-7766', 'Avenida Brigadeiro Faria Lima, 2200', 'Pinheiros', 'São Paulo', 'SP', 1.8, 142),
  criar(6, 'Barba Negra', '#dc2626', 4.5, [-23.5531, -46.6527], '(11) 99433-0912', 'Rua Augusta, 900', 'Consolação', 'São Paulo', 'SP', 1.1, 73),
  criar(7, 'Dom Navalha', '#0891b2', 4.4, [-25.4421, -49.2869], '(41) 99377-4521', 'Avenida Sete de Setembro, 4100', 'Batel', 'Curitiba', 'PR', 1.3, 58),
  criar(8, 'Vila Barber Club', '#db2777', 4.8, [-23.5627, -46.6698], '(11) 99266-8800', 'Rua Oscar Freire, 650', 'Jardins', 'São Paulo', 'SP', 2.0, 163),
];

// Horário de funcionamento no formato da página de detalhes (dias fechados aparecem como "Fechado")
const horariosDaConfig = (config) =>
  DIAS_SEMANA.filter((dia) => dia !== 'Domingo' || config?.diasAtendimento?.includes('Domingo')).map((dia) => ({
    day: dia,
    hours: config?.diasAtendimento?.includes(dia) ? `${config.horarioInicio} - ${config.horarioFim}` : 'Fechado',
  }));

// Barbearia real, montada a partir das Configurações salvas pelo barbeiro
export function montarBarbeariaReal(config) {
  const d = config?.enderecoDetalhado || {};
  const rua = [d.rua, d.numero].filter(Boolean).join(', ');
  return {
    id: BARBEARIA_REAL_ID,
    real: true,
    name: config?.nome || 'Barbearia',
    logo: config?.logo || null,
    rating: 5,
    // Coordenadas calculadas pelo backend a partir do endereço salvo nas Configurações
    latitude: config?.latitude ?? null,
    longitude: config?.longitude ?? null,
    distance: '',
    phone: config?.telefone || '',
    email: config?.email || '',
    address: config?.endereco || 'Endereço ainda não informado',
    services: [],
    products: [],
    reviews: [],
    averageRating: 5,
    totalReviews: 0,
    details: {
      address: { street: rua, neighborhood: d.bairro || '', city: d.cidade || '', state: d.estado || '' },
      openingHours: config ? horariosDaConfig(config) : horarioPadrao,
      paymentMethods: pagamentos,
    },
  };
}

// Lista completa: a barbearia real (das Configurações) + as de demonstração
export const listarBarbearias = (config) => [montarBarbeariaReal(config), ...demonstracao];

export const obterBarbearia = (id, config) =>
  listarBarbearias(config).find((b) => String(b.id) === String(id));

// Link do Google Maps. Com coordenadas, abre o ponto exato; sem endereço cadastrado, procura pelo nome.
export function linkGoogleMaps(barbearia) {
  if (Number.isFinite(barbearia?.latitude) && Number.isFinite(barbearia?.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${barbearia.latitude},${barbearia.longitude}`;
  }
  const e = barbearia?.details?.address;
  const partes = e ? [e.street, e.neighborhood, e.city, e.state].filter(Boolean) : [];
  const consulta = partes.length > 0 ? partes.join(', ') : `${barbearia?.name || ''} barbearia`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}
