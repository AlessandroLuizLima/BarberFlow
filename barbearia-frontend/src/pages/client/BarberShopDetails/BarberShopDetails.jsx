// BarberShopDetails/BarberShopDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { 
  IoArrowBack,
  IoLocationSharp,
  IoHeart,
  IoHeartOutline,
  IoStar,
  IoCut
} from 'react-icons/io5';
import BarberServices from './BarberServices/BarberServices';
import BarberProducts from './BarberProducts/BarberProducts';
import BarberDetails from './BarberDetails/BarberDetails';
import BarberAssessment from './BarberAssessment/BarberAssessment';
import { linkGoogleMaps } from '../../../data/barbearias';
import useBarbearias from '../../../hooks/useBarbearias';
import { listarServicos } from '../../../services/servicoService';
import { listarProdutosDaBarbearia } from '../../../services/produtoService';
import './BarberShopDetails.css';

const BarberShopDetails = ({ barbershop: barbershopProp, onBack: onBackProp }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buscar, carregando, primeiraReal } = useBarbearias();
  const barbershop = barbershopProp || buscar(id);
  const onBack = onBackProp || (() => navigate('/cliente'));
  const [activeTab, setActiveTab] = useState('servicos');
  const [isFavorite, setIsFavorite] = useState(false);
  const ehReal = Boolean(barbershop?.real);

  const barbeariaId = ehReal ? barbershop.id : null;

  // Barbearia real: os serviços vêm do banco (os mesmos que o barbeiro dela cadastra)
  const [servicosReais, setServicosReais] = useState([]);
  const [carregandoServicos, setCarregandoServicos] = useState(ehReal);
  useEffect(() => {
    if (!barbeariaId) return;
    setCarregandoServicos(true);
    listarServicos(barbeariaId)
      .then((lista) => setServicosReais(lista.filter((s) => s.ativo !== false).map((s) => ({
        id: s.id,
        name: s.nome,
        price: Number(s.preco),
        duration: s.duracao_minutos,
        description: s.descricao
      }))))
      .catch((error) => console.error('Erro ao carregar serviços:', error))
      .finally(() => setCarregandoServicos(false));
  }, [barbeariaId]);

  // Produtos de balcão cadastrados pelo barbeiro (Painel → Produtos)
  const [produtosReais, setProdutosReais] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(ehReal);
  useEffect(() => {
    if (!barbeariaId) return;
    setCarregandoProdutos(true);
    listarProdutosDaBarbearia(barbeariaId)
      .then((lista) => setProdutosReais(lista.map((p) => ({
        id: p.id,
        name: p.nome,
        price: Number(p.preco),
        description: p.descricao,
        category: p.categoria,
        available: p.disponivel
      }))))
      .catch((error) => console.error('Erro ao carregar produtos:', error))
      .finally(() => setCarregandoProdutos(false));
  }, [barbeariaId]);

  // Barbearia inexistente na URL (ou com assinatura vencida): volta para a Home
  if (id && !barbershop) {
    if (carregando) return <div className="barbershop-details-page"><p style={{ padding: 24, color: '#94a3b8' }}>Carregando barbearia...</p></div>;
    return <Navigate to="/cliente" replace />;
  }

  // Dados de exemplo - você deve substituir pelos dados reais
  const barbershopData = barbershop || {
    id: 1,
    name: 'Barbearia Faustino',
    logo: null,
    rating: 5.0,
    address: 'Endereço',
    distance: '1.2km',
    phone: '(47) 99999-9999',
    email: 'contato@faustino.com',
    employees: 3,
    services: [],
    products: [],
    details: {
      address: {
        street: 'Rua Jardim Alegre, 355',
        neighborhood: 'Jardim Zaira',
        city: 'Guarulhos',
        state: 'SP'
      },
      openingHours: [
        { day: 'Segunda-feira', hours: '08:00 - 20:00' },
        { day: 'Terça-feira', hours: '08:00 - 20:00' },
        { day: 'Quarta-feira', hours: '08:00 - 20:00' },
        { day: 'Quinta-feira', hours: '08:00 - 20:00' },
        { day: 'Sexta-feira', hours: '08:00 - 20:00' },
        { day: 'Sábado', hours: '08:00 - 20:00' }
      ],
      paymentMethods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX']
    },
    reviews: [],
    averageRating: 5.0,
    totalReviews: 127
  };

  // Link do Google Maps com o endereço da barbearia
  const linkMaps = linkGoogleMaps(barbershopData);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <IoStar
        key={index}
        size={14}
        className="rating-star"
        color={index < rating ? '#fbbf24' : '#64748b'}
      />
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'servicos':
        return (
          <BarberServices
            services={ehReal ? servicosReais : barbershopData.services}
            real={ehReal}
            carregando={ehReal && carregandoServicos}
            barbeariaId={barbeariaId}
            diasAtendimento={ehReal ? barbershopData.diasAtendimento : undefined}
          />
        );
      case 'produtos':
        return (
          <BarberProducts
            products={ehReal ? produtosReais : barbershopData.products}
            carregando={ehReal && carregandoProdutos}
          />
        );
      case 'detalhes':
        return (
          <BarberDetails
            barbershop={barbershopData.details}
            mapsUrl={linkMaps}
          />
        );
      case 'avaliacao':
        return (
          <BarberAssessment 
            reviews={barbershopData.reviews}
            averageRating={barbershopData.averageRating}
            totalReviews={barbershopData.totalReviews}
            usarExemplos={!ehReal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="barbershop-details-page">
      {/* Header com imagem de fundo */}
      <div className="barbershop-header">
        <img 
          src="https://www.shutterstock.com/image-photo/closeup-black-hair-dryer-hairdresser-600nw-2196301865.jpg" 
          alt="Background" 
          className="header-background"
        />
        <div className="header-content">
          <div className="header-top">
            <button className="back-button" onClick={onBack}>
              <IoArrowBack size={20} />
            </button>
            <div className="header-actions">
              <a
                className="header-action-btn"
                href={linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir no Google Maps"
                aria-label="Abrir localização no Google Maps"
              >
                <IoLocationSharp size={20} />
              </a>
              <button 
                className={`header-action-btn favorite ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
              >
                {isFavorite ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo e informações */}
      <div className="barbershop-info-section">
        <div className="barbershop-logo-container">
          {barbershopData.logo ? (
            <img 
              src={barbershopData.logo} 
              alt={barbershopData.name}
              className="barbershop-logo"
            />
          ) : (
            <div className="barbershop-logo">
              <IoCut size={40} color="#0a0e27" />
            </div>
          )}
        </div>

        <div className="barbershop-title-section">
          <h1 className="barbershop-name">{barbershopData.name}</h1>
          {barbershopData.totalReviews > 0 && (
            <div className="barbershop-rating">
              {renderStars(barbershopData.rating)}
            </div>
          )}
          <p className="barbershop-address">{barbershopData.address}</p>
        </div>
      </div>

      {barbershopData.real === false && (
        <div className="demo-notice">
          Barbearia de demonstração: os dados são fictícios e o agendamento aqui não é salvo.
          {primeiraReal && (
            <>
              {' '}Para agendar de verdade, use uma barbearia sem o selo "Demonstração", como a{' '}
              <button type="button" className="demo-notice-link" onClick={() => navigate(`/cliente/barbearia/${primeiraReal.id}`)}>
                <strong>{primeiraReal.name}</strong>
              </button>.
            </>
          )}
        </div>
      )}

      {/* Tabs de navegação */}
      <div className="barbershop-tabs">
        <button 
          className={`tab-btn ${activeTab === 'servicos' ? 'active' : ''}`}
          onClick={() => setActiveTab('servicos')}
        >
          Serviços
        </button>
        <button 
          className={`tab-btn ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => setActiveTab('produtos')}
        >
          Produtos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'detalhes' ? 'active' : ''}`}
          onClick={() => setActiveTab('detalhes')}
        >
          Detalhes
        </button>
        <button 
          className={`tab-btn ${activeTab === 'avaliacao' ? 'active' : ''}`}
          onClick={() => setActiveTab('avaliacao')}
        >
          Avaliação
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="tab-content-wrapper">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default BarberShopDetails;