// Gestão de serviços do painel: lista, cadastra, edita, ativa/desativa e exclui os serviços
// da barbearia do barbeiro logado (gravados no banco). São os mesmos que os clientes veem.
// Popularidade e agendamentos vêm dos agendamentos reais da barbearia.
import React, { useState, useEffect, useCallback } from "react";
import {
  FiEdit,
  FiTrash2,
  FiX,
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiScissors,
  FiClock,
  FiEye,
  FiEyeOff,
  FiBarChart,
  FiStar,
  FiUsers
} from "react-icons/fi";
import { listarServicos, criarServico, atualizarServico, excluirServico } from "../../../services/servicoService";
import { listarAgendamentos } from "../../../services/agendamentoService";
import "./Services.css";

const FORM_VAZIO = { name: "", price: "", duration: "", description: "" };

const deApi = (s, contagem) => ({
  id: s.id,
  name: s.nome,
  price: Number(s.preco),
  duration: s.duracao_minutos,
  description: s.descricao || "",
  active: s.ativo !== false,
  totalBookings: contagem[s.id] || 0
});

const formatName = (name) =>
  name
    .trim()
    .split(/\s+/)
    .map((word, i) => (i > 0 && /^(de|da|do|das|dos|e|com)$/i.test(word) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");

const formatPrice = (price) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
const formatNumber = (value) => new Intl.NumberFormat("pt-BR").format(value);

const Services = () => {
  const [services, setServices] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [aviso, setAviso] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [sortBy, setSortBy] = useState("name");
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [formService, setFormService] = useState(FORM_VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setErroLista("");
    try {
      const [lista, agendamentos] = await Promise.all([
        listarServicos(),
        listarAgendamentos().catch(() => [])
      ]);
      // Agendamentos que contam (não cancelados) por serviço
      const contagem = {};
      agendamentos.filter((a) => a.status !== "cancelado").forEach((a) => {
        contagem[a.servico_id] = (contagem[a.servico_id] || 0) + 1;
      });
      setServices(lista.map((s) => deApi(s, contagem)));
    } catch (error) {
      setErroLista(error.response?.data?.error || "Não foi possível carregar os serviços.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const mostrarAviso = (texto) => {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3500);
  };

  // Estatísticas
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.active).length;
  const totalBookings = services.reduce((acc, s) => acc + s.totalBookings, 0);
  const popularidade = (s) => (totalBookings > 0 ? Math.round((s.totalBookings / totalBookings) * 100) : 0);
  const mostPopular = services.reduce((prev, cur) => (!prev || cur.totalBookings > prev.totalBookings ? cur : prev), null);
  const averagePrice = activeServices > 0
    ? services.filter((s) => s.active).reduce((acc, s) => acc + s.price, 0) / activeServices
    : 0;

  const filteredServices = services
    .filter((s) => {
      const termo = searchTerm.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(termo) || s.description.toLowerCase().includes(termo);
      const matchesStatus = filterStatus === "todos" || (filterStatus === "ativos" ? s.active : !s.active);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price": return b.price - a.price;
        case "duration": return b.duration - a.duration;
        case "popularity": return b.totalBookings - a.totalBookings;
        default: return a.name.localeCompare(b.name);
      }
    });

  const openAddModal = () => {
    setEditingService(null);
    setFormService(FORM_VAZIO);
    setErroForm("");
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormService({
      name: service.name,
      price: String(service.price),
      duration: String(service.duration),
      description: service.description
    });
    setErroForm("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormService(FORM_VAZIO);
  };

  const openDeleteConfirm = (service) => {
    setServiceToDelete(service);
    setErroForm("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const preco = Number(String(formService.price).replace(",", "."));
    const duracao = parseInt(formService.duration, 10);
    if (formService.name.trim().length < 2) return setErroForm("Informe o nome do serviço.");
    if (formService.price === "" || !Number.isFinite(preco) || preco < 0) return setErroForm("Informe um valor válido.");
    if (!Number.isInteger(duracao) || duracao < 5 || duracao > 600) return setErroForm("A duração deve ser entre 5 e 600 minutos.");

    const dados = {
      nome: formatName(formService.name),
      preco,
      duracao_minutos: duracao,
      descricao: formService.description.trim()
    };

    setSalvando(true);
    setErroForm("");
    try {
      if (editingService) await atualizarServico(editingService.id, dados);
      else await criarServico(dados);
      closeModal();
      mostrarAviso(editingService ? "Serviço atualizado." : "Serviço cadastrado: já aparece para os clientes.");
      carregar();
    } catch (error) {
      setErroForm(error.response?.data?.error || "Não foi possível salvar o serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmRemove = async () => {
    if (!serviceToDelete) return;
    setSalvando(true);
    try {
      await excluirServico(serviceToDelete.id);
      closeDeleteConfirm();
      mostrarAviso("Serviço excluído.");
      carregar();
    } catch (error) {
      setErroForm(error.response?.data?.error || "Não foi possível excluir o serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const toggleServiceStatus = async (service) => {
    try {
      await atualizarServico(service.id, { ativo: !service.active });
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s)));
      mostrarAviso(service.active ? "Serviço desativado: some da página dos clientes." : "Serviço ativado.");
    } catch (error) {
      mostrarAviso(error.response?.data?.error || "Não foi possível alterar o serviço.");
    }
  };

  return (
    <div className="services-page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Gestão de Serviços</h1>
            <p>Os serviços ativos aparecem na página da sua barbearia para os clientes agendarem</p>
          </div>
        </div>

        {aviso && <div className="services-aviso" role="status">{aviso}</div>}

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
              <div className="stat-icon blue"><FiScissors size={24} /></div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Agendamentos</p>
                <p className="stat-number average">{formatNumber(totalBookings)}</p>
                <div className="stat-change positive">
                  <FiUsers size={16} />
                  <span>Preço médio: {formatPrice(averagePrice)}</span>
                </div>
              </div>
              <div className="stat-icon purple"><FiBarChart size={24} /></div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Mais Popular</p>
                <p className="stat-number period">{mostPopular && mostPopular.totalBookings > 0 ? mostPopular.name : "—"}</p>
                <div className="stat-change neutral">
                  <FiStar size={16} />
                  <span>{mostPopular && mostPopular.totalBookings > 0 ? `${popularidade(mostPopular)}% dos agendamentos` : "Sem agendamentos ainda"}</span>
                </div>
              </div>
              <div className="stat-icon red"><FiStar size={24} /></div>
            </div>
          </div>
        </div>

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
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select" aria-label="Filtrar por situação">
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select" aria-label="Ordenar">
                <option value="name">Ordenar por Nome</option>
                <option value="price">Maior Preço</option>
                <option value="duration">Maior Duração</option>
                <option value="popularity">Mais Agendados</option>
              </select>
            </div>

            <button className="add-button" onClick={openAddModal} aria-label="Cadastrar novo serviço">
              <FiPlus size={20} />
              Novo Serviço
            </button>
          </div>
        </div>

        {totalBookings > 0 && (
          <div className="top-services-section">
            <div className="section-header">
              <h2>Serviços Mais Agendados</h2>
              <p>Baseado nos agendamentos da sua barbearia</p>
            </div>
            <div className="top-services-grid">
              {services
                .filter((s) => s.active && s.totalBookings > 0)
                .sort((a, b) => b.totalBookings - a.totalBookings)
                .slice(0, 3)
                .map((service, index) => (
                  <div key={service.id} className={`top-service-card rank-${index + 1}`}>
                    <div className="rank-badge">{index + 1}º</div>
                    <div className="service-category-icon"><FiScissors size={16} /></div>
                    <div className="top-service-info">
                      <h4>{service.name}</h4>
                      <p className="top-service-price">{formatPrice(service.price)}</p>
                      <div className="top-service-stats">
                        <div className="popularity-bar">
                          <div className="popularity-fill" style={{ width: `${popularidade(service)}%` }} />
                        </div>
                        <span className="booking-count">{service.totalBookings} agendamentos</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="services-list" role="list" aria-label="Lista de serviços cadastrados">
          <div className="services-list-header">
            <h2>Lista de Serviços ({filteredServices.length})</h2>
          </div>

          <div className="services-list-content">
            {carregando ? (
              <div className="no-services"><p>Carregando serviços...</p></div>
            ) : erroLista ? (
              <div className="no-services" role="alert">
                <h3>{erroLista}</h3>
                <button type="button" className="button-secondary" onClick={carregar}>Tentar de novo</button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="no-services" role="alert">
                <div className="no-services-icon"><FiScissors size={48} /></div>
                <h3>{searchTerm || filterStatus !== "todos" ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}</h3>
                <p>
                  {searchTerm || filterStatus !== "todos"
                    ? "Tente alterar os filtros ou termos de busca"
                    : "Cadastre seu primeiro serviço: sem serviços, os clientes não conseguem agendar."}
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="service-item" role="listitem">
                  <div className="service-content">
                    <div className="service-left">
                      <div className="service-icon"><FiScissors size={16} /></div>
                      <div className="service-info">
                        <div className="service-name-row">
                          <h3>{service.name}</h3>
                          <span className={`status-badge ${service.active ? "status-active" : "status-inactive"}`}>
                            {service.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {service.description && <p className="service-description">{service.description}</p>}
                        <div className="service-meta">
                          <span className="duration"><FiClock size={14} />{service.duration} min</span>
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
                            <div className="popularity-bar-small" style={{ width: `${popularidade(service)}%` }} />
                            <span>{popularidade(service)}%</span>
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
                          className={`action-button toggle ${service.active ? "active" : "inactive"}`}
                          onClick={() => toggleServiceStatus(service)}
                          title={service.active ? "Desativar serviço" : "Ativar serviço"}
                          aria-label={service.active ? `Desativar ${service.name}` : `Ativar ${service.name}`}
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

        {showModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal">
              <div className="modal-header">
                <h2 id="modal-title">{editingService ? "Editar Serviço" : "Cadastrar Novo Serviço"}</h2>
                <button className="modal-close" onClick={closeModal} aria-label="Fechar modal"><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-content">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="service-name">Nome do Serviço *</label>
                      <input id="service-name" type="text" className="form-input" placeholder="Ex: Corte de Cabelo" name="name" maxLength={100} value={formService.name} onChange={handleInputChange} required autoFocus />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="service-price">Valor (R$) *</label>
                      <input id="service-price" type="number" className="form-input" placeholder="Ex: 35.00" step="0.01" min="0" name="price" value={formService.price} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="service-duration">Duração (minutos) *</label>
                      <input id="service-duration" type="number" className="form-input" placeholder="Ex: 30" min="5" max="600" step="5" name="duration" value={formService.duration} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="service-description">Descrição</label>
                      <input id="service-description" type="text" className="form-input" placeholder="Breve descrição do serviço" name="description" maxLength={255} value={formService.description} onChange={handleInputChange} />
                    </div>
                  </div>
                  {erroForm && <p className="services-erro" role="alert"><FiAlertTriangle size={16} /> {erroForm}</p>}
                </div>

                <div className="modal-footer">
                  <button type="button" className="button-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="button-primary" disabled={salvando}>
                    {salvando ? "Salvando..." : editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="modal modal-delete">
              <div className="modal-header">
                <h2 id="delete-modal-title"><FiAlertTriangle className="alert-icon" aria-hidden="true" /> Confirmar Exclusão</h2>
                <button className="modal-close" onClick={closeDeleteConfirm} aria-label="Fechar modal"><FiX size={20} /></button>
              </div>
              <div className="modal-content">
                <div className="delete-content">
                  <p>Tem certeza que deseja excluir o serviço <strong>{serviceToDelete?.name}</strong>?</p>
                  <div className="delete-warning">
                    <FiAlertTriangle size={16} />
                    <span>Serviços com agendamentos não podem ser excluídos: desative-os (ícone do olho).</span>
                  </div>
                  {erroForm && <p className="services-erro" role="alert"><FiAlertTriangle size={16} /> {erroForm}</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="button-secondary" onClick={closeDeleteConfirm}>Cancelar</button>
                <button className="button-primary danger" onClick={confirmRemove} disabled={salvando}>Confirmar Exclusão</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
