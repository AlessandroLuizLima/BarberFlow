// Regras de apresentação dos agendamentos do cliente (próximos + histórico).

export const STATUS_ATIVOS = ['agendado', 'confirmado', 'remarcado'];

export const STATUS_LABEL = {
  agendado: 'Agendado',
  confirmado: 'Agendado',
  remarcado: 'Remarcado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const NOME_BARBEARIA = 'BarberFlow';

export const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Valor cobrado no momento do agendamento (se não existir, usa o preço atual do serviço)
export const valorDoAgendamento = (a) => Number(a?.preco_cobrado ?? a?.servico?.preco ?? 0);

export const proximosAgendamentos = (lista, agora = new Date()) =>
  lista
    .filter((a) => STATUS_ATIVOS.includes(a.status) && new Date(a.data_hora) >= agora)
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

// Relatório do que o cliente já consumiu (só atendimentos concluídos), agrupado por barbearia e serviço
export function gerarRelatorio(lista, barbearia = { nome: NOME_BARBEARIA, logo: null }) {
  const concluidos = lista.filter((a) => a.status === 'concluido');
  const porBarbearia = new Map();

  concluidos.forEach((a) => {
    const nomeBarbearia = a.barbearia?.nome || barbearia.nome;
    if (!porBarbearia.has(nomeBarbearia)) {
      porBarbearia.set(nomeBarbearia, { nome: nomeBarbearia, logo: barbearia.logo || null, visitas: 0, total: 0, servicos: new Map(), ultima: null });
    }
    const b = porBarbearia.get(nomeBarbearia);
    const valor = valorDoAgendamento(a);
    const nomeServico = a.servico?.nome || 'Serviço';
    const data = new Date(a.data_hora);

    b.visitas += 1;
    b.total += valor;
    if (!b.ultima || data > b.ultima) b.ultima = data;

    const s = b.servicos.get(nomeServico) || { nome: nomeServico, quantidade: 0, total: 0 };
    s.quantidade += 1;
    s.total += valor;
    b.servicos.set(nomeServico, s);
  });

  const barbearias = [...porBarbearia.values()]
    .map((b) => ({ ...b, servicos: [...b.servicos.values()].sort((x, y) => y.quantidade - x.quantidade || y.total - x.total) }))
    .sort((x, y) => y.total - x.total);

  const totalGasto = barbearias.reduce((soma, b) => soma + b.total, 0);
  const visitas = concluidos.length;
  const todosServicos = barbearias.flatMap((b) => b.servicos);
  const favorito = todosServicos.reduce((melhor, s) => (!melhor || s.quantidade > melhor.quantidade ? s : melhor), null);
  const ultimaVisita = concluidos.reduce((m, a) => (!m || new Date(a.data_hora) > m ? new Date(a.data_hora) : m), null);

  return {
    visitas,
    totalGasto,
    ticketMedio: visitas > 0 ? totalGasto / visitas : 0,
    ultimaVisita,
    servicoFavorito: favorito?.nome || null,
    barbearias,
  };
}
