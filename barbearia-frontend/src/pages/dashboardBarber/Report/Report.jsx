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
import './Report.css';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [showValues, setShowValues] = useState(true);
  const [selectedReport, setSelectedReport] = useState('geral');

  // Dados simulados para relatórios
  const dailyReports = [
    { name: 'Seg', clients: 8, services: 12, revenue: 450, avgTime: 35 },
    { name: 'Ter', revenue: 680, clients: 12, services: 18, avgTime: 38 },
    { name: 'Qua', revenue: 520, clients: 10, services: 14, avgTime: 37 },
    { name: 'Qui', revenue: 750, clients: 15, services: 20, avgTime: 40 },
    { name: 'Sex', revenue: 920, clients: 18, services: 25, avgTime: 42 },
    { name: 'Sáb', revenue: 1200, clients: 24, services: 32, avgTime: 38 },
    { name: 'Dom', revenue: 380, clients: 8, services: 10, avgTime: 35 }
  ];

  const weeklyReports = [
    { name: 'Sem 1', clients: 95, services: 131, revenue: 4900, avgTime: 38 },
    { name: 'Sem 2', clients: 108, services: 148, revenue: 5400, avgTime: 37 },
    { name: 'Sem 3', clients: 89, services: 124, revenue: 4200, avgTime: 34 },
    { name: 'Sem 4', clients: 118, services: 162, revenue: 5800, avgTime: 36 }
  ];

  const monthlyReports = [
    { name: 'Jan', clients: 385, services: 485, revenue: 18500, avgTime: 38 },
    { name: 'Fev', clients: 321, services: 421, revenue: 16200, avgTime: 39 },
    { name: 'Mar', clients: 412, services: 512, revenue: 19800, avgTime: 39 },
    { name: 'Abr', clients: 448, services: 548, revenue: 21200, avgTime: 39 },
    { name: 'Mai', clients: 392, services: 492, revenue: 18900, avgTime: 38 },
    { name: 'Jun', clients: 489, services: 589, revenue: 22800, avgTime: 39 },
    { name: 'Jul', clients: 428, services: 528, revenue: 20400, avgTime: 39 },
    { name: 'Ago', clients: 498, services: 598, revenue: 23100, avgTime: 39 },
    { name: 'Set', clients: 412, services: 512, revenue: 19700, avgTime: 38 },
    { name: 'Out', clients: 535, services: 635, revenue: 24500, avgTime: 39 },
    { name: 'Nov', clients: 494, services: 594, revenue: 22900, avgTime: 39 },
    { name: 'Dez', clients: 595, services: 695, revenue: 26800, avgTime: 39 }
  ];

  const yearlyReports = [
    { name: '2021', clients: 4850, services: 5850, revenue: 185000, avgTime: 38 },
    { name: '2022', clients: 5120, services: 6120, revenue: 198000, avgTime: 39 },
    { name: '2023', clients: 5580, services: 6680, revenue: 215000, avgTime: 38 },
    { name: '2024', clients: 6420, services: 7520, revenue: 248000, avgTime: 39 }
  ];

  const clientSatisfaction = [
    { name: 'Muito Satisfeito', value: 65, color: '#10b981' },
    { name: 'Satisfeito', value: 28, color: '#60a5fa' },
    { name: 'Neutro', value: 5, color: '#fbbf24' },
    { name: 'Insatisfeito', value: 2, color: '#ef4444' }
  ];

  const peakHours = [
    { name: '08h', clients: 2, color: '#e0e7ff' },
    { name: '09h', clients: 4, color: '#c7d2fe' },
    { name: '10h', clients: 8, color: '#a5b4fc' },
    { name: '11h', clients: 12, color: '#818cf8' },
    { name: '12h', clients: 6, color: '#6366f1' },
    { name: '13h', clients: 3, color: '#5b21b6' },
    { name: '14h', clients: 10, color: '#7c3aed' },
    { name: '15h', clients: 15, color: '#8b5cf6' },
    { name: '16h', clients: 18, color: '#a855f7' },
    { name: '17h', clients: 14, color: '#c084fc' },
    { name: '18h', clients: 11, color: '#d8b4fe' },
    { name: '19h', clients: 7, color: '#e9d5ff' }
  ];

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'diario': return dailyReports;
      case 'semanal': return weeklyReports;
      case 'mensal': return monthlyReports;
      case 'anual': return yearlyReports;
      default: return monthlyReports;
    }
  };

  const getCurrentMetrics = () => {
    const data = getCurrentData();
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalClients = data.reduce((sum, item) => sum + item.clients, 0);
    const totalServices = data.reduce((sum, item) => sum + item.services, 0);
    const avgTime = data.reduce((sum, item) => sum + item.avgTime, 0) / data.length;

    return {
      totalRevenue,
      totalClients,
      totalServices,
      avgTime: Math.round(avgTime),
      clientRetention: 87.3,
      satisfaction: 93.2
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

  // Gráfico de linha para clientes
  const LineChart = ({ data, dataKey, color = "#2563eb" }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }, [data]);

    if (!data.length) return null;

    const maxValue = Math.max(...data.map(d => d[dataKey]));
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

    const maxValue = Math.max(...data.map(d => d.clients));
    const barWidth = 25;
    const gap = 8;
    const height = 200;
    const padding = 40;
    const width = data.length * (barWidth + gap) + padding * 2;

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
          const x = padding + i * (barWidth + gap);
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

  return (
    <div className="reports-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Relatórios Detalhados</h1>
            <p>Análises completas e insights do negócio</p>
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
                title="Exportar relatório"
                aria-label="Exportar relatório"
              >
                <FiDownload size={18} />
              </button>
              
              <button
                className="action-btn"
                title="Imprimir relatório"
                aria-label="Imprimir relatório"
              >
                <FiPrinter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Métricas principais */}
        <div className="stats-grid">
          <div className="stat-card" tabIndex={0} aria-label={`Total de clientes: ${formatNumber(metrics.totalClients)}`}>
            <div className="stat-card-content">
              <div>
                <p>Total de Clientes</p>
                <p className="stat-number total">{formatNumber(metrics.totalClients)}</p>
                <div className="stat-change positive" aria-label="Crescimento de 15.2 por cento">
                  <FiTrendingUp size={16} />
                  <span>+15.2% vs período anterior</span>
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
                <div className="stat-change positive" aria-label="Crescimento de 2.1 por cento">
                  <FiTrendingUp size={16} />
                  <span>+2.1% vs período anterior</span>
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
                <div className="stat-change negative" aria-label="Redução de 1.5 minutos">
                  <FiTrendingDown size={16} />
                  <span>-1.5min vs período anterior</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiClock size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0} aria-label={`Satisfação dos clientes: ${showValues ? metrics.satisfaction + '%' : '***'}`}>
            <div className="stat-card-content">
              <div>
                <p>Satisfação dos Clientes</p>
                <p className="stat-number new">{showValues ? `${metrics.satisfaction}%` : '***'}</p>
                <div className="stat-change positive" aria-label="Crescimento de 4.3 por cento">
                  <FiTrendingUp size={16} />
                  <span>+4.3% vs período anterior</span>
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
              <p>Acompanhe o crescimento da base de clientes</p>
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
              <h2>Satisfação</h2>
              <p>Avaliação dos clientes</p>
            </div>
            <div className="satisfaction-bars">
              {clientSatisfaction.map((item, index) => {
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
                      {showValues ? `${item.value}%` : '***'}
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
            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon positive" aria-hidden="true">
                <FiTrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h3>Crescimento de Clientes</h3>
                <p>A base de clientes cresceu 15.2% no período analisado, indicando boa atração e retenção de novos clientes.</p>
              </div>
            </div>

            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon neutral" aria-hidden="true">
                <FiClock size={20} />
              </div>
              <div className="insight-content">
                <h3>Otimização do Tempo</h3>
                <p>O tempo médio de atendimento diminuiu 1.5 minutos, melhorando a eficiência sem comprometer a qualidade.</p>
              </div>
            </div>

            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon warning" aria-hidden="true">
                <FiUsers size={20} />
              </div>
              <div className="insight-content">
                <h3>Horários de Pico</h3>
                <p>Os horários de maior movimento são entre 15h e 17h. Considere ajustar a equipe nestes períodos.</p>
              </div>
            </div>

            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon positive" aria-hidden="true">
                <FiScissors size={20} />
              </div>
              <div className="insight-content">
                <h3>Alta Satisfação</h3>
                <p>93% dos clientes estão satisfeitos ou muito satisfeitos com os serviços, um excelente indicador de qualidade.</p>
              </div>
            </div>

            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon positive" aria-hidden="true">
                <FiTrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h3>Retenção Excelente</h3>
                <p>A taxa de retenção de 87.3% mostra que os clientes estão fiéis ao estabelecimento e retornam regularmente.</p>
              </div>
            </div>

            <div className="insight-card" tabIndex={0}>
              <div className="insight-icon neutral" aria-hidden="true">
                <FiFilter size={20} />
              </div>
              <div className="insight-content">
                <h3>Oportunidades</h3>
                <p>Considere expandir o horário de funcionamento nos fins de semana para atender mais clientes nos horários de pico.</p>
              </div>
            </div>
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
      </div>
    </div>
  );
};

export default Reports;