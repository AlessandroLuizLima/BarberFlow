// BarberShopDetails/BarberShopDetails.jsx
import React, { useState } from 'react';
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
import './BarberShopDetails.css';

const BarberShopDetails = ({ barbershop, onBack = () => {} }) => {
  const [activeTab, setActiveTab] = useState('servicos');
  const [isFavorite, setIsFavorite] = useState(false);

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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleSchedule = (serviceId) => {
    console.log('Agendar serviço:', serviceId);
    // Implementar lógica de agendamento
  };

  const handleAddToCart = (productId) => {
    console.log('Adicionar ao carrinho:', productId);
    // Implementar lógica de carrinho
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
            services={barbershopData.services} 
            onSchedule={handleSchedule}
          />
        );
      case 'produtos':
        return (
          <BarberProducts 
            products={barbershopData.products}
            onAddToCart={handleAddToCart}
          />
        );
      case 'detalhes':
        return (
          <BarberDetails 
            barbershop={barbershopData.details}
          />
        );
      case 'avaliacao':
        return (
          <BarberAssessment 
            reviews={barbershopData.reviews}
            averageRating={barbershopData.averageRating}
            totalReviews={barbershopData.totalReviews}
          />
        );
      default:
        return (
          <BarberServices 
            services={barbershopData.services}
            onSchedule={handleSchedule}
          />
        );
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
              <button className="header-action-btn">
                <IoLocationSharp size={20} />
              </button>
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
          <div className="barbershop-rating">
            {renderStars(barbershopData.rating)}
          </div>
          <p className="barbershop-address">{barbershopData.address}</p>
        </div>
      </div>

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