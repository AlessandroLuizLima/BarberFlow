import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCalendar,
  FiScissors,
  FiUserCheck,
  FiDollarSign,
  FiClock,
} from 'react-icons/fi';
import { listarClientes } from '../../../services/clienteService';
import { listarProfissionais } from '../../../services/profissionalService';
import { listarServicos } from '../../../services/servicoService';
import { listarAgendamentos } from '../../../services/agendamentoService';
import './Dashboard.css';

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABEL = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

function Dashboard() {
  const [dados, setDados] = useState({
    clientes: [],
    profissionais: [],
    servicos: [],
    agendamentos: [],
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([
      listarClientes(),
      listarProfissionais(),
      listarServicos(),
      listarAgendamentos(),
    ])
      .then(([clientes, profissionais, servicos, agendamentos]) => {
        setDados({ clientes, profissionais, servicos, agendamentos });
      })
      .catch((error) => {
        console.error('Erro ao carregar dashboard:', error);
        setErro('Não foi possível carregar os dados. Verifique se o backend está rodando.');
      })
      .finally(() => setCarregando(false));
  }, []);

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);

  const agendamentosHoje = dados.agendamentos.filter((a) => {
    const data = new Date(a.data_hora);
    return data >= inicioHoje && data < fimHoje && a.status !== 'cancelado';
  });

  // Lucro do dia = soma do preço dos serviços já concluídos hoje
  const lucroHoje = agendamentosHoje
    .filter((a) => a.status === 'concluido')
    .reduce((total, a) => total + Number(a.servico?.preco || 0), 0);

  // Previsto = o que ainda falta receber hoje
  const previstoHoje = agendamentosHoje
    .filter((a) => a.status === 'agendado' || a.status === 'confirmado')
    .reduce((total, a) => total + Number(a.servico?.preco || 0), 0);

  const proximosAgendamentos = dados.agendamentos
    .filter(
      (a) =>
        new Date(a.data_hora) >= agora &&
        a.status !== 'cancelado' &&
        a.status !== 'concluido'
    )
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
    .slice(0, 5);

  const profissionaisAtivos = dados.profissionais.filter((p) => p.ativo !== false);

  const formatarData = (iso) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });

  const formatarHora = (iso) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (carregando) {
    return (
      <div className="dashboard-page">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral da sua barbearia</p>
      </div>

      {erro && <p className="error-message">{erro}</p>}

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-yellow"><FiDollarSign /></div>
          <div>
            <span className="dashboard-card-value">{formatarMoeda(lucroHoje)}</span>
            <span className="dashboard-card-label">Lucro do dia</span>
            <span className="dashboard-card-hint">
              Previsto ainda hoje: {formatarMoeda(previstoHoje)}
            </span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-blue"><FiCalendar /></div>
          <div>
            <span className="dashboard-card-value">{agendamentosHoje.length}</span>
            <span className="dashboard-card-label">Agendamentos hoje</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-purple"><FiUsers /></div>
          <div>
            <span className="dashboard-card-value">{dados.clientes.length}</span>
            <span className="dashboard-card-label">Clientes cadastrados</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-green"><FiUserCheck /></div>
          <div>
            <span className="dashboard-card-value">{profissionaisAtivos.length}</span>
            <span className="dashboard-card-label">Profissionais ativos</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon icon-orange"><FiScissors /></div>
          <div>
            <span className="dashboard-card-value">{dados.servicos.length}</span>
            <span className="dashboard-card-label">Serviços cadastrados</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Próximos agendamentos</h2>
          <Link to="/dashboard/agenda">Ver agenda completa</Link>
        </div>

        {proximosAgendamentos.length === 0 ? (
          <p className="dashboard-empty">Nenhum agendamento futuro no momento.</p>
        ) : (
          <div className="dashboard-list">
            {proximosAgendamentos.map((agendamento) => (
              <div key={agendamento.id} className="dashboard-list-item">
                <div className="dashboard-item-time">
                  <strong>{formatarHora(agendamento.data_hora)}</strong>
                  <span>{formatarData(agendamento.data_hora)}</span>
                </div>

                <div className="dashboard-item-info">
                  <span className="dashboard-service-badge">
                    <FiScissors size={14} />
                    {agendamento.servico?.nome || 'Serviço'}
                  </span>
                  <strong className="dashboard-item-client">
                    {agendamento.cliente?.nome_completo}
                  </strong>
                  <p>
                    com {agendamento.profissional?.nome_completo}
                    {agendamento.servico?.duracao_minutos && (
                      <>
                        {' · '}
                        <FiClock size={12} /> {agendamento.servico.duracao_minutos} min
                      </>
                    )}
                  </p>
                </div>

                <div className="dashboard-item-side">
                  <span className="dashboard-item-price">
                    {formatarMoeda(agendamento.servico?.preco)}
                  </span>
                  <span className={`dashboard-status status-${agendamento.status}`}>
                    {STATUS_LABEL[agendamento.status] || agendamento.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;