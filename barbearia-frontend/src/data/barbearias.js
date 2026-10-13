// Catálogo de barbearias do lado do cliente.
// - id 1 (real: true) é a barbearia cadastrada no sistema: agenda de verdade pela API.
// - As demais são FICTÍCIAS, só para testar a navegação do cliente (não gravam agendamento no banco).
// Quando as configurações da barbearia forem salvas no banco, preencha o endereço da real aqui (ou carregue da API).

export const BARBEARIA_REAL_ID = 1;

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

const pagamentos = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'];

const criar = (id, name, rating, distance, phone, street, neighborhood, city, state, fator, totalReviews) => ({
  id,
  real: false,
  name,
  rating,
  distance,
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

export const barbearias = [
  {
    id: BARBEARIA_REAL_ID,
    real: true,
    name: 'BarberFlow',
    rating: 5,
    distance: '',
    phone: '',
    email: '',
    address: 'Barbearia cadastrada no sistema',
    services: [],
    products: [],
    reviews: [],
    averageRating: 5,
    totalReviews: 0,
    details: {
      address: { street: '', neighborhood: '', city: '', state: '' },
      openingHours: horarioPadrao,
      paymentMethods: pagamentos,
    },
  },
  criar(2, 'Estilo Clássico', 4.9, '1,2 km', '(41) 99811-2200', 'Rua XV de Novembro, 1200', 'Centro', 'Curitiba', 'PR', 1.2, 214),
  criar(3, 'Navalha de Ouro', 4.8, '2,4 km', '(11) 99722-3344', 'Avenida Paulista, 1578', 'Bela Vista', 'São Paulo', 'SP', 1.6, 187),
  criar(4, 'Corte & Cia', 4.6, '3,1 km', '(41) 99655-1020', 'Rua das Flores, 345', 'Batel', 'Curitiba', 'PR', 1.0, 96),
  criar(5, 'The Barber House', 4.7, '3,8 km', '(11) 99588-7766', 'Avenida Brigadeiro Faria Lima, 2200', 'Pinheiros', 'São Paulo', 'SP', 1.8, 142),
  criar(6, 'Barba Negra', 4.5, '4,5 km', '(11) 99433-0912', 'Rua Augusta, 900', 'Consolação', 'São Paulo', 'SP', 1.1, 73),
  criar(7, 'Dom Navalha', 4.4, '5,2 km', '(41) 99377-4521', 'Avenida Sete de Setembro, 4100', 'Batel', 'Curitiba', 'PR', 1.3, 58),
  criar(8, 'Vila Barber Club', 4.8, '6,0 km', '(11) 99266-8800', 'Rua Oscar Freire, 650', 'Jardins', 'São Paulo', 'SP', 2.0, 163),
];

export const obterBarbearia = (id) => barbearias.find((b) => String(b.id) === String(id));

// Link do Google Maps. Sem endereço cadastrado, procura a barbearia pelo nome.
export function linkGoogleMaps(barbearia) {
  const e = barbearia?.details?.address;
  const partes = e ? [e.street, e.neighborhood, e.city, e.state].filter(Boolean) : [];
  const consulta = partes.length > 0 ? partes.join(', ') : `${barbearia?.name || ''} barbearia`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}
