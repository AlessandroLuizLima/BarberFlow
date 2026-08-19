import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiScissors,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import './Financial.css';

const Financial = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [showValues, setShowValues] = useState(true);

  // Dados simulados
  const dailyData = [
    { name: 'Seg', revenue: 450, services: 12 },
    { name: 'Ter', revenue: 680, services: 18 },
    { name: 'Qua', revenue: 520, services: 14 },
    { name: 'Qui', revenue: 750, services: 20 },
    { name: 'Sex', revenue: 920, services: 25 },
    { name: 'Sáb', revenue: 1200, services: 32 },
    { name: 'Dom', revenue: 380, services: 10 }
  ];

  const weeklyData = [
    { name: 'Sem 1', revenue: 4200, services: 112 },
    { name: 'Sem 2', revenue: 4800, services: 128 },
    { name: 'Sem 3', revenue: 3900, services: 104 },
    { name: 'Sem 4', revenue: 5200, services: 138 }
  ];

  const monthlyData = [
    { name: 'Jan', revenue: 18500, services: 485 },
    { name: 'Fev', revenue: 16200, services: 421 },
    { name: 'Mar', revenue: 19800, services: 512 },
    { name: 'Abr', revenue: 21200, services: 548 },
    { name: 'Mai', revenue: 18900, services: 492 },
    { name: 'Jun', revenue: 22800, services: 589 },
    { name: 'Jul', revenue: 20400, services: 528 },
    { name: 'Ago', revenue: 23100, services: 598 },
    { name: 'Set', revenue: 19700, services: 512 },
    { name: 'Out', revenue: 24500, services: 635 },
    { name: 'Nov', revenue: 22900, services: 594 },
    { name: 'Dez', revenue: 26800, services: 695 }
  ];

  const yearlyData = [
    { name: '2021', revenue: 185000, services: 4850 },
    { name: '2022', revenue: 198000, services: 5120 },
    { name: '2023', revenue: 215000, services: 5580 },
    { name: '2024', revenue: 248000, services: 6420 }
  ];

  const serviceDistribution = [
    { name: 'Corte Tradicional', value: 35, color: '#8884d8' },
    { name: 'Barba', value: 25, color: '#82ca9d' },
    { name: 'Corte + Barba', value: 30, color: '#ffc658' },
    { name: 'Outros', value: 10, color: '#ff7c7c' }
  ];

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'diario': return dailyData;
      case 'semanal': return weeklyData;
      case 'mensal': return monthlyData;
      case 'anual': return yearlyData;
      default: return monthlyData;
    }
  };

  const getCurrentMetrics = () => {
    const data = getCurrentData();
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalServices = data.reduce((sum, item) => sum + item.services, 0);
    const avgTicket = totalServices ? totalRevenue / totalServices : 0;

    return {
      totalRevenue,
      totalServices,
      avgTicket,
      growth: 12.5 // Simulado
    };
  };

  const metrics = getCurrentMetrics();

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

  // Simple line chart with SVG for revenue evolution
  const LineChartSimple = ({ data }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }, [data]);

    if (!data.length) return null;

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const width = 600;
    const height = 200;
    const padding = 40;
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
              {showValues ? formatCurrency(val) : '***'}
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

    const maxServices = Math.max(...data.map(d => d.services));
    const barWidth = 30;
    const gap = 15;
    const height = 200;
    const padding = 40;
    const width = data.length * (barWidth + gap) + padding * 2;

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
          const x = padding + i * (barWidth + gap);
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
              <text
                x={x + barWidth / 2}
                y={height - padding + 20}
                fontSize="12"
                fill="#666"
                textAnchor="middle"
                opacity={isVisible ? 1 : 0}
                style={{ transition: `opacity 0.8s ease-in-out ${i * 0.05}s` }}
              >
                {d.name}
              </text>
            </g>
          );
        })}
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - padding - t * (height - 2 * padding);
          const val = Math.round(maxServices * t);
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
        {/* Labels */}
        <g transform={`translate(${center * 2 + 10}, 20)`}>
          {data.map((slice, i) => (
            <g 
              key={i} 
              transform={`translate(0, ${i * 25})`}
              opacity={isVisible ? 1 : 0}
              style={{ transition: `opacity 0.8s ease-in-out ${i * 0.1}s` }}
            >
              <rect width="18" height="18" fill={slice.color} rx="4" ry="4" />
              <text x="24" y="14" fontSize="14" fill="#333">
                {slice.name} {showValues ? `(${slice.value}%)` : '(***)'}
              </text>
            </g>
          ))}
        </g>
      </svg>
    );
  };

  return (
    <div className="financial-page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Painel Financeiro</h1>
            <p>Controle completo das finanças da barbearia</p>
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

        <div className="stats-grid">
          <div className="stat-card" tabIndex={0} aria-label={`Faturamento total: ${showValues ? formatCurrency(metrics.totalRevenue) : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Faturamento Total</p>
                <p className="stat-number total">{formatCurrency(metrics.totalRevenue)}</p>
                <div className="stat-change positive" aria-label={`Crescimento de ${metrics.growth} por cento`}>
                  <FiTrendingUp size={16} />
                  <span>+{metrics.growth}% vs período anterior</span>
                </div>
              </div>
              <div className="stat-icon blue">
                <FiDollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Total de serviços: ${showValues ? formatNumber(metrics.totalServices) : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Total de Serviços</p>
                <p className="stat-number new">{formatNumber(metrics.totalServices)}</p>
                <div className="stat-change positive" aria-label="Crescimento de 8.2 por cento">
                  <FiTrendingUp size={16} />
                  <span>+8.2% vs período anterior</span>
                </div>
              </div>
              <div className="stat-icon green">
                <FiScissors size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Ticket médio: ${showValues ? formatCurrency(metrics.avgTicket) : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Ticket Médio</p>
                <p className="stat-number average">{formatCurrency(metrics.avgTicket)}</p>
                <div className="stat-change positive" aria-label="Crescimento de 3.8 por cento">
                  <FiTrendingUp size={16} />
                  <span>+3.8% vs período anterior</span>
                </div>
              </div>
              <div className="stat-icon purple">
                <FiUsers size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Período analisado: ${
            selectedPeriod === 'diario' ? 'Esta Semana' :
            selectedPeriod === 'semanal' ? 'Este Mês' :
            selectedPeriod === 'mensal' ? 'Este Ano' :
            'Últimos 4 Anos'
          }`}>
            <div className="stat-card-content">
              <div>
                <p>Período Analisado</p>
                <p className="stat-number period">
                  {selectedPeriod === 'diario' && 'Esta Semana'}
                  {selectedPeriod === 'semanal' && 'Este Mês'}
                  {selectedPeriod === 'mensal' && 'Este Ano'}
                  {selectedPeriod === 'anual' && 'Últimos 4 Anos'}
                </p>
                <div className="stat-change neutral" aria-label="Atualizado agora">
                  <FiCalendar size={16} />
                  <span>Atualizado agora</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiCalendar size={24} />
              </div>
            </div>
          </div>
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
              <PieChartSimple data={serviceDistribution} />
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
            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon positive" aria-hidden="true">
                <FiTrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h3>Crescimento Consistente</h3>
                <p>O faturamento apresenta crescimento de 12.5% em relação ao período anterior, indicando boa performance do negócio.</p>
              </div>
            </div>
            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon neutral" aria-hidden="true">
                <FiScissors size={20} />
              </div>
              <div className="insight-content">
                <h3>Serviços Populares</h3>
                <p>Corte + Barba representa 30% dos serviços. Considere criar pacotes promocionais para aumentar a margem.</p>
              </div>
            </div>
            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon positive" aria-hidden="true">
                <FiDollarSign size={20} />
              </div>
              <div className="insight-content">
                <h3>Ticket Médio em Alta</h3>
                <p>O ticket médio aumentou 3.8%, sugerindo que os clientes estão optando por serviços de maior valor.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;