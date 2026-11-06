import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiScissors,
  FiEye,
  FiEyeOff,
  FiShoppingBag,
  FiClock,
  FiAlertTriangle
} from 'react-icons/fi';
import useMovimentoBarbearia from '../../../hooks/useMovimentoBarbearia';
import { calcularEstatisticas, textoVariacao } from '../../../utils/estatisticas';
import './Financial.css';

// Painel financeiro com os números reais da barbearia: atendimentos concluídos e vendas de produtos.
const ICONES_ANALISE = { positivo: FiTrendingUp, neutro: FiScissors, atencao: FiAlertTriangle };
const CLASSE_ANALISE = { positivo: 'positive', neutro: 'neutral', atencao: 'warning' };

const Financial = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [showValues, setShowValues] = useState(true);
  const { agendamentos, vendas, carregando, erro, recarregar } = useMovimentoBarbearia();

  const estatisticas = calcularEstatisticas(agendamentos, vendas, selectedPeriod);
  const serie = estatisticas.serie;
  const metrics = estatisticas.metricas;
  const serviceDistribution = estatisticas.distribuicao;
  const getCurrentData = () => serie;
  const temFaturamento = metrics.totalRevenue > 0;

  const Variacao = ({ valor, sufixo = '%', inverso = false }) => {
    const bom = valor === null ? null : inverso ? valor <= 0 : valor >= 0;
    const classe = bom === null ? 'neutral' : bom ? 'positive' : 'negative';
    const Icone = valor === null ? FiCalendar : valor >= 0 ? FiTrendingUp : FiTrendingDown;
    return (
      <div className={`stat-change ${classe}`}>
        <Icone size={16} />
        <span>{textoVariacao(valor, sufixo)}</span>
      </div>
    );
  };

  const formatCurrency = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Eixo do gráfico: "R$ 120", "R$ 1,2 mil"
  const moedaCurta = (v) => (v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil` : `R$ ${Math.round(v)}`);

  const formatNumber = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Simple line chart with SVG for revenue evolution
  const LineChartSimple = ({ data }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }, [data]);

    if (!data.length) return null;

    const maxRevenue = Math.max(1, ...data.map(d => d.revenue));
    const width = 600;
    const height = 200;
    const padding = 56;
    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - (d.revenue / maxRevenue) * (height - 2 * padding);
      return { x, y };
    });

    const pathD = points.reduce((acc, point, i) => {
      return acc + (i === 0 ? `M${point.x},${point.y}` : ` L${point.x},${point.y}`);
    }, '');

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de linha do faturamento">
        {/* Background grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding + t * (height - 2 * padding);
          return (
            <line
              key={t}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeDasharray="4 4"
              opacity={isVisible ? 1 : 0}
              style={{ transition: 'opacity 0.8s ease-in-out' }}
            />
          );
        })}
        {/* X axis */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="#333"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease-in-out' }}
        />
        {/* Y axis */}
        <line 
          x1={padding} 
          y1={padding} 
          x2={padding} 
          y2={height - padding} 
          stroke="#333"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease-in-out' }}
        />
        {/* Line path */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#2563eb" 
          strokeWidth="3"
          strokeDasharray={isVisible ? 'none' : '1000'}
          strokeDashoffset={isVisible ? '0' : '1000'}
          style={{ 
            transition: 'stroke-dashoffset 2s ease-in-out',
            filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))'
          }}
        />
        {/* Points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#2563eb"
            stroke="#fff"
            strokeWidth="2"
            tabIndex={0}
            aria-label={`${data[i].name}: ${showValues ? formatCurrency(data[i].revenue) : '***'}`}
            opacity={isVisible ? 1 : 0}
            style={{ 
              transition: `opacity 0.8s ease-in-out ${i * 0.1}s`,
              filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))'
            }}
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
              fill="#666"
              textAnchor="middle"
              opacity={isVisible ? 1 : 0}
              style={{ transition: `opacity 0.8s ease-in-out ${i * 0.05}s` }}
            >
              {d.name}
            </text>
          );
        })}
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - padding - t * (height - 2 * padding);
          const val = Math.round(maxRevenue * t);
          return (
            <text
              key={t}
              x={padding - 10}
              y={y + 4}
              fontSize="12"
              fill="#666"
              textAnchor="end"
              opacity={isVisible ? 1 : 0}
              style={{ transition: 'opacity 0.8s ease-in-out' }}
            >
              {showValues ? moedaCurta(val) : '***'}
            </text>
          );
        })}
      </svg>
    );
  };

  // Simple bar chart for services count
  const BarChartSimple = ({ data }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }, [data]);

    if (!data.length) return null;

    const maxServices = Math.max(1, ...data.map(d => d.services));
    // Largura fixa: as barras se ajustam à quantidade de períodos (7, 4, 12...)
    const height = 220;
    const padding = 30;
    const width = 300;
    const passo = (width - padding * 2) / data.length;
    const barWidth = Math.min(40, passo * 0.6);
    const gap = passo - barWidth;

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de barras do número de serviços">
        {/* Background grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding + t * (height - 2 * padding);
          return (
            <line
              key={t}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeDasharray="4 4"
              opacity={isVisible ? 1 : 0}
              style={{ transition: 'opacity 0.8s ease-in-out' }}
            />
          );
        })}
        {/* X axis */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="#333"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease-in-out' }}
        />
        {/* Y axis */}
        <line 
          x1={padding} 
          y1={padding} 
          x2={padding} 
          y2={height - padding} 
          stroke="#333"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease-in-out' }}
        />
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.services / maxServices) * (height - 2 * padding);
          const x = padding + i * (barWidth + gap) + gap / 2;
          const y = height - padding - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={isVisible ? y : height - padding}
                width={barWidth}
                height={isVisible ? barHeight : 0}
                fill="#10b981"
                tabIndex={0}
                aria-label={`${d.name}: ${showValues ? formatNumber(d.services) : '***'} serviços`}
                rx="4"
                style={{ 
                  transition: `all 1s ease-in-out ${i * 0.1}s`,
                  filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
                }}
              />
              {(data.length <= 7 || i % 2 === 0) && <text
                x={x + barWidth / 2}
                y={height - padding + 20}
                fontSize="12"
                fill="#666"
                textAnchor="middle"
                opacity={isVisible ? 1 : 0}
                style={{ transition: `opacity 0.8s ease-in-out ${i * 0.05}s` }}
              >
                {d.name}
              </text>}
            </g>
          );
        })}
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - padding - t * (height - 2 * padding);
          const val = Math.round(maxServices * t * 10) / 10;
          return (
            <text
              key={t}
              x={padding - 10}
              y={y + 4}
              fontSize="12"
              fill="#666"
              textAnchor="end"
              opacity={isVisible ? 1 : 0}
              style={{ transition: 'opacity 0.8s ease-in-out' }}
            >
              {showValues ? formatNumber(val) : '***'}
            </text>
          );
        })}
      </svg>
    );
  };

  // Simple pie chart for service distribution
  const PieChartSimple = ({ data }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 700);
      return () => clearTimeout(timer);
    }, [data]);

    const radius = 100;
    const center = 120;

    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
      const x = center + radius * Math.cos(2 * Math.PI * percent - Math.PI / 2);
      const y = center + radius * Math.sin(2 * Math.PI * percent - Math.PI / 2);
      return { x, y };
    };

    return (
      <svg width="100%" viewBox="0 0 240 240" role="img" aria-label="Gráfico de pizza da distribuição de serviços">
        <circle 
          cx={center} 
          cy={center} 
          r={radius} 
          fill="#f0f0f0"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease-in-out' }}
        />
        {data.map((slice, index) => {
          const [startX, startY] = (() => {
            const coords = getCoordinatesForPercent(cumulativePercent);
            return [coords.x, coords.y];
          })();

          cumulativePercent += slice.value / 100;

          const [endX, endY] = (() => {
            const coords = getCoordinatesForPercent(cumulativePercent);
            return [coords.x, coords.y];
          })();

          const largeArcFlag = slice.value > 50 ? 1 : 0;

          const pathData = [
            `M ${center} ${center}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={slice.color}
              stroke="#fff"
              strokeWidth="2"
              tabIndex={0}
              aria-label={`${slice.name}: ${showValues ? slice.value + '%' : '***'}`}
              opacity={isVisible ? 1 : 0}
              style={{ 
                transition: `opacity 1s ease-in-out ${index * 0.2}s`,
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
              }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="financial-page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Painel Financeiro</h1>
            <p>Atendimentos concluídos e vendas de produtos · {estatisticas.periodo.descricao}</p>
          </div>
          <div className="header-actions">
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
            <button
              className="visibility-toggle"
              onClick={() => setShowValues(!showValues)}
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              aria-pressed={showValues}
              aria-label={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <FiEye size={18} /> : <FiEyeOff size={18} />}
            </button>
          </div>
        </div>

        {erro && (
          <div className="financial-aviso" role="alert">
            {erro} <button type="button" onClick={recarregar}>Tentar de novo</button>
          </div>
        )}
        {!carregando && !erro && !temFaturamento && (
          <div className="financial-aviso financial-aviso--info" role="status">
            Ainda não há faturamento neste período. Os valores entram aqui quando você marca um atendimento como
            concluído na Agenda ou registra a venda de um produto.
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Faturamento Total</p>
                <p className="stat-number total">{carregando ? '...' : formatCurrency(metrics.totalRevenue)}</p>
                <Variacao valor={metrics.variacao.revenue} />
              </div>
              <div className="stat-icon blue">
                <FiDollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Serviços Realizados</p>
                <p className="stat-number new">{carregando ? '...' : formatNumber(metrics.totalServices)}</p>
                <Variacao valor={metrics.variacao.services} />
              </div>
              <div className="stat-icon green">
                <FiScissors size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Ticket Médio</p>
                <p className="stat-number average">{carregando ? '...' : formatCurrency(metrics.avgTicket)}</p>
                <Variacao valor={metrics.variacao.ticket} />
              </div>
              <div className="stat-icon purple">
                <FiUsers size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>A Receber</p>
                <p className="stat-number period">{carregando ? '...' : formatCurrency(metrics.aReceber)}</p>
                <div className="stat-change neutral">
                  <FiClock size={16} />
                  <span>Agendamentos ainda não concluídos</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiCalendar size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="financial-split">
          <div><span>Serviços</span><strong>{formatCurrency(metrics.receitaServicos)}</strong></div>
          <div><span><FiShoppingBag size={14} /> Produtos</span><strong>{formatCurrency(metrics.receitaProdutos)}</strong></div>
          <div><span>Lucro com produtos</span><strong>{formatCurrency(metrics.lucroProdutos)}</strong></div>
          <div><span>Clientes atendidos</span><strong>{formatNumber(metrics.totalClients)}</strong></div>
        </div>

        <div className="charts-container">
          <div className="chart-section main-chart" aria-label="Evolução do faturamento">
            <div className="chart-header">
              <h2>Evolução do Faturamento</h2>
              <p>Acompanhe a performance financeira ao longo do tempo</p>
            </div>
            <div className="chart-wrapper">
              <LineChartSimple data={getCurrentData()} />
            </div>
          </div>

          <div className="chart-section" aria-label="Distribuição por serviços">
            <div className="chart-header">
              <h2>Distribuição por Serviços</h2>
              <p>Participação de cada serviço no faturamento</p>
            </div>
            <div className="chart-wrapper">
              {serviceDistribution.length ? (
                <>
                  <PieChartSimple data={serviceDistribution} />
                  <ul className="financial-legenda">
                    {serviceDistribution.map((fatia) => (
                      <li key={fatia.name}>
                        <span className="financial-legenda-cor" style={{ backgroundColor: fatia.color }} />
                        <span className="financial-legenda-nome">{fatia.name}</span>
                        <strong>{showValues ? `${fatia.value}%` : '***'}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p className="financial-vazio">Sem faturamento no período.</p>}
            </div>
          </div>

          <div className="chart-section" aria-label="Número de serviços realizados">
            <div className="chart-header">
              <h2>Número de Serviços</h2>
              <p>Quantidade de atendimentos realizados</p>
            </div>
            <div className="chart-wrapper">
              <BarChartSimple data={getCurrentData()} />
            </div>
          </div>
        </div>

        <div className="insights-section" aria-label="Insights e recomendações">
          <h2>Insights e Recomendações</h2>
          <div className="insights-grid">
            {estatisticas.analises.map((analise) => {
              const Icone = ICONES_ANALISE[analise.tipo];
              return (
                <div key={analise.titulo} className="insight-card" tabIndex={0}>
                  <div className={`insight-icon ${CLASSE_ANALISE[analise.tipo]}`} aria-hidden="true">
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
      </div>
    </div>
  );
};

export default Financial;