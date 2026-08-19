import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiUser, 
  FiCalendar, 
  FiDollarSign, 
  FiUsers,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiDownload,
  FiTrendingUp,
  FiClock,
  FiScissors,
  FiStar,
  FiX
} from 'react-icons/fi';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'João Silva',
      phone: '(11) 99999-9999',
      email: 'joao.silva@email.com',
      address: 'Rua das Flores, 123',
      registrationDate: '2024-01-15',
      totalSpent: 450.00,
      visits: 15,
      lastVisit: '2024-08-15',
      preferredService: 'Corte + Barba',
      rating: 5,
      status: 'ativo'
    },
    {
      id: 2,
      name: 'Carlos Santos',
      phone: '(11) 88888-8888',
      email: 'carlos.santos@email.com',
      address: 'Av. Principal, 456',
      registrationDate: '2024-07-20',
      totalSpent: 180.00,
      visits: 6,
      lastVisit: '2024-08-10',
      preferredService: 'Corte',
      rating: 4,
      status: 'ativo'
    },
    {
      id: 3,
      name: 'Pedro Oliveira',
      phone: '(11) 77777-7777',
      email: 'pedro.oliveira@email.com',
      address: 'Rua da Paz, 789',
      registrationDate: '2024-06-10',
      totalSpent: 320.00,
      visits: 10,
      lastVisit: '2024-08-12',
      preferredService: 'Barba',
      rating: 5,
      status: 'ativo'
    },
    {
      id: 4,
      name: 'Rafael Costa',
      phone: '(11) 66666-6666',
      email: 'rafael.costa@email.com',
      address: 'Alameda Santos, 321',
      registrationDate: '2024-07-25',
      totalSpent: 90.00,
      visits: 3,
      lastVisit: '2024-07-30',
      preferredService: 'Corte',
      rating: 3,
      status: 'inativo'
    },
    {
      id: 5,
      name: 'Marcos Lima',
      phone: '(11) 55555-5555',
      email: 'marcos.lima@email.com',
      address: 'Rua Central, 654',
      registrationDate: '2024-08-01',
      totalSpent: 220.00,
      visits: 7,
      lastVisit: '2024-08-14',
      preferredService: 'Corte + Barba',
      rating: 4,
      status: 'ativo'
    },
    {
      id: 6,
      name: 'André Ferreira',
      phone: '(11) 44444-4444',
      email: 'andre.ferreira@email.com',
      address: 'Praça da República, 987',
      registrationDate: '2024-05-18',
      totalSpent: 540.00,
      visits: 18,
      lastVisit: '2024-08-13',
      preferredService: 'Corte + Barba',
      rating: 5,
      status: 'ativo'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showValues, setShowValues] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Dados de serviços expandidos
  const clientServices = {
    1: [
      { id: 1, service: 'Corte + Barba', date: '2024-08-15', value: 55.00, barber: 'João', duration: 45 },
      { id: 2, service: 'Corte', date: '2024-08-01', value: 35.00, barber: 'Carlos', duration: 30 },
      { id: 3, service: 'Barba', date: '2024-07-20', value: 25.00, barber: 'João', duration: 20 },
      { id: 4, service: 'Corte + Barba', date: '2024-07-05', value: 55.00, barber: 'Pedro', duration: 45 }
    ],
    2: [
      { id: 1, service: 'Corte', date: '2024-08-10', value: 35.00, barber: 'Carlos', duration: 30 },
      { id: 2, service: 'Barba', date: '2024-07-25', value: 25.00, barber: 'João', duration: 20 }
    ],
    3: [
      { id: 1, service: 'Barba', date: '2024-08-12', value: 25.00, barber: 'Pedro', duration: 20 },
      { id: 2, service: 'Corte + Barba', date: '2024-07-28', value: 55.00, barber: 'João', duration: 45 },
      { id: 3, service: 'Sobrancelha', date: '2024-07-10', value: 15.00, barber: 'Ana', duration: 15 }
    ],
    4: [
      { id: 1, service: 'Corte', date: '2024-07-30', value: 35.00, barber: 'Carlos', duration: 30 }
    ],
    5: [
      { id: 1, service: 'Corte + Barba', date: '2024-08-14', value: 55.00, barber: 'João', duration: 45 },
      { id: 2, service: 'Corte', date: '2024-08-01', value: 35.00, barber: 'Pedro', duration: 30 }
    ],
    6: [
      { id: 1, service: 'Corte + Barba', date: '2024-08-13', value: 55.00, barber: 'João', duration: 45 },
      { id: 2, service: 'Corte + Barba', date: '2024-07-30', value: 55.00, barber: 'Carlos', duration: 45 },
      { id: 3, service: 'Barba', date: '2024-07-15', value: 25.00, barber: 'Pedro', duration: 20 }
    ]
  };

  // Calcular estatísticas avançadas
  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.status === 'ativo').length;
  
  const currentDate = new Date();
  const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
  const newClientsThisMonth = clients.filter(client => {
    const clientDate = new Date(client.registrationDate);
    return clientDate >= oneMonthAgo;
  }).length;

  const totalRevenue = clients.reduce((acc, client) => acc + client.totalSpent, 0);
  const averageSpent = totalRevenue / clients.length || 0;
  const averageVisits = clients.reduce((acc, client) => acc + client.visits, 0) / clients.length || 0;
  const averageRating = clients.reduce((acc, client) => acc + client.rating, 0) / clients.length || 0;

  const topClients = [...clients]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  // Filtros e ordenação
  const getFilteredAndSortedClients = () => {
    let filtered = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone.includes(searchTerm) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.registrationDate) - new Date(a.registrationDate);
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'visits':
          return b.visits - a.visits;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  };

  const filteredClients = getFilteredAndSortedClients();

  const handleAddClient = () => {
    if (newClient.name && newClient.phone) {
      const client = {
        id: Math.max(...clients.map(c => c.id)) + 1,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email || '',
        address: newClient.address || '',
        registrationDate: new Date().toISOString().split('T')[0],
        totalSpent: 0,
        visits: 0,
        lastVisit: null,
        preferredService: '',
        rating: 5,
        status: 'ativo'
      };
      setClients([...clients, client]);
      setNewClient({ name: '', phone: '', email: '', address: '' });
      setShowModal(false);
    }
  };

  const handleEditClient = () => {
    if (selectedClient && newClient.name && newClient.phone) {
      const updatedClients = clients.map(client =>
        client.id === selectedClient.id
          ? { ...client, ...newClient }
          : client
      );
      setClients(updatedClients);
      setShowEditModal(false);
      setSelectedClient(null);
      setNewClient({ name: '', phone: '', email: '', address: '' });
    }
  };

  const handleDeleteClient = (clientId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(clients.filter(client => client.id !== clientId));
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowReportModal(true);
  };

  const handleEditClick = (client, e) => {
    e.stopPropagation();
    setSelectedClient(client);
    setNewClient({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || ''
    });
    setShowEditModal(true);
  };

  const formatCurrency = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    return status === 'ativo' ? 'status-active' : 'status-inactive';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={16}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  return (
    <div className="clients-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Gestão de Clientes</h1>
            <p>Gerencie e acompanhe todos os clientes da barbearia</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Clientes</p>
                <p className="stat-number total">{formatCurrency ? totalClients : '***'}</p>
                <div className="stat-change neutral">
                  <FiUsers size={16} />
                  <span>{activeClients} ativos</span>
                </div>
              </div>
              <div className="stat-icon blue">
                <FiUsers size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Novos Clientes (30 dias)</p>
                <p className="stat-number new">{newClientsThisMonth}</p>
                <div className="stat-change positive">
                  <FiTrendingUp size={16} />
                  <span>+{Math.round((newClientsThisMonth / totalClients) * 100)}% da base</span>
                </div>
              </div>
              <div className="stat-icon green">
                <FiCalendar size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Avaliação Média</p>
                <p className="stat-number period">{showValues ? averageRating.toFixed(1) : '***'}</p>
                <div className="stat-change neutral">
                  <FiStar size={16} />
                  <span>{averageVisits.toFixed(1)} visitas/cliente</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiStar size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Busca e Filtros */}
        <div className="search-section">
          <div className="search-controls">
            <div className="search-container">
              <FiSearch className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Pesquisar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filters-container">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="date">Data de Cadastro</option>
                <option value="spent">Valor Gasto</option>
                <option value="visits">Número de Visitas</option>
                <option value="rating">Avaliação</option>
              </select>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="add-button"
            >
              <FiPlus size={20} />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="top-clients-section">
          <div className="section-header">
            <h2>Top Clientes</h2>
            <p>Clientes com maior faturamento</p>
          </div>
          <div className="top-clients-grid">
            {topClients.map((client, index) => (
              <div key={client.id} className={`top-client-card rank-${index + 1}`}>
                <div className="rank-badge">{index + 1}º</div>
                <div className="client-avatar">
                  <FiUser size={20} />
                </div>
                <div className="top-client-info">
                  <h4>{client.name}</h4>
                  <p className="top-client-spent">{formatCurrency(client.totalSpent)}</p>
                  <div className="top-client-stats">
                    <span>{client.visits} visitas</span>
                    <div className="rating-stars">
                      {renderStars(client.rating)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="clients-list">
          <div className="clients-list-header">
            <h2>Lista de Clientes ({filteredClients.length})</h2>
          </div>
          
          <div className="clients-list-content">
            {filteredClients.length === 0 ? (
              <div className="no-clients">
                <div className="no-clients-icon">
                  <FiUsers size={48} />
                </div>
                <h3>{searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
                <p>
                  {searchTerm 
                    ? 'Tente alterar os filtros ou termos de busca'
                    : 'Cadastre seu primeiro cliente para começar'
                  }
                </p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="client-item"
                  onClick={() => handleClientClick(client)}
                >
                  <div className="client-content">
                    <div className="client-left">
                      <div className="client-avatar">
                        <FiUser size={24} />
                      </div>
                      <div className="client-info">
                        <div className="client-name-row">
                          <h3>{client.name}</h3>
                          <span className={`status-badge ${getStatusBadge(client.status)}`}>
                            {client.status}
                          </span>
                        </div>
                        <div className="client-contact">
                          <span><FiPhone size={14} /> {client.phone}</span>
                          {client.email && <span><FiMail size={14} /> {client.email}</span>}
                        </div>
                        <div className="client-meta">
                          <span>Cadastrado: {formatDate(client.registrationDate)}</span>
                          <span>Última visita: {formatDate(client.lastVisit)}</span>
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
                          <span className="stat-label">Avaliação</span>
                          <div className="rating-display">
                            {renderStars(client.rating)}
                            <span className="rating-number">({client.rating})</span>
                          </div>
                        </div>
                      </div>
                      <div className="client-actions">
                        <button
                          onClick={(e) => handleEditClick(client, e)}
                          className="action-button edit"
                          title="Editar cliente"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id);
                          }}
                          className="action-button delete"
                          title="Excluir cliente"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Cadastrar Novo Cliente</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="form-input"
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="form-input"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="form-input"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="form-input"
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="button-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClient.name || !newClient.phone}
                className="button-primary"
              >
                Cadastrar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Cliente</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="form-input"
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="form-input"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="form-input"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="form-input"
                    placeholder="Rua, número, bairro"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="button-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditClient}
                disabled={!newClient.name || !newClient.phone}
                className="button-primary"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatório */}
      {showReportModal && selectedClient && (
        <div className="modal-overlay">
          <div className="modal modal-report">
            <div className="modal-header">
              <h2>Relatório Detalhado</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="modal-close"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="client-profile">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <FiUser size={32} />
                  </div>
                  <div className="profile-info">
                    <h3>{selectedClient.name}</h3>
                    <div className="profile-details">
                      <span><FiPhone size={14} /> {selectedClient.phone}</span>
                      {selectedClient.email && <span><FiMail size={14} /> {selectedClient.email}</span>}
                      {selectedClient.address && <span><FiMapPin size={14} /> {selectedClient.address}</span>}
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusBadge(selectedClient.status)}`}>
                    {selectedClient.status}
                  </span>
                </div>

                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="stat-number">{formatCurrency(selectedClient.totalSpent)}</span>
                    <span className="stat-label">Total Gasto</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">{selectedClient.visits}</span>
                    <span className="stat-label">Visitas</span>
                  </div>
                  <div className="profile-stat">
                    <div className="rating-display">
                      {renderStars(selectedClient.rating)}
                    </div>
                    <span className="stat-label">Avaliação</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">{formatDate(selectedClient.lastVisit)}</span>
                    <span className="stat-label">Última Visita</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="report-table">
              <div className="table-header">
                <h3>Histórico de Serviços</h3>
              </div>
              <div className="services-table">
                <div className="table-row table-header-row">
                  <div>Serviço</div>
                  <div>Data</div>
                  <div>Barbeiro</div>
                  <div>Duração</div>
                  <div>Valor</div>
                </div>
                
                {clientServices[selectedClient.id] && clientServices[selectedClient.id].length > 0 ? (
                  clientServices[selectedClient.id].map((service) => (
                    <div key={service.id} className="table-row">
                      <div className="service-name">
                        <FiScissors size={16} />
                        {service.service}
                      </div>
                      <div className="service-date">{formatDate(service.date)}</div>
                      <div className="service-barber">{service.barber}</div>
                      <div className="service-duration">
                        <FiClock size={14} />
                        {service.duration}min
                      </div>
                      <div className="service-value">{formatCurrency(service.value)}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-services">
                    <FiScissors size={32} />
                    <p>Nenhum serviço realizado ainda</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowReportModal(false)}
                className="button-secondary"
              >
                Fechar Relatório
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  handleEditClick(selectedClient, { stopPropagation: () => {} });
                }}
                className="button-primary"
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;