import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiScissors, FiUserCheck } from 'react-icons/fi';
import { listarClientes } from '../../../services/clienteService';
import { listarProfissionais } from '../../../services/profissionalService';
import { listarServicos } from '../../../services/servicoService';
import { listarAgendamentos } from '../../../services/agendamentoService';
import './Dashboard.css';

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

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);

  const agendamentosHoje = dados.agendamentos.filter((a) => {
    const data = new Date(a.data_hora);
    return data >= inicioHoje && data < fimHoje && a.status !== 'cancelado';
  });

  const proximosAgendamentos = dados.agendamentos
    .filter((a) => new Date(a.data_hora) >= hoje && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
    .slice(0, 5);

  const profissionaisAtivos = dados.profissionais.filter((p) => p.ativo !== false);

  const formatarDataHora = (iso) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

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
                <div>
                  <strong>{agendamento.cliente?.nome_completo}</strong>
                  <p>
                    {agendamento.servico?.nome} com {agendamento.profissional?.nome_completo}
                  </p>
                </div>
                <span className="dashboard-list-datetime">
                  {formatarDataHora(agendamento.data_hora)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
