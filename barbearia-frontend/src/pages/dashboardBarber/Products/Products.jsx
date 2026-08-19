import React, { useState } from "react";
import { 
  FiEdit, 
  FiTrash2, 
  FiX, 
  FiAlertTriangle,
  FiSearch,
  FiPlus,
  FiPackage,
  FiTrendingUp,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiBarChart,
  FiDollarSign,
  FiShoppingCart,
  FiBox,
  FiFilter
} from "react-icons/fi";
import "./Products.css";

const Products = () => {
  const [products, setProducts] = useState([
    { 
      id: 1, 
      name: "Shampoo Masculino", 
      price: 45.0, 
      quantity: 15,
      category: "cuidados",
      description: "Shampoo para cabelos masculinos",
      cost: 25.0,
      totalSold: 89,
      active: true
    },
    { 
      id: 2, 
      name: "Pomada Modeladora", 
      price: 35.0, 
      quantity: 8,
      category: "styling",
      description: "Pomada para modelar cabelo",
      cost: 18.0,
      totalSold: 156,
      active: true
    },
    { 
      id: 3, 
      name: "Óleo para Barba", 
      price: 28.0, 
      quantity: 12,
      category: "barba",
      description: "Óleo nutritivo para barba",
      cost: 15.0,
      totalSold: 234,
      active: true
    },
    {
      id: 4,
      name: "Cera Fixadora",
      price: 32.0,
      quantity: 3,
      category: "styling",
      description: "Cera para fixação forte",
      cost: 20.0,
      totalSold: 67,
      active: false
    },
    {
      id: 5,
      name: "Condicionador",
      price: 38.0,
      quantity: 0,
      category: "cuidados",
      description: "Condicionador hidratante",
      cost: 22.0,
      totalSold: 45,
      active: true
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [sortBy, setSortBy] = useState("name");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formProduct, setFormProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "cuidados",
    description: "",
    cost: ""
  });

  const categories = [
    { key: "todos", label: "Todos", icon: FiBarChart },
    { key: "cuidados", label: "Cuidados", icon: FiPackage },
    { key: "styling", label: "Styling", icon: FiBox },
    { key: "barba", label: "Barba", icon: FiPackage },
    { key: "acessorios", label: "Acessórios", icon: FiBox }
  ];

  // Calcular estatísticas
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const totalInventoryValue = products.reduce((acc, product) => acc + (product.price * product.quantity), 0);
  const totalRevenue = products.reduce((acc, product) => acc + (product.price * product.totalSold), 0);
  const lowStockCount = products.filter(p => p.quantity <= 5 && p.active).length;
  const outOfStockCount = products.filter(p => p.quantity === 0 && p.active).length;
  const averagePrice = products.length > 0 ? products.reduce((acc, product) => acc + product.price, 0) / products.length : 0;

  // Filtros e ordenação
  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "todos" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return b.price - a.price;
        case "quantity":
          return b.quantity - a.quantity;
        case "sold":
          return b.totalSold - a.totalSold;
        case "profit":
          return (b.price - (b.cost || 0)) - (a.price - (a.cost || 0));
        default:
          return 0;
      }
    });
  };

  const filteredProducts = getFilteredAndSortedProducts();

  const formatName = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const openAddModal = () => {
    setEditingProduct(null);
    setFormProduct({ 
      name: "", 
      price: "", 
      quantity: "", 
      category: "cuidados",
      description: "",
      cost: ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormProduct({
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      description: product.description || "",
      cost: product.cost?.toString() || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormProduct({ 
      name: "", 
      price: "", 
      quantity: "", 
      category: "cuidados",
      description: "",
      cost: ""
    });
    setFormErrors({});
  };

  const openDeleteConfirm = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setProductToDelete(null);
    setShowDeleteConfirm(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formProduct.name.trim()) {
      errors.name = "Nome do produto é obrigatório";
    }

    if (!formProduct.price || parseFloat(formProduct.price) <= 0) {
      errors.price = "Preço deve ser maior que zero";
    }

    if (!formProduct.quantity || parseInt(formProduct.quantity) < 0) {
      errors.quantity = "Quantidade não pode ser negativa";
    }

    if (formProduct.cost && parseFloat(formProduct.cost) < 0) {
      errors.cost = "Custo não pode ser negativo";
    }

    if (formProduct.cost && formProduct.price && parseFloat(formProduct.cost) >= parseFloat(formProduct.price)) {
      errors.cost = "Custo deve ser menor que o preço de venda";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormProduct((prev) => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário digita
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formattedName = formatName(formProduct.name);

    const productData = {
      name: formattedName,
      price: parseFloat(formProduct.price),
      quantity: parseInt(formProduct.quantity, 10),
      category: formProduct.category,
      description: formProduct.description || "",
      cost: parseFloat(formProduct.cost) || 0,
      totalSold: editingProduct ? editingProduct.totalSold : Math.floor(Math.random() * 100) + 10,
      active: editingProduct ? editingProduct.active : true
    };

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, ...productData }
            : p
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...productData
        },
      ]);
    }
    closeModal();
  };

  const confirmRemove = () => {
    if (productToDelete) {
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      closeDeleteConfirm();
    }
  };

  const toggleProductStatus = (productId) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, active: !product.active }
          : product
      )
    );
  };

  const toggleValuesVisibility = () => {
    setShowValues(prev => !prev);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'produtos-barbearia.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    const IconComponent = categoryData ? categoryData.icon : FiPackage;
    return <IconComponent size={16} />;
  };

  const getStockStatus = (quantity, active) => {
    if (!active) return { status: 'inactive', label: 'Inativo', color: '#6b7280' };
    if (quantity === 0) return { status: 'out', label: 'Fora de Estoque', color: '#ef4444' };
    if (quantity <= 5) return { status: 'low', label: 'Estoque Baixo', color: '#f59e0b' };
    return { status: 'normal', label: 'Em Estoque', color: '#10b981' };
  };

  return (
    <div className="products-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Gestão de Produtos</h1>
            <p>Configure e gerencie todos os produtos da barbearia</p>
          </div>
          <div className="header-actions">
            <button 
              className="visibility-toggle" 
              onClick={toggleValuesVisibility}
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <FiEye size={18} /> : <FiEyeOff size={18} />}
            </button>
            <button 
              className="action-btn" 
              onClick={exportData}
              title="Exportar dados"
            >
              <FiDownload size={18} />
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Total de Produtos</p>
                <p className="stat-number total">{totalProducts}</p>
                <div className="stat-change neutral">
                  <FiPackage size={16} />
                  <span>{activeProducts} ativos</span>
                </div>
              </div>
              <div className="stat-icon blue">
                <FiPackage size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Valor do Estoque</p>
                <p className="stat-number new">{formatPrice(totalInventoryValue)}</p>
                <div className="stat-change positive">
                  <FiDollarSign size={16} />
                  <span>Médio: {formatPrice(averagePrice)}</span>
                </div>
              </div>
              <div className="stat-icon green">
                <FiDollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Receita Total</p>
                <p className="stat-number average">{formatPrice(totalRevenue)}</p>
                <div className="stat-change positive">
                  <FiTrendingUp size={16} />
                  <span>Vendas realizadas</span>
                </div>
              </div>
              <div className="stat-icon purple">
                <FiTrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card" tabIndex={0}>
            <div className="stat-card-content">
              <div>
                <p>Alertas de Estoque</p>
                <p className="stat-number period">{lowStockCount + outOfStockCount}</p>
                <div className="stat-change negative">
                  <FiAlertTriangle size={16} />
                  <span>{outOfStockCount} sem estoque</span>
                </div>
              </div>
              <div className="stat-icon red">
                <FiAlertTriangle size={24} />
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
                placeholder="Buscar produtos por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar produtos"
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
                <option value="quantity">Maior Estoque</option>
                <option value="sold">Mais Vendido</option>
                <option value="profit">Maior Margem</option>
              </select>
            </div>

            <button 
              className="add-button" 
              onClick={openAddModal}
              aria-label="Cadastrar novo produto"
            >
              <FiPlus size={20} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Top Produtos */}
        <div className="top-products-section">
          <div className="section-header">
            <h2>Produtos Mais Vendidos</h2>
            <p>Baseado no número total de vendas</p>
          </div>
          <div className="top-products-grid">
            {products
              .filter(product => product.active)
              .sort((a, b) => b.totalSold - a.totalSold)
              .slice(0, 3)
              .map((product, index) => (
                <div key={product.id} className={`top-product-card rank-${index + 1}`}>
                  <div className="rank-badge">{index + 1}º</div>
                  <div className="product-category-icon">
                    {getCategoryIcon(product.category)}
                  </div>
                  <div className="top-product-info">
                    <h4>{product.name}</h4>
                    <p className="top-product-price">{formatPrice(product.price)}</p>
                    <div className="top-product-stats">
                      <div className="profit-margin">
                        <span className="stat-label">Margem:</span>
                        <span className="profit-value">
                          {formatPrice(product.price - (product.cost || 0))}
                        </span>
                      </div>
                      <div className="stock-info">
                        <span className="stat-label">Estoque:</span>
                        <span className="stock-value">{product.quantity} un.</span>
                      </div>
                      <span className="sales-count">{product.totalSold} vendidos</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="products-list" role="list" aria-label="Lista de produtos cadastrados">
          <div className="products-list-header">
            <h2>Lista de Produtos ({filteredProducts.length})</h2>
          </div>
          
          <div className="products-list-content">
            {filteredProducts.length === 0 ? (
              <div className="no-products" role="alert">
                <div className="no-products-icon">
                  <FiPackage size={48} />
                </div>
                <h3>
                  {searchTerm || filterCategory !== "todos"
                    ? "Nenhum produto encontrado"
                    : "Nenhum produto cadastrado"}
                </h3>
                <p>
                  {searchTerm || filterCategory !== "todos"
                    ? "Tente alterar os filtros ou termos de busca"
                    : "Cadastre seu primeiro produto para começar"}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.active);
                const profitMargin = product.price - (product.cost || 0);
                
                return (
                  <div key={product.id} className="product-item" role="listitem">
                    <div className="product-content">
                      <div className="product-left">
                        <div className="product-icon">
                          {getCategoryIcon(product.category)}
                        </div>
                        <div className="product-info">
                          <div className="product-name-row">
                            <h3>{product.name}</h3>
                            <span 
                              className={`status-badge status-${stockStatus.status}`}
                              style={{ color: stockStatus.color }}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                          <p className="product-description">{product.description}</p>
                          <div className="product-meta">
                            <span className="category">
                              {categories.find(cat => cat.key === product.category)?.label}
                            </span>
                            <span className="sold-count">
                              <FiShoppingCart size={14} />
                              {product.totalSold} vendidos
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="product-right">
                        <div className="product-stats">
                          <div className="stat-item">
                            <span className="stat-label">Preço</span>
                            <span className="stat-value primary">{formatPrice(product.price)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Estoque</span>
                            <span className="stat-value">{formatNumber(product.quantity)} un.</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Margem</span>
                            <span className="stat-value profit">{formatPrice(profitMargin)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Valor Total</span>
                            <span className="stat-value">{formatPrice(product.price * product.quantity)}</span>
                          </div>
                        </div>
                        
                        <div className="product-actions">
                          <button
                            type="button"
                            className={`action-button toggle ${product.active ? 'active' : 'inactive'}`}
                            onClick={() => toggleProductStatus(product.id)}
                            title={product.active ? 'Desativar produto' : 'Ativar produto'}
                          >
                            {product.active ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                          </button>
                          <button
                            type="button"
                            className="action-button edit"
                            onClick={() => openEditModal(product)}
                            title={`Editar produto ${product.name}`}
                            aria-label={`Editar produto ${product.name}`}
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-button delete"
                            onClick={() => openDeleteConfirm(product)}
                            title={`Remover produto ${product.name}`}
                            aria-label={`Remover produto ${product.name}`}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal">
              <div className="modal-header">
                <h2 id="modal-title">
                  {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
                </h2>
                <button className="modal-close" onClick={closeModal} aria-label="Fechar modal">
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="product-name">
                        Nome do Produto *
                      </label>
                      <input
                        id="product-name"
                        type="text"
                        className={`form-input ${formErrors.name ? 'error' : ''}`}
                        placeholder="Ex: Shampoo Masculino"
                        name="name"
                        value={formProduct.name}
                        onChange={handleInputChange}
                        required
                        autoFocus
                      />
                      {formErrors.name && (
                        <small className="error-message">{formErrors.name}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="product-category">
                        Categoria *
                      </label>
                      <select
                        id="product-category"
                        className={`form-input ${formErrors.category ? 'error' : ''}`}
                        name="category"
                        value={formProduct.category}
                        onChange={handleInputChange}
                        required
                      >
                        {categories.slice(1).map(category => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <small className="error-message">{formErrors.category}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="product-price">
                        Preço de Venda (R$) *
                      </label>
                      <input
                        id="product-price"
                        type="number"
                        className={`form-input ${formErrors.price ? 'error' : ''}`}
                        placeholder="Ex: 45.00"
                        step="0.01"
                        min="0"
                        name="price"
                        value={formProduct.price}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.price && (
                        <small className="error-message">{formErrors.price}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="product-cost">
                        Custo (R$)
                      </label>
                      <input
                        id="product-cost"
                        type="number"
                        className={`form-input ${formErrors.cost ? 'error' : ''}`}
                        placeholder="Ex: 25.00"
                        step="0.01"
                        min="0"
                        name="cost"
                        value={formProduct.cost}
                        onChange={handleInputChange}
                      />
                      {formErrors.cost && (
                        <small className="error-message">{formErrors.cost}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="product-quantity">
                        Quantidade em Estoque *
                      </label>
                      <input
                        id="product-quantity"
                        type="number"
                        className={`form-input ${formErrors.quantity ? 'error' : ''}`}
                        placeholder="Ex: 15"
                        min="0"
                        name="quantity"
                        value={formProduct.quantity}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.quantity && (
                        <small className="error-message">{formErrors.quantity}</small>
                      )}
                    </div>

                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="product-description">
                        Descrição
                      </label>
                      <input
                        id="product-description"
                        type="text"
                        className={`form-input ${formErrors.description ? 'error' : ''}`}
                        placeholder="Breve descrição do produto"
                        name="description"
                        value={formProduct.description}
                        onChange={handleInputChange}
                        maxLength={200}
                      />
                      {formErrors.description && (
                        <small className="error-message">{formErrors.description}</small>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="button-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="button-primary">
                    {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
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
                    Tem certeza que deseja excluir o produto <strong>{productToDelete?.name}</strong>?
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

export default Products;