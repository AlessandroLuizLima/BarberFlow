// Clientes da barbearia (painel): quem já agendou aqui, com gasto, visitas e histórico reais.
// O cadastro é do próprio cliente (ele cria a conta no app), por isso o barbeiro só acompanha.
import React, { useEffect, useMemo, useState } from 'react';
import {
  FiUsers,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiSearch,
  FiX,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiScissors,
  FiClock,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { listarClientes } from '../../../services/clienteService';
import { listarAgendamentos } from '../../../services/agendamentoService';
import { urlImagem } from '../../../services/api';
import './Clients.css';

const DIAS_PARA_INATIVO = 60;
const PENDENTES = ['agendado', 'confirmado', 'remarcado'];
const STATUS = { agendado: 'Agendado', confirmado: 'Confirmado', remarcado: 'Remarcado', concluido: 'Concluído', cancelado: 'Cancelado' };
const valorDoAgendamento = (a) => Number(a.preco_cobrado ?? a.servico?.preco ?? 0);

// Junta o cadastro do cliente com os agendamentos dele nesta barbearia
function montarClientes(clientes, agendamentos) {
  const agora = new Date();
  const porCliente = {};
  agendamentos.forEach((a) => {
    (porCliente[a.cliente_id] = porCliente[a.cliente_id] || []).push(a);
  });
  return clientes.map((c) => {
    const lista = (porCliente[c.id] || []).sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
    const concluidos = lista.filter((a) => a.status === 'concluido');
    const contagem = {};
    concluidos.forEach((a) => { const n = a.servico?.nome; if (n) contagem[n] = (contagem[n] || 0) + 1; });
    const preferido = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const ultima = concluidos[0] ? new Date(concluidos[0].data_hora) : null;
    const proximo = lista.filter((a) => PENDENTES.includes(a.status) && new Date(a.data_hora) >= agora)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))[0] || null;
    const primeira = lista.length ? new Date(lista[lista.length - 1].data_hora) : null;
    const ativo = Boolean(proximo) || Boolean(ultima && (agora - ultima) / 86400000 <= DIAS_PARA_INATIVO);
    return {
      id: c.id,
      name: c.nome_completo,
      email: c.email,
      phone: c.telefone,
      foto: c.foto_url ? urlImagem(c.foto_url) : null,
      cidade: [c.bairro, c.cidade && `${c.cidade}${c.uf ? `/${c.uf}` : ''}`].filter(Boolean).join(' · '),
      totalSpent: concluidos.reduce((s, a) => s + valorDoAgendamento(a), 0),
      visits: concluidos.length,
      cancelamentos: lista.filter((a) => a.status === 'cancelado').length,
      lastVisit: ultima,
      firstBooking: primeira,
      proximo,
      preferredService: preferido,
      status: ativo ? 'ativo' : 'inativo',
      historico: lista
    };
  });
}

function Avatar({ client, size = 24, classe = 'client-avatar' }) {
  return (
    <div className={classe}>
      {client.foto ? <img src={client.foto} alt="" className="client-foto" /> : <FiUser size={size} />}
    </div>
  );
}

const Clients = () => {
  const [clientes, setClientes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortBy, setSortBy] = useState('spent');
  const [selecionado, setSelecionado] = useState(null);
  const [showValues, setShowValues] = useState(true);

  const carregar = async () => {
    setErro('');
    try {
      const [lista, ags] = await Promise.all([listarClientes(), listarAgendamentos()]);
      setClientes(lista);
      setAgendamentos(ags);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível carregar os clientes.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const clients = useMemo(() => montarClientes(clientes, agendamentos), [clientes, agendamentos]);

  const formatCurrency = (value) =>
    showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '***';
  const formatDate = (data) => (data ? new Date(data).toLocaleDateString('pt-BR') : '—');
  const formatDateTime = (data) =>
    new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Estatísticas
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ativo').length;
  const trintaDias = new Date(Date.now() - 30 * 86400000);
  const novos = clients.filter((c) => c.firstBooking && c.firstBooking >= trintaDias).length;
  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0);
  const comVisita = clients.filter((c) => c.visits > 0);
  const averageSpent = comVisita.length ? totalRevenue / comVisita.length : 0;
  const averageVisits = comVisita.length ? comVisita.reduce((s, c) => s + c.visits, 0) / comVisita.length : 0;
  const topClients = [...clients].filter((c) => c.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);

  const filtrados = clients
    .filter((c) => {
      const termo = searchTerm.toLowerCase();
      const busca = !termo || c.name.toLowerCase().includes(termo) || (c.email || '').toLowerCase().includes(termo) || (c.phone || '').includes(searchTerm);
      return busca && (filterStatus === 'todos' || c.status === filterStatus);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'visits': return b.visits - a.visits;
        case 'recent': return (b.lastVisit || 0) - (a.lastVisit || 0);
        default: return b.totalSpent - a.totalSpent;
      }
    });

  return (
    <div className="clients-page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Clientes</h1>
            <p>Quem já agendou na sua barbearia, com gasto, visitas e histórico</p>
          </div>
          <div className="header-actions">
            <button
              className="visibility-toggle"
              onClick={() => setShowValues(!showValues)}
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              aria-label={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <FiEye size={18} /> : <FiEyeOff size={18} />}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Clientes</p>
                <p className="stat-number total">{carregando ? '...' : totalClients}</p>
                <div className="stat-change positive">
                  <FiUsers size={16} />
                  <span>{activeClients} ativos (últimos {DIAS_PARA_INATIVO} dias)</span>
                </div>
              </div>
              <div className="stat-icon blue"><FiUsers size={24} /></div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Novos Clientes (30 dias)</p>
                <p className="stat-number new">{carregando ? '...' : novos}</p>
                <div className="stat-change positive">
                  <FiTrendingUp size={16} />
                  <span>Primeiro agendamento no último mês</span>
                </div>
              </div>
              <div className="stat-icon green"><FiCalendar size={24} /></div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Gasto Médio por Cliente</p>
                <p className="stat-number period">{carregando ? '...' : formatCurrency(averageSpent)}</p>
                <div className="stat-change positive">
                  <FiScissors size={16} />
                  <span>{averageVisits.toFixed(1).replace('.', ',')} visitas por cliente</span>
                </div>
              </div>
              <div className="stat-icon red"><FiDollarSign size={24} /></div>
            </div>
          </div>
        </div>

        <div className="search-section">
          <div className="search-controls">
            <div className="search-container">
              <FiSearch className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Pesquisar por nome, telefone ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Pesquisar clientes"
              />
            </div>
            <div className="filters-container">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select" aria-label="Filtrar por situação">
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select" aria-label="Ordenar">
                <option value="spent">Maior gasto</option>
                <option value="visits">Mais visitas</option>
                <option value="recent">Visita mais recente</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>
        </div>

        {topClients.length > 0 && (
          <div className="top-clients-section">
            <div className="section-header">
              <h2>Top Clientes</h2>
              <p>Quem mais gastou em atendimentos concluídos</p>
            </div>
            <div className="top-clients-grid">
              {topClients.map((client, index) => (
                <div key={client.id} className={`top-client-card rank-${index + 1}`} onClick={() => setSelecionado(client)} role="button" tabIndex={0}>
                  <div className="rank-badge">{index + 1}º</div>
                  <Avatar client={client} size={20} />
                  <div className="top-client-info">
                    <h4>{client.name}</h4>
                    <p className="top-client-spent">{formatCurrency(client.totalSpent)}</p>
                    <div className="top-client-stats">
                      <span>{client.visits} visita{client.visits === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="clients-list">
          <div className="clients-list-header">
            <h2>Lista de Clientes ({filtrados.length})</h2>
          </div>
          <div className="clients-list-content">
            {carregando ? (
              <div className="no-clients"><p>Carregando clientes...</p></div>
            ) : erro ? (
              <div className="no-clients" role="alert">
                <h3>{erro}</h3>
                <button type="button" className="button-secondary" onClick={carregar}>Tentar de novo</button>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="no-clients">
                <div className="no-clients-icon"><FiUsers size={48} /></div>
                <h3>{searchTerm || filterStatus !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</h3>
                <p>
                  {searchTerm || filterStatus !== 'todos'
                    ? 'Tente alterar os filtros ou a busca'
                    : 'Os clientes aparecem aqui assim que fizerem o primeiro agendamento na sua barbearia.'}
                </p>
              </div>
            ) : (
              filtrados.map((client) => (
                <div
                  key={client.id}
                  className="client-item"
                  onClick={() => setSelecionado(client)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelecionado(client); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="client-content">
                    <div className="client-left">
                      <Avatar client={client} />
                      <div className="client-info">
                        <div className="client-name-row">
                          <h3>{client.name}</h3>
                          <span className={`status-badge ${client.status === 'ativo' ? 'status-active' : 'status-inactive'}`}>
                            {client.status}
                          </span>
                        </div>
                        <div className="client-contact">
                          {client.phone && <span><FiPhone size={14} /> {client.phone}</span>}
                          {client.email && <span><FiMail size={14} /> {client.email}</span>}
                        </div>
                        <div className="client-meta">
                          <span>Última visita: {formatDate(client.lastVisit)}</span>
                          {client.proximo && <span>Próximo: {formatDateTime(client.proximo.data_hora)}</span>}
                          {client.preferredService && <span>Prefere: {client.preferredService}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="client-right">
                      <div className="client-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total Gasto</span>
                          <span className="stat-value primary">{formatCurrency(client.totalSpent)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Visitas</span>
                          <span className="stat-value">{client.visits}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Cancelados</span>
                          <span className="stat-value">{client.cancelamentos}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selecionado && (
        <div className="ch-overlay" role="dialog" aria-modal="true" aria-labelledby="cliente-titulo" onClick={() => setSelecionado(null)}>
          <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ch-topo">
              <h2 id="cliente-titulo">Histórico do Cliente</h2>
              <button onClick={() => setSelecionado(null)} className="ch-fechar" aria-label="Fechar"><FiX size={20} /></button>
            </div>

            <div className="ch-corpo">
              <div className="ch-perfil">
                <Avatar client={selecionado} size={28} classe="ch-avatar" />
                <div className="ch-perfil-info">
                  <div className="ch-nome-linha">
                    <h3>{selecionado.name}</h3>
                    <span className={`status-badge ${selecionado.status === 'ativo' ? 'status-active' : 'status-inactive'}`}>{selecionado.status}</span>
                  </div>
                  <div className="ch-contatos">
                    {selecionado.phone && <span><FiPhone size={14} /> {selecionado.phone}</span>}
                    {selecionado.email && <span><FiMail size={14} /> {selecionado.email}</span>}
                    {selecionado.cidade && <span><FiMapPin size={14} /> {selecionado.cidade}</span>}
                  </div>
                </div>
              </div>

              <div className="ch-numeros">
                <div><strong>{formatCurrency(selecionado.totalSpent)}</strong><span>Total gasto</span></div>
                <div><strong>{selecionado.visits}</strong><span>Visitas concluídas</span></div>
                <div><strong>{selecionado.preferredService || '—'}</strong><span>Serviço preferido</span></div>
                <div><strong>{formatDate(selecionado.lastVisit)}</strong><span>Última visita</span></div>
              </div>

              {selecionado.proximo && (
                <p className="ch-proximo">
                  <FiCalendar size={15} /> Próximo horário: <strong>{formatDateTime(selecionado.proximo.data_hora)}</strong>
                  {selecionado.proximo.servico?.nome ? ` · ${selecionado.proximo.servico.nome}` : ''}
                </p>
              )}

              <h4 className="ch-subtitulo">Agendamentos nesta barbearia ({selecionado.historico.length})</h4>
              {selecionado.historico.length ? (
                <ul className="ch-lista">
                  {selecionado.historico.map((a) => (
                    <li key={a.id} className="ch-item">
                      <div className="ch-item-principal">
                        <span className="ch-item-servico"><FiScissors size={15} /> {a.servico?.nome || '—'}</span>
                        <span className="ch-item-meta"><FiClock size={13} /> {formatDateTime(a.data_hora)} · {a.profissional?.nome_completo || '—'}</span>
                      </div>
                      <div className="ch-item-lado">
                        <span className={`ch-situacao ch-situacao--${a.status}`}>{STATUS[a.status] || a.status}</span>
                        <strong>{formatCurrency(valorDoAgendamento(a))}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ch-vazio">Nenhum agendamento ainda.</p>
              )}
            </div>

            <div className="ch-rodape">
              <button onClick={() => setSelecionado(null)} className="button-secondary">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
