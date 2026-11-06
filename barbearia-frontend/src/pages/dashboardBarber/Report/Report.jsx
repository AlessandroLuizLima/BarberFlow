import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiCalendar,
  FiScissors,
  FiClock,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiPrinter,
  FiFilter
} from 'react-icons/fi';
import useConfiguracaoBarbearia from '../../../hooks/useConfiguracaoBarbearia';
import useMovimentoBarbearia from '../../../hooks/useMovimentoBarbearia';
import { calcularEstatisticas, textoVariacao, topoDoEixo } from '../../../utils/estatisticas';
import './Report.css';

const PERIODOS = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual' };
const TIPOS = { geral: 'Geral', clientes: 'Clientes', servicos: 'Serviços', tempo: 'Tempo' };

// "Barber Style's" -> "barber-styles" (para o nome do arquivo)
const paraNomeDeArquivo = (texto) =>
  String(texto || 'barbearia').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Análises: geradas a partir dos números reais (utils/estatisticas.js)
const ICONE_ANALISE = { positivo: FiTrendingUp, neutro: FiFilter, atencao: FiClock };
const CLASSE_ICONE = { positivo: 'positive', neutro: 'neutral', atencao: 'warning' };

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [showValues, setShowValues] = useState(true);
  const [selectedReport, setSelectedReport] = useState('geral');
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const { config } = useConfiguracaoBarbearia();
  const nomeBarbearia = config?.nome || 'Barbearia';

  // Números reais: atendimentos concluídos e vendas de produtos da barbearia
  const { agendamentos, vendas, carregando } = useMovimentoBarbearia();
  const estatisticas = calcularEstatisticas(agendamentos, vendas, selectedPeriod);
  const peakHours = estatisticas.horarios;
  const situacao = estatisticas.situacao;
  const ANALISES = estatisticas.analises.map((a) => ({ ...a, icone: ICONE_ANALISE[a.tipo] }));
  const getCurrentData = () => estatisticas.serie;
  const variacaoTexto = textoVariacao;
  const metrics = estatisticas.metricas;

  // ---------- Baixar PDF ----------
  // Gera um PDF com layout próprio (cabeçalho com logo, indicadores, gráficos, tabela e análises).
  // Os valores saem completos mesmo com o "olho" fechado: ele só esconde os números na tela.
  const baixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const { gerarRelatorioPdf } = await import('../../../utils/relatorioPdf');
      await gerarRelatorioPdf({
        nomeBarbearia,
        logoUrl: config?.logo || null,
        periodo: PERIODOS[selectedPeriod],
        tipo: TIPOS[selectedReport],
        metricas: metrics,
        dados: getCurrentData(),
        horarios: peakHours,
        satisfacao: situacao,
        analises: ANALISES.map(({ tipo, titulo, texto }) => ({ tipo, titulo, texto })),
        nomeArquivo: `relatorio-${paraNomeDeArquivo(nomeBarbearia)}-${selectedPeriod}-${new Date().toLocaleDateString('en-CA')}.pdf`
      });
    } catch (error) {
      console.error('Erro ao gerar o PDF:', error);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  // ---------- Imprimir / salvar em PDF ----------
  // Abre a janela de impressão do navegador (dá para escolher "Salvar como PDF").
  // O CSS de impressão (Report.css) esconde menu e botões e usa fundo branco.
  const imprimirRelatorio = () => {
    const tituloOriginal = document.title;
    document.title = `Relatório ${PERIODOS[selectedPeriod]} - ${nomeBarbearia}`; // vira o nome do PDF
    const restaurar = () => {
      document.title = tituloOriginal;
      window.removeEventListener('afterprint', restaurar);
    };
    window.addEventListener('afterprint', restaurar);
    window.print();
  };

  const formatCurrency = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Gráfico de linha para clientes
  const LineChart = ({ data, dataKey, color = "#2563eb" }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }, [data]);

    if (!data.length) return null;

    const maxValue = topoDoEixo(Math.max(...data.map(d => d[dataKey])));
    const width = 600;
    const height = 200;
    const padding = 40;
    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - (d[dataKey] / maxValue) * (height - 2 * padding);
      return { x, y, value: d[dataKey], name: d.name };
    });

    const pathD = points.reduce((acc, point, i) => {
      return acc + (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
    }, '');

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Gráfico de linha para ${dataKey}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding + t * (height - 2 * padding);
          return (
            <line
              key={t}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="4 4"
            />
          );
        })}
        
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        
        {/* Area fill */}
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        
        <path 
          d={pathD + ` L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`}
          fill={`url(#gradient-${dataKey})`}
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 1s ease-in-out' }}
        />
        
        {/* Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={color} 
          strokeWidth="3"
          strokeDasharray={isVisible ? 'none' : '1000'}
          strokeDashoffset={isVisible ? '0' : '1000'}
          style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
        />
        
        {/* Points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={color}
            stroke="white"
            strokeWidth="3"
            tabIndex={0}
            aria-label={`${data[i].name}: ${showValues ? formatNumber(data[i][dataKey]) : '***'}`}
            opacity={isVisible ? 1 : 0}
            style={{ transition: `opacity 0.8s ease-in-out ${i * 0.1}s` }}
          />
        ))}
        
        {/* X axis labels */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          return (
            <text
              key={i}
              x={x}
              y={height - padding + 20}
              fontSize="12"
              fill="currentColor"
              fillOpacity={0.7}
              textAnchor="middle"
            >
              {d.name}
            </text>
          );
        })}
        
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - padding - t * (height - 2 * padding);
          const val = Math.round(maxValue * t);
          return (
            <text
              key={t}
              x={padding - 10}
              y={y + 4}
              fontSize="12"
              fill="currentColor"
              fillOpacity={0.7}
              textAnchor="end"
            >
              {showValues ? formatNumber(val) : '***'}
            </text>
          );
        })}
      </svg>
    );
  };

  // Gráfico de barras para horários de pico
  const BarChart = ({ data }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }, [data]);

    const maxValue = topoDoEixo(Math.max(...data.map(d => d.clients)));
    // Largura fixa: as barras se ajustam à quantidade de horários
    const height = 200;
    const padding = 30;
    const width = 420;
    const passo = (width - padding * 2) / Math.max(1, data.length);
    const barWidth = Math.min(28, passo * 0.65);
    const gap = passo - barWidth;

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras dos horários de pico">
        {/* Grid */}
        {[0, 0.5, 1].map((t) => {
          const y = padding + t * (height - 2 * padding);
          return (
            <line
              key={t}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="4 4"
            />
          );
        })}
        
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
        
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.clients / maxValue) * (height - 2 * padding);
          const x = padding + i * (barWidth + gap) + gap / 2;
          const y = height - padding - barHeight;
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={isVisible ? y : height - padding}
                width={barWidth}
                height={isVisible ? barHeight : 0}
                fill={d.color}
                rx="4"
                tabIndex={0}
                aria-label={`${d.name}: ${showValues ? formatNumber(d.clients) : '***'} clientes`}
                style={{ transition: `all 1s ease-in-out ${i * 0.05}s` }}
              />
              <text
                x={x + barWidth / 2}
                y={height - padding + 15}
                fontSize="10"
                fill="currentColor"
                fillOpacity={0.7}
                textAnchor="middle"
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const detalhes = estatisticas.detalhes;

  // Cartão de indicador e tabela usados nas abas Clientes, Serviços e Tempo
  const Cartao = ({ titulo, valor, detalhe, cor, Icone }) => (
    <div className="stat-card" tabIndex={0} aria-label={`${titulo}: ${valor}`}>
      <div className="stat-card-content">
        <div>
          <p>{titulo}</p>
          <p className="stat-number total">{valor}</p>
          <div className="stat-change neutral"><span>{detalhe}</span></div>
        </div>
        <div className={`stat-icon ${cor}`}>{React.createElement(Icone, { size: 24 })}</div>
      </div>
    </div>
  );

  const Tabela = ({ titulo, subtitulo, colunas, linhas, vazio, embutida = false }) => (
    <div className={embutida ? 'chart-section' : 'summary-section'}>
      <div className="chart-header">
        <h2>{titulo}</h2>
        <p>{subtitulo}</p>
      </div>
      {linhas.length ? (
        <div className="table-wrapper">
          <table className="summary-table">
            <thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {linhas.map((linha, i) => (
                <tr key={i}>{linha.map((v, k) => <td key={k} className={k === 0 ? 'period-cell' : 'number-cell'}>{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="rel-vazio">{vazio}</p>}
    </div>
  );

  return (
    <div className="reports-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Relatórios Detalhados</h1>
            <p>{carregando ? 'Carregando dados...' : `${{ geral: 'Visão geral', clientes: 'Clientes', servicos: 'Serviços', tempo: 'Tempo e horários' }[selectedReport]} · ${estatisticas.periodo.descricao}`}</p>
          </div>
          <div className="header-actions">
            {/* Filtro de relatório */}
            <div className="report-selector" role="group" aria-label="Selecionar tipo de relatório">
              {[
                { key: 'geral', label: 'Geral' },
                { key: 'clientes', label: 'Clientes' },
                { key: 'servicos', label: 'Serviços' },
                { key: 'tempo', label: 'Tempo' }
              ].map(report => (
                <button
                  key={report.key}
                  className={`report-btn ${selectedReport === report.key ? 'active' : ''}`}
                  onClick={() => setSelectedReport(report.key)}
                  aria-pressed={selectedReport === report.key}
                >
                  {report.label}
                </button>
              ))}
            </div>
            
            {/* Período */}
            <div className="period-selector" role="group" aria-label="Selecionar período">
              {[
                { key: 'diario', label: 'Diário' },
                { key: 'semanal', label: 'Semanal' },
                { key: 'mensal', label: 'Mensal' },
                { key: 'anual', label: 'Anual' }
              ].map(period => (
                <button
                  key={period.key}
                  className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period.key)}
                  aria-pressed={selectedPeriod === period.key}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Ações */}
            <div className="action-buttons">
              <button
                className="visibility-toggle"
                onClick={() => setShowValues(!showValues)}
                title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
                aria-pressed={showValues}
                aria-label={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              >
                {showValues ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
              
              <button
                className="action-btn"
                onClick={baixarPdf}
                disabled={gerandoPdf}
                title="Baixar relatório em PDF"
                aria-label="Baixar relatório em PDF"
              >
                {gerandoPdf ? <span className="action-spinner" aria-hidden="true" /> : <FiDownload size={18} />}
              </button>
              
              <button
                className="action-btn"
                onClick={imprimirRelatorio}
                title="Imprimir relatório"
                aria-label="Imprimir relatório"
              >
                <FiPrinter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Cabeçalho que só aparece na impressão */}
        <div className="print-header" aria-hidden="true">
          <strong>{nomeBarbearia}</strong>
          <span>
            Relatório {TIPOS[selectedReport].toLowerCase()} · período {PERIODOS[selectedPeriod].toLowerCase()} ·
            gerado em {new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>

        {selectedReport === 'geral' && (
          <>
        {/* Métricas principais */}
        <div className="stats-grid">
          <div className="stat-card" tabIndex={0} aria-label={`Total de clientes: ${formatNumber(metrics.totalClients)}`}>
            <div className="stat-card-content">
              <div>
                <p>Total de Clientes</p>
                <p className="stat-number total">{formatNumber(metrics.totalClients)}</p>
                <div className={`stat-change ${metrics.variacao.clients === null ? 'neutral' : metrics.variacao.clients >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.variacao.clients !== null && metrics.variacao.clients < 0 ? <FiTrendingDown size={16} /> : <FiTrendingUp size={16} />}
                  <span>{variacaoTexto(metrics.variacao.clients)}</span>
                </div>
              </div>
              <div className="stat-icon blue">
                <FiUsers size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Retenção de clientes: ${showValues ? metrics.clientRetention + '%' : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Retenção de Clientes</p>
                <p className="stat-number average">{showValues ? `${metrics.clientRetention}%` : '***'}</p>
                <div className="stat-change neutral">
                  <FiUsers size={16} />
                  <span>Clientes que voltaram 2+ vezes</span>
                </div>
              </div>
              <div className="stat-icon purple">
                <FiUsers size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Tempo médio de atendimento: ${showValues ? metrics.avgTime + 'min' : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Tempo Médio de Atendimento</p>
                <p className="stat-number period">{showValues ? `${metrics.avgTime}min` : '***'}</p>
                <div className={`stat-change ${metrics.variacao.avgTime === null ? 'neutral' : 'positive'}`}>
                  <FiClock size={16} />
                  <span>{variacaoTexto(metrics.variacao.avgTime, ' min')}</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiClock size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Faturamento: ${formatCurrency(metrics.totalRevenue)}`}>
            <div className="stat-card-content">
              <div>
                <p>Faturamento</p>
                <p className="stat-number new">{formatCurrency(metrics.totalRevenue)}</p>
                <div className={`stat-change ${metrics.variacao.revenue === null ? 'neutral' : metrics.variacao.revenue >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.variacao.revenue !== null && metrics.variacao.revenue < 0 ? <FiTrendingDown size={16} /> : <FiTrendingUp size={16} />}
                  <span>{variacaoTexto(metrics.variacao.revenue)}</span>
                </div>
              </div>
              <div className="stat-icon green">
                <FiScissors size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos principais */}
        <div className="charts-container">
          <div className="chart-section main-chart" aria-label="Evolução de clientes">
            <div className="chart-header">
              <h2>Evolução de Clientes</h2>
              <p>Clientes diferentes atendidos em cada período</p>
            </div>
            <div className="chart-wrapper">
              <LineChart data={getCurrentData()} dataKey="clients" color="#2563eb" />
            </div>
          </div>

          <div className="chart-section" aria-label="Horários de pico">
            <div className="chart-header">
              <h2>Horários de Pico</h2>
              <p>Movimento por horário do dia</p>
            </div>
            <div className="chart-wrapper">
              <BarChart data={peakHours} />
            </div>
          </div>

          <div className="chart-section" aria-label="Satisfação dos clientes">
            <div className="chart-header">
              <h2>Situação dos Agendamentos</h2>
              <p>Concluídos, a atender e cancelados no período</p>
            </div>
            <div className="satisfaction-bars">
              {situacao.map((item, index) => {
                const percentage = showValues ? item.value : 0;
                return (
                  <div key={index} className="satisfaction-item">
                    <div className="satisfaction-label">
                      {item.name}
                    </div>
                    <div className="satisfaction-bar">
                      <div
                        className="satisfaction-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                    <div className="satisfaction-value">
                      {showValues ? `${item.value}% (${item.quantidade})` : '***'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Segundo conjunto de gráficos */}
        <div className="secondary-charts">
          <div className="chart-section" aria-label="Evolução de serviços">
            <div className="chart-header">
              <h2>Evolução de Serviços</h2>
              <p>Quantidade de serviços realizados</p>
            </div>
            <div className="chart-wrapper">
              <LineChart data={getCurrentData()} dataKey="services" color="#10b981" />
            </div>
          </div>

          <div className="chart-section" aria-label="Tempo médio de atendimento">
            <div className="chart-header">
              <h2>Tempo Médio de Atendimento</h2>
              <p>Duração média dos serviços (minutos)</p>
            </div>
            <div className="chart-wrapper">
              <LineChart data={getCurrentData()} dataKey="avgTime" color="#8b5cf6" />
            </div>
          </div>
        </div>

        {/* Seção de insights */}
        <div className="insights-section" aria-label="Análises e insights">
          <h2>Análises e Insights</h2>
          <div className="insights-grid">
            {ANALISES.map((analise) => {
              const Icone = analise.icone;
              return (
                <div key={analise.titulo} className="insight-card" tabIndex={0}>
                  <div className={`insight-icon ${CLASSE_ICONE[analise.tipo]}`} aria-hidden="true">
                    <Icone size={20} />
                  </div>
                  <div className="insight-content">
                    <h3>{analise.titulo}</h3>
                    <p>{analise.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabela de resumo */}
        <div className="summary-section" aria-label="Resumo detalhado por período">
          <div className="chart-header">
            <h2>Resumo Detalhado por Período</h2>
            <p>Dados consolidados do período selecionado</p>
          </div>
          
          <div className="table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Clientes</th>
                  <th>Serviços</th>
                  <th>Faturamento</th>
                  <th>Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentData().map((item, index) => (
                  <tr key={index}>
                    <td className="period-cell">{item.name}</td>
                    <td className="number-cell">{formatNumber(item.clients)}</td>
                    <td className="number-cell">{formatNumber(item.services)}</td>
                    <td className="currency-cell">{formatCurrency(item.revenue)}</td>
                    <td className="time-cell">{showValues ? `${item.avgTime}min` : '***'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {selectedReport === 'clientes' && (
          <>
            <div className="stats-grid">
              <Cartao titulo="Clientes Atendidos" valor={formatNumber(metrics.totalClients)} detalhe={variacaoTexto(metrics.variacao.clients)} cor="blue" Icone={FiUsers} />
              <Cartao titulo="Clientes Novos" valor={formatNumber(detalhes.novosClientes)} detalhe="Primeiro atendimento neste período" cor="green" Icone={FiTrendingUp} />
              <Cartao titulo="Voltaram 2+ Vezes" valor={showValues ? `${detalhes.recorrentes} (${metrics.clientRetention}%)` : '***'} detalhe="Clientes recorrentes no período" cor="purple" Icone={FiUsers} />
              <Cartao titulo="Gasto Médio por Cliente" valor={formatCurrency(detalhes.gastoPorCliente)} detalhe="Só atendimentos concluídos" cor="red" Icone={FiScissors} />
            </div>
            <div className="secondary-charts">
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Evolução de Clientes</h2>
                  <p>Clientes diferentes atendidos em cada período</p>
                </div>
                <div className="chart-wrapper">
                  <LineChart data={getCurrentData()} dataKey="clients" color="#3b82f6" />
                </div>
              </div>
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Novos x Recorrentes</h2>
                  <p>Quem veio pela primeira vez e quem voltou</p>
                </div>
                <div className="satisfaction-list rel-barras">
                  {[
                    { name: 'Novos', valor: detalhes.novosClientes, color: '#10b981' },
                    { name: 'Voltaram 2+ vezes', valor: detalhes.recorrentes, color: '#8b5cf6' },
                    { name: 'Vieram 1 vez', valor: Math.max(0, metrics.totalClients - detalhes.recorrentes), color: '#60a5fa' }
                  ].map((item) => {
                    const pct = metrics.totalClients ? Math.round((item.valor / metrics.totalClients) * 100) : 0;
                    return (
                      <div key={item.name} className="satisfaction-item">
                        <div className="satisfaction-info"><span className="satisfaction-label">{item.name}</span></div>
                        <div className="satisfaction-bar-container">
                          <div className="satisfaction-bar" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="satisfaction-value">{showValues ? `${item.valor}` : '***'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <Tabela
              titulo="Clientes que Mais Gastaram"
              subtitulo="Atendimentos concluídos no período"
              vazio="Nenhum atendimento concluído no período."
              colunas={['Cliente', 'Visitas', 'Total gasto', 'Última visita']}
              linhas={detalhes.topClientes.map((c) => [c.nome, formatNumber(c.visitas), formatCurrency(c.gasto), c.ultima ? c.ultima.toLocaleDateString('pt-BR') : '—'])}
            />
          </>
        )}

        {selectedReport === 'servicos' && (
          <>
            <div className="stats-grid">
              <Cartao titulo="Serviços Realizados" valor={formatNumber(metrics.totalServices)} detalhe={variacaoTexto(metrics.variacao.services)} cor="blue" Icone={FiScissors} />
              <Cartao titulo="Faturamento em Serviços" valor={formatCurrency(metrics.receitaServicos)} detalhe={`${formatCurrency(metrics.receitaProdutos)} em produtos`} cor="green" Icone={FiTrendingUp} />
              <Cartao titulo="Ticket Médio" valor={formatCurrency(metrics.avgTicket)} detalhe={variacaoTexto(metrics.variacao.ticket)} cor="purple" Icone={FiUsers} />
              <Cartao titulo="Cancelamentos" valor={showValues ? `${metrics.taxaCancelamento}%` : '***'} detalhe={`${detalhes.agendamentosNoPeriodo} agendamento(s) no período`} cor="red" Icone={FiClock} />
            </div>
            <div className="secondary-charts">
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Evolução de Serviços</h2>
                  <p>Atendimentos concluídos em cada período</p>
                </div>
                <div className="chart-wrapper">
                  <LineChart data={getCurrentData()} dataKey="services" color="#10b981" />
                </div>
              </div>
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Situação dos Agendamentos</h2>
                  <p>Concluídos, a atender e cancelados</p>
                </div>
                <div className="satisfaction-list rel-barras">
                  {situacao.map((item) => (
                    <div key={item.name} className="satisfaction-item">
                      <div className="satisfaction-info"><span className="satisfaction-label">{item.name}</span></div>
                      <div className="satisfaction-bar-container">
                        <div className="satisfaction-bar" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="satisfaction-value">{showValues ? `${item.value}% (${item.quantidade})` : '***'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Tabela
              titulo="Ranking de Serviços"
              subtitulo="Ordenado pelo faturamento do período"
              vazio="Nenhum serviço concluído no período."
              colunas={['Serviço', 'Atendimentos', 'Faturamento', 'Participação', 'Preço médio']}
              linhas={detalhes.rankingServicos.map((s) => [s.nome, formatNumber(s.quantidade), formatCurrency(s.faturamento), showValues ? `${s.participacao}%` : '***', formatCurrency(s.precoMedio)])}
            />
          </>
        )}

        {selectedReport === 'tempo' && (
          <>
            <div className="stats-grid">
              <Cartao titulo="Tempo Médio" valor={showValues ? `${metrics.avgTime} min` : '***'} detalhe={variacaoTexto(metrics.variacao.avgTime, ' min')} cor="blue" Icone={FiClock} />
              <Cartao titulo="Horas Atendidas" valor={showValues ? `${detalhes.horasAtendidas.toFixed(1).replace('.', ',')} h` : '***'} detalhe="Soma da duração dos atendimentos" cor="green" Icone={FiScissors} />
              <Cartao titulo="Horário de Pico" valor={detalhes.horaPico || '—'} detalhe="Horário com mais agendamentos" cor="purple" Icone={FiTrendingUp} />
              <Cartao titulo="Dia Mais Movimentado" valor={detalhes.diaPico || '—'} detalhe="Dia da semana com mais agendamentos" cor="red" Icone={FiUsers} />
            </div>
            <div className="secondary-charts">
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Horários de Pico</h2>
                  <p>Agendamentos por horário do dia</p>
                </div>
                <div className="chart-wrapper">
                  <BarChart data={peakHours} />
                </div>
              </div>
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Movimento por Dia da Semana</h2>
                  <p>Agendamentos por dia (sem cancelados)</p>
                </div>
                <div className="chart-wrapper">
                  <BarChart data={detalhes.diasSemana} />
                </div>
              </div>
            </div>
            <div className="secondary-charts">
              <div className="chart-section">
                <div className="chart-header">
                  <h2>Tempo Médio de Atendimento</h2>
                  <p>Duração média dos atendimentos (minutos)</p>
                </div>
                <div className="chart-wrapper">
                  <LineChart data={getCurrentData()} dataKey="avgTime" color="#8b5cf6" />
                </div>
              </div>
              <Tabela
                embutida
                titulo="Duração por Serviço"
                subtitulo="Tempo de cadeira de cada serviço no período"
                vazio="Nenhum serviço concluído no período."
                colunas={['Serviço', 'Atendimentos', 'Duração', 'Horas no total']}
                linhas={detalhes.rankingServicos.map((s) => [s.nome, formatNumber(s.quantidade), `${s.duracaoMedia} min`, `${s.horas.toFixed(1).replace('.', ',')} h`])}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;