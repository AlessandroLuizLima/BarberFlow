import React, { useState, useEffect } from "react";
import { 
  FiEdit, 
  FiTrash2, 
  FiX, 
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiScissors,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiDownload,
  FiBarChart,
  FiStar,
  FiUsers
} from "react-icons/fi";
import "./Services.css";

const Services = () => {
  const [services, setServices] = useState([
    { 
      id: 1, 
      name: "Corte de Cabelo", 
      price: 35.0, 
      duration: 30,
      category: "corte",
      description: "Corte moderno e personalizado",
      popularity: 85,
      avgRating: 4.8,
      totalBookings: 245,
      active: true
    },
    { 
      id: 2, 
      name: "Barba Completa", 
      price: 25.0, 
      duration: 20,
      category: "barba",
      description: "Aparar, desenhar e finalizar",
      popularity: 72,
      avgRating: 4.6,
      totalBookings: 189,
      active: true
    },
    { 
      id: 3, 
      name: "Corte + Barba", 
      price: 55.0, 
      duration: 50,
      category: "combo",
      description: "Pacote completo de cuidados",
      popularity: 95,
      avgRating: 4.9,
      totalBookings: 312,
      active: true
    },
    {
      id: 4,
      name: "Sobrancelha",
      price: 15.0,
      duration: 15,
      category: "extras",
      description: "Design e aparar sobrancelhas",
      popularity: 45,
      avgRating: 4.3,
      totalBookings: 98,
      active: true
    },
    {
      id: 5,
      name: "Lavagem + Hidratação",
      price: 20.0,
      duration: 25,
      category: "tratamento",
      description: "Limpeza profunda e hidratação",
      popularity: 38,
      avgRating: 4.5,
      totalBookings: 67,
      active: false
    },
    {
      id: 6,
      name: "Bigode",
      price: 12.0,
      duration: 10,
      category: "barba",
      description: "Aparar e modelar bigode",
      popularity: 28,
      avgRating: 4.2,
      totalBookings: 43,
      active: true
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [sortBy, setSortBy] = useState("name");
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [formService, setFormService] = useState({
    name: "",
    price: "",
    duration: "",
    category: "corte",
    description: "",
  });

  const categories = [
    { key: "todos", label: "Todos", icon: FiBarChart },
    { key: "corte", label: "Cortes", icon: FiScissors },
    { key: "barba", label: "Barba", icon: FiScissors },
    { key: "combo", label: "Combos", icon: FiStar },
    { key: "extras", label: "Extras", icon: FiUsers },
    { key: "tratamento", label: "Tratamentos", icon: FiClock }
  ];

  // Calcular estatísticas
  const totalServices = services.length;
  const activeServices = services.filter(s => s.active).length;
  const totalRevenue = services.reduce((acc, service) => acc + (service.price * service.totalBookings), 0);
  const averagePrice = services.reduce((acc, service) => acc + service.price, 0) / services.length || 0;
  const mostPopular = services.reduce((prev, current) => 
    (prev.popularity > current.popularity) ? prev : current, services[0] || {}
  );
  const totalBookings = services.reduce((acc, service) => acc + service.totalBookings, 0);

  // Filtros e ordenação
  const getFilteredAndSortedServices = () => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "todos" || service.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return b.price - a.price;
        case "duration":
          return b.duration - a.duration;
        case "popularity":
          return b.popularity - a.popularity;
        case "rating":
          return b.avgRating - a.avgRating;
        default:
          return 0;
      }
    });
  };

  const filteredServices = getFilteredAndSortedServices();

  const formatName = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const formatDuration = (duration) => {
    const numbers = duration.toString().replace(/\D/g, "");
    return numbers ? parseInt(numbers) : 30;
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormService({ 
      name: "", 
      price: "", 
      duration: "", 
      category: "corte",
      description: "" 
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormService({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      description: service.description || ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormService({ 
      name: "", 
      price: "", 
      duration: "", 
      category: "corte",
      description: "" 
    });
  };

  const openDeleteConfirm = (service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setServiceToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormService((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formService.name || !formService.price || !formService.duration) return;

    const formattedName = formatName(formService.name);
    const formattedDuration = formatDuration(formService.duration);

    const serviceData = {
      name: formattedName,
      price: parseFloat(formService.price),
      duration: formattedDuration,
      category: formService.category,
      description: formService.description || "",
      popularity: editingService ? editingService.popularity : Math.floor(Math.random() * 40) + 30,
      avgRating: editingService ? editingService.avgRating : (Math.random() * 1.5 + 3.5).toFixed(1),
      totalBookings: editingService ? editingService.totalBookings : Math.floor(Math.random() * 50) + 10,
      active: editingService ? editingService.active : true
    };

    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? { ...s, ...serviceData }
            : s
        )
      );
    } else {
      setServices((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...serviceData
        },
      ]);
    }
    closeModal();
  };

  const confirmRemove = () => {
    if (serviceToDelete) {
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      closeDeleteConfirm();
    }
  };

  const toggleServiceStatus = (serviceId) => {
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, active: !service.active }
          : service
      )
    );
  };

  const formatPrice = (price) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatNumber = (value) => {
    if (!showValues) return '***';
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.key === category);
    const IconComponent = categoryData ? categoryData.icon : FiScissors;
    return <IconComponent size={16} />;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={12}
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  return (
    <div className="services-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Gestão de Serviços</h1>
            <p>Configure e gerencie todos os serviços da barbearia</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Serviços</p>
                <p className="stat-number total">{totalServices}</p>
                <div className="stat-change neutral">
                  <FiScissors size={16} />
                  <span>{activeServices} ativos</span>
                </div>
              </div>
              <div className="stat-icon blue">
                <FiScissors size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Agendamentos</p>
                <p className="stat-number average">{formatNumber(totalBookings)}</p>
                <div className="stat-change positive">
                  <FiUsers size={16} />
                  <span>Média: {Math.round(totalBookings / totalServices)}/serviço</span>
                </div>
              </div>
              <div className="stat-icon purple">
                <FiBarChart size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Mais Popular</p>
                <p className="stat-number period">{mostPopular?.name || 'N/A'}</p>
                <div className="stat-change neutral">
                  <FiStar size={16} />
                  <span>{showValues ? `${mostPopular?.popularity}%` : '***'} popularidade</span>
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
                className="search-input"
                placeholder="Buscar serviços por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar serviços"
              />
            </div>

            <div className="filters-container">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Ordenar por Nome</option>
                <option value="price">Maior Preço</option>
                <option value="duration">Maior Duração</option>
                <option value="popularity">Mais Popular</option>
                <option value="rating">Melhor Avaliado</option>
              </select>
            </div>

            <button 
              className="add-button" 
              onClick={openAddModal}
              aria-label="Cadastrar novo serviço"
            >
              <FiPlus size={20} />
              Novo Serviço
            </button>
          </div>
        </div>

        {/* Top Serviços */}
        <div className="top-services-section">
          <div className="section-header">
            <h2>Serviços Mais Populares</h2>
            <p>Baseado no número de agendamentos e avaliações</p>
          </div>
          <div className="top-services-grid">
            {services
              .filter(service => service.active)
              .sort((a, b) => b.popularity - a.popularity)
              .slice(0, 3)
              .map((service, index) => (
                <div key={service.id} className={`top-service-card rank-${index + 1}`}>
                  <div className="rank-badge">{index + 1}º</div>
                  <div className="service-category-icon">
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="top-service-info">
                    <h4>{service.name}</h4>
                    <p className="top-service-price">{formatPrice(service.price)}</p>
                    <div className="top-service-stats">
                      <div className="rating-display">
                        {renderStars(service.avgRating)}
                        <span className="rating-number">({service.avgRating})</span>
                      </div>
                      <div className="popularity-bar">
                        <div 
                          className="popularity-fill" 
                          style={{ width: `${service.popularity}%` }}
                        />
                      </div>
                      <span className="booking-count">{service.totalBookings} agendamentos</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Lista de Serviços */}
        <div className="services-list" role="list" aria-label="Lista de serviços cadastrados">
          <div className="services-list-header">
            <h2>Lista de Serviços ({filteredServices.length})</h2>
          </div>
          
          <div className="services-list-content">
            {filteredServices.length === 0 ? (
              <div className="no-services" role="alert">
                <div className="no-services-icon">
                  <FiScissors size={48} />
                </div>
                <h3>
                  {searchTerm || filterCategory !== "todos"
                    ? "Nenhum serviço encontrado"
                    : "Nenhum serviço cadastrado"}
                </h3>
                <p>
                  {searchTerm || filterCategory !== "todos"
                    ? "Tente alterar os filtros ou termos de busca"
                    : "Cadastre seu primeiro serviço para começar"}
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="service-item" role="listitem">
                  <div className="service-content">
                    <div className="service-left">
                      <div className="service-icon">
                        {getCategoryIcon(service.category)}
                      </div>
                      <div className="service-info">
                        <div className="service-name-row">
                          <h3>{service.name}</h3>
                          <span className={`status-badge ${service.active ? 'status-active' : 'status-inactive'}`}>
                            {service.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className="service-description">{service.description}</p>
                        <div className="service-meta">
                          <span className="duration">
                            <FiClock size={14} />
                            {service.duration} min
                          </span>
                          <span className="category">
                            {categories.find(cat => cat.key === service.category)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="service-right">
                      <div className="service-stats">
                        <div className="stat-item">
                          <span className="stat-label">Preço</span>
                          <span className="stat-value primary">{formatPrice(service.price)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Popularidade</span>
                          <div className="popularity-indicator">
                            <div 
                              className="popularity-bar-small"
                              style={{ width: `${service.popularity}%` }}
                            />
                            <span>{showValues ? `${service.popularity}%` : '***'}</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avaliação</span>
                          <div className="rating-display">
                            {renderStars(service.avgRating)}
                            <span className="rating-number">({service.avgRating})</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Agendamentos</span>
                          <span className="stat-value">{formatNumber(service.totalBookings)}</span>
                        </div>
                      </div>
                      
                      <div className="service-actions">
                        <button
                          type="button"
                          className={`action-button toggle ${service.active ? 'active' : 'inactive'}`}
                          onClick={() => toggleServiceStatus(service.id)}
                          title={service.active ? 'Desativar serviço' : 'Ativar serviço'}
                        >
                          {service.active ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                        </button>
                        <button
                          type="button"
                          className="action-button edit"
                          onClick={() => openEditModal(service)}
                          title={`Editar serviço ${service.name}`}
                          aria-label={`Editar serviço ${service.name}`}
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-button delete"
                          onClick={() => openDeleteConfirm(service)}
                          title={`Remover serviço ${service.name}`}
                          aria-label={`Remover serviço ${service.name}`}
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

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal">
              <div className="modal-header">
                <h2 id="modal-title">
                  {editingService ? "Editar Serviço" : "Cadastrar Novo Serviço"}
                </h2>
                <button className="modal-close" onClick={closeModal} aria-label="Fechar modal">
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="service-name">
                        Nome do Serviço *
                      </label>
                      <input
                        id="service-name"
                        type="text"
                        className="form-input"
                        placeholder="Ex: Corte de Cabelo"
                        name="name"
                        value={formService.name}
                        onChange={handleInputChange}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="service-category">
                        Categoria *
                      </label>
                      <select
                        id="service-category"
                        className="form-input"
                        name="category"
                        value={formService.category}
                        onChange={handleInputChange}
                        required
                      >
                        {categories.slice(1).map(category => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="service-price">
                        Valor (R$) *
                      </label>
                      <input
                        id="service-price"
                        type="number"
                        className="form-input"
                        placeholder="Ex: 35.00"
                        step="0.01"
                        min="0"
                        name="price"
                        value={formService.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="service-duration">
                        Duração (minutos) *
                      </label>
                      <input
                        id="service-duration"
                        type="number"
                        className="form-input"
                        placeholder="Ex: 30"
                        min="5"
                        max="180"
                        name="duration"
                        value={formService.duration}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="service-description">
                        Descrição
                      </label>
                      <input
                        id="service-description"
                        type="text"
                        className="form-input"
                        placeholder="Breve descrição do serviço"
                        name="description"
                        value={formService.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="button-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="button-primary">
                    {editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="modal modal-delete">
              <div className="modal-header">
                <h2 id="delete-modal-title">
                  <FiAlertTriangle className="alert-icon" aria-hidden="true" />
                  Confirmar Exclusão
                </h2>
                <button className="modal-close" onClick={closeDeleteConfirm} aria-label="Fechar modal">
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="modal-content">
                <div className="delete-content">
                  <p>
                    Tem certeza que deseja excluir o serviço <strong>{serviceToDelete?.name}</strong>?
                  </p>
                  <div className="delete-warning">
                    <FiAlertTriangle size={16} />
                    <span>Esta ação não pode ser desfeita</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="button-secondary" onClick={closeDeleteConfirm}>
                  Cancelar
                </button>
                <button className="button-primary danger" onClick={confirmRemove}>
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Services;