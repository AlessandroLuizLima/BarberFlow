import React, { useState } from 'react';
import './ClientHome.css';
import { FaMapMarkerAlt, FaBell, FaSearch } from 'react-icons/fa';

function Header(props) {
  return (
    <header className="header">
      <div>
        <h1 className="greeting">{props.greeting}</h1>
        <p className="date">{props.date}</p>
      </div>
      <Button 
        className="notification-btn"
        onClick={props.onNotificationClick}
        ariaLabel="Notificações"
      >
        <FaBell size={24} />
      </Button>
    </header>
  );
}

function SearchBar(props) {
  return (
    <div className="search-container">
      <div className="search-wrapper">
        <FaSearch className="search-icon" size={20} />
        <input
          type="text"
          placeholder={props.placeholder}
          className="search-input"
          value={props.value}
          onChange={props.onChange}
        />
      </div>
    </div>
  );
}

function SectionTitle(props) {
  return <h2 className="section-title">{props.text}</h2>;
}

function BarbershopAvatar(props) {
  return (
    <div className="avatar">
      <div className="avatar-icon">👤</div>
    </div>
  );
}

function BarbershopInfo(props) {
  return (
    <div className="card-info">
      <h3 className="barbershop-name">{props.name}</h3>
      <p className="barbershop-address">{props.address}</p>
    </div>
  );
}

function BarbershopDistance(props) {
  return (
    <div className="card-right">
      <FaMapMarkerAlt size={18} className="location-icon" />
      <span className="distance">{props.distance}</span>
    </div>
  );
}

function BarbershopCard(props) {
  return (
    <div className="barbershop-card" onClick={props.onClick}>
      <div className="card-left">
        <BarbershopAvatar />
        <BarbershopInfo 
          name={props.name}
          address={props.address}
        />
      </div>
      <BarbershopDistance distance={props.distance} />
    </div>
  );
}

function BarbershopList(props) {
  return (
    <div className="barbershop-list">
      {props.barbershops.map((shop) => (
        <BarbershopCard 
          key={shop.id}
          name={shop.name}
          address={shop.address}
          distance={shop.distance}
          onClick={() => props.onCardClick(shop.id)}
        />
      ))}
    </div>
  );
}

function MainContent(props) {
  return (
    <main className="main-content">
      <SectionTitle text={props.title} />
      <BarbershopList 
        barbershops={props.barbershops}
        onCardClick={props.onCardClick}
      />
    </main>
  );
}

function Button(props) {
  return (
    <button 
      type={props.type || "button"}
      className={props.className}
      onClick={props.onClick}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  );
}

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const barbershops = [
    { id: 1, name: 'Barbearia Faustino', address: 'Endereço', distance: '1.2km' },
    { id: 2, name: 'Barbearia 02', address: 'Endereço', distance: '1.6km' },
    { id: 3, name: 'Barbearia 03', address: 'Endereço', distance: '1.8km' },
    { id: 4, name: 'Barbearia 04', address: 'Endereço', distance: '2.3km' },
    { id: 5, name: 'Barbearia 05', address: 'Endereço', distance: '5.2km' }
  ];

  const filteredBarbershops = barbershops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNotificationClick = () => {
    alert('Notificações');
  };

  const handleCardClick = (id) => {
    console.log('Barbearia clicada:', id);
    // Aqui você pode navegar para a página de detalhes da barbearia
  };

  return (
    <div className="home-page">
      <Header 
        greeting="Olá user"
        date="Sábado, 5 Abril 2025"
        onNotificationClick={handleNotificationClick}
      />

      <SearchBar 
        placeholder="Encontrar barbearia"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <MainContent 
        title="Barbearias Mais Próximas"
        barbershops={filteredBarbershops}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default HomePage;