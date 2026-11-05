// Gera o relatório da barbearia em PDF (A4), desenhado do zero com jsPDF:
// cabeçalho com logo, indicadores, gráficos, tabela por período e análises.
// As bibliotecas são carregadas só quando o barbeiro clica em "Baixar PDF".

const COR = {
  escuro: [15, 23, 42],
  texto: [17, 24, 39],
  suave: [100, 116, 139],
  borda: [226, 232, 240],
  fundo: [248, 250, 252],
  azul: [59, 130, 246],
  azulClaro: [147, 197, 253],
  roxo: [124, 58, 237],
  verde: [5, 150, 105],
  vermelho: [220, 38, 38],
  laranja: [217, 119, 6],
  branco: [255, 255, 255]
};

const A4 = { largura: 210, altura: 297 };
const MARGEM = 14;
const LARGURA_UTIL = A4.largura - MARGEM * 2;

// Intl usa espaços especiais que a fonte padrão do PDF não tem
const limparEspacos = (texto) => String(texto).replace(/[\u202f\u00a0]/g, ' ');
const moeda = (v) => limparEspacos(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0));
const numero = (v) => limparEspacos(new Intl.NumberFormat('pt-BR').format(v || 0));
const moedaCurta = (v) => (v >= 1000 ? `R$ ${numero(Math.round(v / 100) / 10)} mil` : v === 0 ? 'R$ 0' : moeda(v));

// Arredonda o topo do eixo para um número "redondo" (595 -> 600, 26800 -> 30000)
const topoDoEixo = (max) => {
  if (max <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(max));
  const passo = [1, 2, 2.5, 5, 10].find((p) => p * potencia >= max / 4) * potencia;
  return Math.ceil(max / passo) * passo;
};

const misturar = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));

// Carrega a logo (qualquer formato) e devolve um PNG em data URL, ou null
async function carregarLogo(url) {
  if (!url) return null;
  try {
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    const lado = 256;
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    const escala = Math.min(lado / bitmap.width, lado / bitmap.height);
    const w = bitmap.width * escala;
    const h = bitmap.height * escala;
    ctx.drawImage(bitmap, (lado - w) / 2, (lado - h) / 2, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function criarDesenho(doc) {
  const cor = (rgb, tipo = 'fill') => {
    if (tipo === 'fill') doc.setFillColor(...rgb);
    if (tipo === 'draw') doc.setDrawColor(...rgb);
    if (tipo === 'text') doc.setTextColor(...rgb);
  };

  const texto = (conteudo, x, y, { tamanho = 9, negrito = false, rgb = COR.texto, alinhar = 'left', largura } = {}) => {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(tamanho);
    cor(rgb, 'text');
    const linhas = largura ? doc.splitTextToSize(limparEspacos(conteudo), largura) : limparEspacos(conteudo);
    doc.text(linhas, x, y, { align: alinhar, baseline: 'alphabetic' });
    return Array.isArray(linhas) ? linhas.length : 1;
  };

  const cartao = (x, y, w, h) => {
    cor(COR.branco);
    cor(COR.borda, 'draw');
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
  };

  const tituloDoCartao = (x, y, titulo, subtitulo) => {
    texto(titulo, x + 5, y + 8, { tamanho: 10.5, negrito: true });
    if (subtitulo) texto(subtitulo, x + 5, y + 12.5, { tamanho: 7.5, rgb: COR.suave });
  };

  const transparencia = (opacidade, desenhar) => {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: opacidade }));
    desenhar();
    doc.restoreGraphicsState();
  };

  // Gráfico de linha com área preenchida, grade e rótulos
  const graficoLinha = (x, y, w, h, dados, chave, rgb, formatarEixo = numero) => {
    const esq = x + 14;
    const dir = x + w - 5;
    const topo = y + 3;
    const base = y + h - 7;
    const maximo = topoDoEixo(Math.max(...dados.map((d) => d[chave])));
    const px = (i) => esq + (dados.length === 1 ? 0 : (i * (dir - esq)) / (dados.length - 1));
    const py = (v) => base - (v / maximo) * (base - topo);

    doc.setLineWidth(0.15);
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      const yy = base - t * (base - topo);
      cor(COR.borda, 'draw');
      doc.setLineDashPattern(t === 0 ? [] : [0.8, 0.8], 0);
      doc.line(esq, yy, dir, yy);
      texto(formatarEixo(maximo * t), esq - 2, yy + 1, { tamanho: 6, rgb: COR.suave, alinhar: 'right' });
    });
    doc.setLineDashPattern([], 0);

    const pontos = dados.map((d, i) => [px(i), py(d[chave])]);

    // área
    transparencia(0.12, () => {
      cor(rgb);
      const caminho = [[pontos[0][0], base], ...pontos, [pontos[pontos.length - 1][0], base]];
      const relativos = caminho.slice(1).map((p, i) => [p[0] - caminho[i][0], p[1] - caminho[i][1]]);
      doc.lines(relativos, caminho[0][0], caminho[0][1], [1, 1], 'F', true);
    });

    // linha
    cor(rgb, 'draw');
    doc.setLineWidth(0.7);
    for (let i = 1; i < pontos.length; i++) doc.line(...pontos[i - 1], ...pontos[i]);

    // pontos e rótulos do eixo X
    pontos.forEach(([cx, cy], i) => {
      cor(COR.branco);
      cor(rgb, 'draw');
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, 0.9, 'FD');
      texto(dados[i].name, cx, base + 4.5, { tamanho: 6, rgb: COR.suave, alinhar: 'center' });
    });

    // destaca o maior valor
    const iMax = dados.reduce((m, d, i) => (d[chave] > dados[m][chave] ? i : m), 0);
    const alinhar = iMax === pontos.length - 1 ? 'right' : iMax === 0 ? 'left' : 'center';
    const ajuste = alinhar === 'right' ? 1.2 : alinhar === 'left' ? -1.2 : 0;
    texto(formatarEixo(dados[iMax][chave]), pontos[iMax][0] + ajuste, pontos[iMax][1] - 2.2, { tamanho: 6.5, negrito: true, rgb, alinhar });
  };

  // Barras verticais com cor proporcional ao valor
  const graficoBarras = (x, y, w, h, dados) => {
    const esq = x + 4;
    const base = y + h - 6;
    const topo = y + 4;
    const maximo = Math.max(...dados.map((d) => d.clients));
    const vao = (w - 8) / dados.length;
    const larguraBarra = vao * 0.62;
    dados.forEach((d, i) => {
      const altura = Math.max(0.6, (d.clients / maximo) * (base - topo));
      const bx = esq + i * vao + (vao - larguraBarra) / 2;
      cor(misturar([221, 214, 254], COR.roxo, d.clients / maximo));
      doc.roundedRect(bx, base - altura, larguraBarra, altura, 0.8, 0.8, 'F');
      if (d.clients === maximo) {
        texto(String(d.clients), bx + larguraBarra / 2, base - altura - 1.5, { tamanho: 6.5, negrito: true, rgb: COR.roxo, alinhar: 'center' });
      }
      texto(d.name, bx + larguraBarra / 2, base + 4, { tamanho: 5.8, rgb: COR.suave, alinhar: 'center' });
    });
  };

  // Barras horizontais de percentual
  const barrasPercentuais = (x, y, w, itens) => {
    itens.forEach((item, i) => {
      const yy = y + i * 8.5;
      texto(item.name, x, yy, { tamanho: 7.5, rgb: COR.texto });
      texto(`${item.value}%`, x + w, yy, { tamanho: 7.5, negrito: true, alinhar: 'right' });
      cor(COR.fundo);
      doc.roundedRect(x, yy + 1.8, w, 2.6, 1.3, 1.3, 'F');
      const hex = item.color.replace('#', '');
      cor([0, 2, 4].map((p) => parseInt(hex.slice(p, p + 2), 16)));
      doc.roundedRect(x, yy + 1.8, Math.max(2.6, (item.value / 100) * w), 2.6, 1.3, 1.3, 'F');
    });
  };

  return { cor, texto, cartao, tituloDoCartao, graficoLinha, graficoBarras, barrasPercentuais };
}

/**
 * @param {object} p
 * @param {string} p.nomeBarbearia
 * @param {string|null} p.logoUrl
 * @param {string} p.periodo  - "Mensal"
 * @param {string} p.tipo     - "Geral"
 * @param {object} p.metricas - { totalClients, totalServices, totalRevenue, avgTime, clientRetention, satisfaction }
 * @param {Array}  p.dados    - [{ name, clients, services, revenue, avgTime }]
 * @param {Array}  p.horarios - [{ name, clients }]
 * @param {Array}  p.satisfacao - [{ name, value, color }]
 * @param {Array}  p.analises - [{ titulo, texto, tipo: 'positivo'|'neutro'|'atencao' }]
 * @param {string} p.nomeArquivo
 */
export async function gerarRelatorioPdf(p) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const logo = await carregarLogo(p.logoUrl);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const d = criarDesenho(doc);
  const geradoEm = limparEspacos(new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }));
  const m = p.metricas;
  const ticket = m.totalServices ? m.totalRevenue / m.totalServices : 0;
  const pico = p.horarios.reduce((a, b) => (b.clients > a.clients ? b : a), p.horarios[0]);
  const melhor = p.dados.reduce((a, b) => (b.revenue > a.revenue ? b : a), p.dados[0]);

  doc.setProperties({ title: `Relatório ${p.periodo} - ${p.nomeBarbearia}`, author: p.nomeBarbearia, creator: 'BarberFlow' });

  // ---------------- Página 1 ----------------
  // Cabeçalho
  d.cor(COR.escuro);
  doc.rect(0, 0, A4.largura, 40, 'F');
  d.cor(COR.azul);
  doc.rect(0, 40, A4.largura, 1.2, 'F');

  let xTitulo = MARGEM;
  if (logo) {
    d.cor(COR.branco);
    doc.roundedRect(MARGEM, 9, 22, 22, 4, 4, 'F');
    doc.addImage(logo, 'PNG', MARGEM + 2, 11, 18, 18);
    xTitulo = MARGEM + 28;
  }
  d.texto('RELATÓRIO DE DESEMPENHO', xTitulo, 15, { tamanho: 7.5, negrito: true, rgb: COR.azulClaro });
  d.texto(p.nomeBarbearia, xTitulo, 24, { tamanho: 19, negrito: true, rgb: COR.branco });
  d.texto(`Relatório ${p.tipo.toLowerCase()} · período ${p.periodo.toLowerCase()}`, xTitulo, 31, { tamanho: 9, rgb: [203, 213, 225] });
  d.texto('BarberFlow', A4.largura - MARGEM, 15, { tamanho: 9, negrito: true, rgb: COR.branco, alinhar: 'right' });
  d.texto(`Gerado em ${geradoEm}`, A4.largura - MARGEM, 31, { tamanho: 7.5, rgb: [148, 163, 184], alinhar: 'right' });

  // Indicadores (2 linhas de 4)
  let y = 50;
  d.texto('Visão geral', MARGEM, y, { tamanho: 12, negrito: true });
  y += 4;
  const kpis = [
    { rotulo: 'Total de clientes', valor: numero(m.totalClients), variacao: '+15,2% vs período anterior', rgb: COR.azul, bom: true },
    { rotulo: 'Serviços realizados', valor: numero(m.totalServices), variacao: `${numero(Math.round(m.totalServices / p.dados.length))} por ${p.periodo === 'Anual' ? 'ano' : 'período'}`, rgb: COR.verde },
    { rotulo: 'Faturamento', valor: moeda(m.totalRevenue), variacao: `Melhor: ${melhor.name} (${moedaCurta(melhor.revenue)})`, rgb: COR.verde },
    { rotulo: 'Ticket médio', valor: moeda(ticket), variacao: 'por serviço realizado', rgb: COR.roxo },
    { rotulo: 'Retenção de clientes', valor: `${String(m.clientRetention).replace('.', ',')}%`, variacao: '+2,1% vs período anterior', rgb: COR.roxo, bom: true },
    { rotulo: 'Tempo médio', valor: `${m.avgTime} min`, variacao: '-1,5 min vs período anterior', rgb: COR.vermelho, bom: true },
    { rotulo: 'Satisfação', valor: `${String(m.satisfaction).replace('.', ',')}%`, variacao: '+4,3% vs período anterior', rgb: COR.verde, bom: true },
    { rotulo: 'Horário de pico', valor: pico.name.replace('h', ':00'), variacao: `${pico.clients} clientes em média`, rgb: COR.laranja }
  ];
  const gap = 4;
  const wKpi = (LARGURA_UTIL - gap * 3) / 4;
  const hKpi = 24;
  kpis.forEach((k, i) => {
    const kx = MARGEM + (i % 4) * (wKpi + gap);
    const ky = y + Math.floor(i / 4) * (hKpi + gap);
    d.cartao(kx, ky, wKpi, hKpi);
    d.cor(k.rgb);
    doc.roundedRect(kx, ky + 4, 1.2, hKpi - 8, 0.6, 0.6, 'F');
    d.texto(k.rotulo, kx + 5, ky + 7, { tamanho: 7, rgb: COR.suave });
    d.texto(k.valor, kx + 5, ky + 15, { tamanho: k.valor.length > 12 ? 11.5 : 14, negrito: true, rgb: k.rgb });
    d.texto(k.variacao, kx + 5, ky + 20.5, { tamanho: 6.3, rgb: k.bom ? COR.verde : COR.suave, largura: wKpi - 7 });
  });
  y += hKpi * 2 + gap + 8;

  // Evolução de clientes
  d.cartao(MARGEM, y, LARGURA_UTIL, 68);
  d.tituloDoCartao(MARGEM, y, 'Evolução de clientes', 'Clientes atendidos em cada período');
  d.graficoLinha(MARGEM + 2, y + 17, LARGURA_UTIL - 4, 48, p.dados, 'clients', COR.azul);
  y += 68 + gap + 2;

  // Horários de pico + satisfação
  const wMetade = (LARGURA_UTIL - gap) / 2;
  const hLinha = 62;
  d.cartao(MARGEM, y, wMetade, hLinha);
  d.tituloDoCartao(MARGEM, y, 'Horários de pico', 'Clientes por horário do dia');
  d.graficoBarras(MARGEM + 2, y + 16, wMetade - 4, hLinha - 18, p.horarios);

  const xSat = MARGEM + wMetade + gap;
  d.cartao(xSat, y, wMetade, hLinha);
  d.tituloDoCartao(xSat, y, 'Satisfação dos clientes', 'Avaliação dos atendimentos');
  d.barrasPercentuais(xSat + 5, y + 22, wMetade - 10, p.satisfacao);
  const satisfeitos = p.satisfacao.slice(0, 2).reduce((s, i) => s + i.value, 0);
  d.texto(`${satisfeitos}% satisfeitos ou muito satisfeitos`, xSat + 5, y + hLinha - 5, { tamanho: 7, negrito: true, rgb: COR.verde });

  // ---------------- Página 2 ----------------
  doc.addPage();
  d.texto(p.nomeBarbearia, MARGEM, 16, { tamanho: 11, negrito: true });
  d.texto(`Relatório ${p.tipo.toLowerCase()} · período ${p.periodo.toLowerCase()}`, A4.largura - MARGEM, 16, { tamanho: 8, rgb: COR.suave, alinhar: 'right' });
  d.cor(COR.azul);
  doc.rect(MARGEM, 19, LARGURA_UTIL, 0.6, 'F');
  y = 26;

  d.cartao(MARGEM, y, wMetade, 58);
  d.tituloDoCartao(MARGEM, y, 'Serviços realizados', 'Quantidade por período');
  d.graficoLinha(MARGEM + 1, y + 17, wMetade - 2, 38, p.dados, 'services', COR.verde);
  d.cartao(xSat, y, wMetade, 58);
  d.tituloDoCartao(xSat, y, 'Faturamento', 'Receita por período');
  d.graficoLinha(xSat + 1, y + 17, wMetade - 2, 38, p.dados, 'revenue', COR.roxo, moedaCurta);
  y += 58 + 8;

  // Tabela por período
  d.texto('Resumo por período', MARGEM, y, { tamanho: 12, negrito: true });
  autoTable(doc, {
    startY: y + 3,
    margin: { left: MARGEM, right: MARGEM },
    head: [['Período', 'Clientes', 'Serviços', 'Faturamento', 'Ticket médio', 'Tempo médio']],
    body: p.dados.map((r) => [r.name, numero(r.clients), numero(r.services), moeda(r.revenue), moeda(r.services ? r.revenue / r.services : 0), `${r.avgTime} min`]),
    foot: [['Total', numero(m.totalClients), numero(m.totalServices), moeda(m.totalRevenue), moeda(ticket), `${m.avgTime} min`]],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 1.9, bottom: 1.9, left: 3, right: 3 }, textColor: COR.texto },
    headStyles: { fillColor: COR.escuro, textColor: COR.branco, fontStyle: 'bold', fontSize: 7.5 },
    footStyles: { fillColor: [239, 246, 255], textColor: COR.texto, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COR.fundo },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', textColor: COR.verde, fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.column.index > 0 && (data.section === 'head' || data.section === 'foot')) data.cell.styles.halign = 'right';
    }
  });
  y = doc.lastAutoTable.finalY + 9;

  // Análises
  const alturaAnalise = 17;
  const linhasAnalises = Math.ceil(p.analises.length / 2);
  const gapAnalise = 3;
  if (y + 6 + linhasAnalises * (alturaAnalise + gapAnalise) > A4.altura - 15) {
    doc.addPage();
    y = 20;
  }
  d.texto('Análises e recomendações', MARGEM, y, { tamanho: 12, negrito: true });
  y += 4;
  const corDoTipo = { positivo: COR.verde, neutro: COR.azul, atencao: COR.laranja };
  p.analises.forEach((a, i) => {
    const ax = MARGEM + (i % 2) * (wMetade + gap);
    const ay = y + Math.floor(i / 2) * (alturaAnalise + gapAnalise);
    d.cartao(ax, ay, wMetade, alturaAnalise);
    d.cor(corDoTipo[a.tipo] || COR.azul);
    doc.roundedRect(ax, ay + 3, 1.2, alturaAnalise - 6, 0.6, 0.6, 'F');
    d.texto(a.titulo, ax + 5, ay + 6, { tamanho: 8.5, negrito: true });
    d.texto(a.texto, ax + 5, ay + 10.3, { tamanho: 7, rgb: COR.suave, largura: wMetade - 9 });
  });

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    d.cor(COR.borda, 'draw');
    doc.setLineWidth(0.2);
    doc.line(MARGEM, A4.altura - 12, A4.largura - MARGEM, A4.altura - 12);
    d.texto(`${p.nomeBarbearia} · Relatório gerado pelo BarberFlow`, MARGEM, A4.altura - 7, { tamanho: 7, rgb: COR.suave });
    d.texto(`Página ${pagina} de ${total}`, A4.largura - MARGEM, A4.altura - 7, { tamanho: 7, rgb: COR.suave, alinhar: 'right' });
  }

  doc.save(p.nomeArquivo);
}
