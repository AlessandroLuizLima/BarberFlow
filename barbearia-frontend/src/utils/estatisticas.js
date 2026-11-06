// Números do Financeiro e dos Relatórios, calculados com os dados reais da barbearia:
// agendamentos (GET /agendamentos) e vendas de produtos (GET /vendas-produtos).
//
// Regras:
// - Faturamento de serviços = agendamentos CONCLUÍDOS (o valor cobrado no dia do agendamento).
//   Conta na data do horário marcado; se foi concluído ANTES desse horário (cliente adiantou),
//   conta no dia em que foi concluído.
// - "A receber" = agendados/confirmados/remarcados do período que ainda não foram concluídos.
// - Clientes = clientes diferentes atendidos (concluídos) no período.
// - Cancelados não contam em nada, só na taxa de cancelamento.

export const PERIODOS = {
  diario: { rotulo: 'Diário', descricao: 'Últimos 7 dias' },
  semanal: { rotulo: 'Semanal', descricao: 'Últimas 4 semanas' },
  mensal: { rotulo: 'Mensal', descricao: 'Últimos 12 meses' },
  anual: { rotulo: 'Anual', descricao: 'Últimos 4 anos' }
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PENDENTES = ['agendado', 'confirmado', 'remarcado'];
const CORES = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];

const valorAgendamento = (a) => Number(a.preco_cobrado ?? a.servico?.preco ?? 0);
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const somarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ddmm = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

// Faixas de tempo do período escolhido + a janela anterior do mesmo tamanho (para comparar)
function montarFaixas(periodo, agora = new Date()) {
  const hoje = inicioDoDia(agora);
  const faixas = [];
  if (periodo === 'diario') {
    for (let i = 6; i >= 0; i--) {
      const inicio = somarDias(hoje, -i);
      faixas.push({ name: DIAS[inicio.getDay()], inicio, fim: somarDias(inicio, 1) });
    }
  } else if (periodo === 'semanal') {
    for (let i = 3; i >= 0; i--) {
      const inicio = somarDias(hoje, -7 * i - 6);
      faixas.push({ name: ddmm(inicio), inicio, fim: somarDias(inicio, 7) });
    }
  } else if (periodo === 'anual') {
    for (let i = 3; i >= 0; i--) {
      const ano = hoje.getFullYear() - i;
      faixas.push({ name: String(ano), inicio: new Date(ano, 0, 1), fim: new Date(ano + 1, 0, 1) });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      faixas.push({ name: MESES[inicio.getMonth()], inicio, fim: new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1) });
    }
  }
  const inicio = faixas[0].inicio;
  const fim = faixas[faixas.length - 1].fim;
  const duracao = fim - inicio;
  return { faixas, inicio, fim, anterior: { inicio: new Date(inicio - duracao), fim: inicio } };
}

const dentro = (data, ini, fim) => data >= ini && data < fim;

// Data em que o agendamento entra nos números
export function dataEfetiva(a, agora = new Date()) {
  const marcada = new Date(a.data_hora);
  if (a.status === 'concluido' && marcada > agora && a.atualizado_em) {
    const concluido = new Date(a.atualizado_em);
    if (concluido < marcada) return concluido;
  }
  return marcada;
}

// Topo do eixo dos gráficos. Contagens: múltiplo de 4 (as 5 linhas do eixo ficam inteiras).
// Dinheiro: valor redondo (R$ 100, 150, 200, 250, 300, 400, 500, 600, 800, 1.000...).
export function topoDoEixo(maximo, { moeda = false } = {}) {
  const v = Math.max(0, Number(maximo) || 0);
  if (!moeda) return Math.max(4, Math.ceil(v / 4) * 4);
  const alvo = Math.max(100, v);
  const base = 10 ** Math.floor(Math.log10(alvo));
  const m = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => x * base >= alvo);
  return m * base;
}

function resumir(agendamentos, vendas, ini, fim) {
  const doPeriodo = agendamentos.filter((a) => dentro(dataEfetiva(a), ini, fim));
  const concluidos = doPeriodo.filter((a) => a.status === 'concluido');
  const vendasPeriodo = vendas.filter((v) => dentro(new Date(v.criado_em), ini, fim));
  const receitaServicos = concluidos.reduce((s, a) => s + valorAgendamento(a), 0);
  const receitaProdutos = vendasPeriodo.reduce((s, v) => s + v.quantidade * Number(v.valor_unitario), 0);
  const custoProdutos = vendasPeriodo.reduce((s, v) => s + v.quantidade * Number(v.custo_unitario || 0), 0);
  const duracoes = concluidos.map((a) => Number(a.servico?.duracao_minutos || 0)).filter(Boolean);
  return {
    doPeriodo,
    concluidos,
    vendasPeriodo,
    revenue: Math.round((receitaServicos + receitaProdutos) * 100) / 100,
    receitaServicos,
    receitaProdutos,
    lucroProdutos: receitaProdutos - custoProdutos,
    services: concluidos.length,
    produtosVendidos: vendasPeriodo.reduce((s, v) => s + v.quantidade, 0),
    clients: new Set(concluidos.map((a) => a.cliente_id)).size,
    avgTime: duracoes.length ? Math.round(duracoes.reduce((s, d) => s + d, 0) / duracoes.length) : 0,
    aReceber: doPeriodo.filter((a) => PENDENTES.includes(a.status)).reduce((s, a) => s + valorAgendamento(a), 0),
    cancelados: doPeriodo.filter((a) => a.status === 'cancelado').length,
    total: doPeriodo.length
  };
}

// Variação percentual (null quando não há base de comparação)
const variacao = (atual, anterior) => (anterior > 0 ? Math.round(((atual - anterior) / anterior) * 1000) / 10 : null);

/**
 * @param {Array} agendamentos - lista do GET /agendamentos (com servico e cliente)
 * @param {Array} vendas - lista do GET /vendas-produtos
 * @param {'diario'|'semanal'|'mensal'|'anual'} periodo
 */
export function calcularEstatisticas(agendamentos = [], vendas = [], periodo = 'mensal', agora = new Date()) {
  const { faixas, inicio, fim, anterior } = montarFaixas(periodo, agora);
  const atual = resumir(agendamentos, vendas, inicio, fim);
  const antes = resumir(agendamentos, vendas, anterior.inicio, anterior.fim);

  const serie = faixas.map((f) => {
    const r = resumir(atual.doPeriodo, atual.vendasPeriodo, f.inicio, f.fim);
    return { name: f.name, revenue: r.revenue, services: r.services, clients: r.clients, avgTime: r.avgTime };
  });

  // Retenção: dos clientes atendidos no período, quantos voltaram (2+ atendimentos)
  const visitas = {};
  atual.concluidos.forEach((a) => { visitas[a.cliente_id] = (visitas[a.cliente_id] || 0) + 1; });
  const retornaram = Object.values(visitas).filter((n) => n >= 2).length;
  const retencao = atual.clients ? Math.round((retornaram / atual.clients) * 1000) / 10 : 0;

  // Faturamento por serviço (top 4 + outros), em %
  const porServico = {};
  atual.concluidos.forEach((a) => {
    const nome = a.servico?.nome || 'Serviço';
    porServico[nome] = (porServico[nome] || 0) + valorAgendamento(a);
  });
  if (atual.receitaProdutos > 0) porServico['Produtos'] = (porServico['Produtos'] || 0) + atual.receitaProdutos;
  const ordenados = Object.entries(porServico).sort((a, b) => b[1] - a[1]);
  const principais = ordenados.slice(0, 4);
  const outros = ordenados.slice(4).reduce((s, [, v]) => s + v, 0);
  if (outros > 0) principais.push(['Outros', outros]);
  const totalDistribuicao = principais.reduce((s, [, v]) => s + v, 0);
  const distribuicao = principais.map(([name, valor], i) => ({
    name,
    valor,
    value: totalDistribuicao ? Math.round((valor / totalDistribuicao) * 100) : 0,
    color: CORES[i % CORES.length]
  }));

  // Movimento por hora (agendamentos não cancelados do período)
  const porHora = {};
  atual.doPeriodo.filter((a) => a.status !== 'cancelado').forEach((a) => {
    const h = new Date(a.data_hora).getHours();
    porHora[h] = (porHora[h] || 0) + 1;
  });
  const horasComDados = Object.keys(porHora).map(Number);
  const horaIni = Math.min(8, ...horasComDados);
  const horaFim = Math.max(19, ...horasComDados);
  const maxHora = Math.max(1, ...Object.values(porHora));
  const horarios = [];
  for (let h = horaIni; h <= horaFim; h++) {
    const n = porHora[h] || 0;
    // Mais escuro = mais movimento
    const alpha = 0.25 + 0.75 * (n / maxHora);
    horarios.push({ name: `${String(h).padStart(2, '0')}h`, clients: n, color: `rgba(99, 102, 241, ${alpha.toFixed(2)})` });
  }

  // Situação dos agendamentos do período (no lugar de uma "satisfação" que o sistema não mede)
  const pct = (n) => (atual.total ? Math.round((n / atual.total) * 100) : 0);
  const pendentes = atual.doPeriodo.filter((a) => PENDENTES.includes(a.status)).length;
  const situacao = [
    { name: 'Concluídos', value: pct(atual.services), quantidade: atual.services, color: '#10b981' },
    { name: 'A atender', value: pct(pendentes), quantidade: pendentes, color: '#60a5fa' },
    { name: 'Cancelados', value: pct(atual.cancelados), quantidade: atual.cancelados, color: '#ef4444' }
  ];

  const ticket = atual.services ? atual.receitaServicos / atual.services : 0;
  const ticketAntes = antes.services ? antes.receitaServicos / antes.services : 0;
  const metricas = {
    totalRevenue: atual.revenue,
    receitaServicos: atual.receitaServicos,
    receitaProdutos: atual.receitaProdutos,
    lucroProdutos: atual.lucroProdutos,
    produtosVendidos: atual.produtosVendidos,
    totalServices: atual.services,
    totalClients: atual.clients,
    avgTicket: ticket,
    avgTime: atual.avgTime,
    aReceber: atual.aReceber,
    clientRetention: retencao,
    taxaCancelamento: pct(atual.cancelados),
    variacao: {
      revenue: variacao(atual.revenue, antes.revenue),
      services: variacao(atual.services, antes.services),
      clients: variacao(atual.clients, antes.clients),
      ticket: variacao(ticket, ticketAntes),
      avgTime: antes.avgTime && atual.avgTime ? atual.avgTime - antes.avgTime : null
    }
  };

  // ---- Detalhes de cada aba dos Relatórios ----
  // Serviços: ranking por faturamento
  const rankingMapa = {};
  atual.concluidos.forEach((a) => {
    const nome = a.servico?.nome || 'Serviço';
    const item = (rankingMapa[nome] = rankingMapa[nome] || { nome, quantidade: 0, faturamento: 0, duracao: 0 });
    item.quantidade += 1;
    item.faturamento += valorAgendamento(a);
    item.duracao += Number(a.servico?.duracao_minutos || 0);
  });
  const rankingServicos = Object.values(rankingMapa)
    .map((s) => ({
      ...s,
      participacao: atual.receitaServicos ? Math.round((s.faturamento / atual.receitaServicos) * 100) : 0,
      precoMedio: s.faturamento / s.quantidade,
      duracaoMedia: Math.round(s.duracao / s.quantidade),
      horas: s.duracao / 60
    }))
    .sort((a, b) => b.faturamento - a.faturamento);

  // Clientes: quem mais gastou e quantos são novos (primeiro atendimento da história caiu no período)
  const primeiroAtendimento = {};
  agendamentos.filter((a) => a.status === 'concluido').forEach((a) => {
    const d = dataEfetiva(a);
    if (!primeiroAtendimento[a.cliente_id] || d < primeiroAtendimento[a.cliente_id]) primeiroAtendimento[a.cliente_id] = d;
  });
  const clientesMapa = {};
  atual.concluidos.forEach((a) => {
    const c = (clientesMapa[a.cliente_id] = clientesMapa[a.cliente_id] || {
      id: a.cliente_id, nome: a.cliente?.nome_completo || 'Cliente', visitas: 0, gasto: 0, ultima: null
    });
    c.visitas += 1;
    c.gasto += valorAgendamento(a);
    const d = dataEfetiva(a);
    if (!c.ultima || d > c.ultima) c.ultima = d;
  });
  const topClientes = Object.values(clientesMapa).sort((a, b) => b.gasto - a.gasto).slice(0, 10);
  const novosClientes = Object.keys(clientesMapa).filter((id) => dentro(primeiroAtendimento[id], inicio, fim)).length;

  // Tempo: movimento por dia da semana e horas atendidas
  const porDia = [0, 0, 0, 0, 0, 0, 0];
  atual.doPeriodo.filter((a) => a.status !== 'cancelado').forEach((a) => { porDia[new Date(a.data_hora).getDay()] += 1; });
  const maxDia = Math.max(1, ...porDia);
  const diasSemana = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    name: DIAS[d], clients: porDia[d], color: `rgba(16, 185, 129, ${(0.25 + 0.75 * (porDia[d] / maxDia)).toFixed(2)})`
  }));
  const diaPico = diasSemana.reduce((a, b) => (b.clients > a.clients ? b : a), diasSemana[0]);
  const pico = horarios.reduce((a, b) => (b.clients > a.clients ? b : a), horarios[0]);
  const minutosAtendidos = atual.concluidos.reduce((s, a) => s + Number(a.servico?.duracao_minutos || 0), 0);

  const detalhes = {
    rankingServicos,
    topClientes,
    novosClientes,
    recorrentes: retornaram,
    gastoPorCliente: atual.clients ? atual.receitaServicos / atual.clients : 0,
    diasSemana,
    diaPico: diaPico.clients ? diaPico.name : null,
    horaPico: pico?.clients ? pico.name.replace('h', ':00') : null,
    horasAtendidas: minutosAtendidos / 60,
    agendamentosNoPeriodo: atual.total
  };

  return { serie, metricas, distribuicao, horarios, situacao, detalhes, analises: gerarAnalises(metricas, distribuicao, horarios), periodo: PERIODOS[periodo] };
}

// Frases de análise geradas a partir dos números (nada inventado)
function gerarAnalises(m, distribuicao, horarios) {
  const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const lista = [];
  if (!m.totalServices && !m.produtosVendidos) {
    lista.push({ tipo: 'neutro', titulo: 'Sem atendimentos concluídos', texto: 'Ainda não há atendimentos concluídos neste período. Ao terminar um atendimento, marque-o como concluído na Agenda para ele entrar no faturamento.' });
    if (m.aReceber > 0) lista.push({ tipo: 'positivo', titulo: 'Agenda com movimento', texto: `Há ${moeda(m.aReceber)} em atendimentos marcados para este período.` });
    return lista;
  }
  const v = m.variacao.revenue;
  if (v === null) lista.push({ tipo: 'neutro', titulo: 'Primeiro período com dados', texto: `O faturamento foi de ${moeda(m.totalRevenue)}. No próximo período já dá para comparar a evolução.` });
  else if (v >= 0) lista.push({ tipo: 'positivo', titulo: 'Faturamento em alta', texto: `O faturamento cresceu ${String(v).replace('.', ',')}% em relação ao período anterior.` });
  else lista.push({ tipo: 'atencao', titulo: 'Faturamento em queda', texto: `O faturamento caiu ${String(Math.abs(v)).replace('.', ',')}% em relação ao período anterior. Vale divulgar horários livres.` });

  const top = distribuicao.find((d) => d.name !== 'Produtos' && d.name !== 'Outros');
  if (top) lista.push({ tipo: 'neutro', titulo: 'Serviço mais forte', texto: `${top.name} responde por ${top.value}% do faturamento do período.` });

  const pico = horarios.reduce((a, b) => (b.clients > a.clients ? b : a), horarios[0]);
  if (pico?.clients > 0) lista.push({ tipo: 'atencao', titulo: 'Horário de pico', texto: `O horário com mais agendamentos é ${pico.name.replace('h', ':00')}. Garanta barbeiros disponíveis nesse horário.` });

  if (m.taxaCancelamento >= 15) lista.push({ tipo: 'atencao', titulo: 'Cancelamentos altos', texto: `${m.taxaCancelamento}% dos agendamentos foram cancelados. Lembretes por e-mail ajudam a reduzir faltas.` });
  else lista.push({ tipo: 'positivo', titulo: 'Poucos cancelamentos', texto: `Só ${m.taxaCancelamento}% dos agendamentos do período foram cancelados.` });

  if (m.totalClients) lista.push({ tipo: m.clientRetention >= 30 ? 'positivo' : 'neutro', titulo: 'Clientes que voltaram', texto: `${String(m.clientRetention).replace('.', ',')}% dos ${m.totalClients} clientes atendidos voltaram mais de uma vez no período.` });
  if (m.produtosVendidos) lista.push({ tipo: 'positivo', titulo: 'Venda de produtos', texto: `${m.produtosVendidos} produto(s) vendido(s), somando ${moeda(m.receitaProdutos)} (lucro de ${moeda(m.lucroProdutos)}).` });
  return lista.slice(0, 6);
}

// "+12,5% vs período anterior" / "Sem base de comparação"
export function textoVariacao(valor, sufixo = '%') {
  if (valor === null || valor === undefined) return 'Sem comparação ainda';
  const sinal = valor > 0 ? '+' : '';
  return `${sinal}${String(valor).replace('.', ',')}${sufixo} vs anterior`;
}
