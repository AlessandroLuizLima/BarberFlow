import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientHome.css';
import { FaMapMarkerAlt, FaBell, FaSearch } from 'react-icons/fa';
import { obterClienteLogado } from '../../../services/authStorage';
import { listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';

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

function BarbershopAvatar() {
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

function MeusAgendamentos({ agendamentos, carregando, onCancelar, cancelandoId }) {
  const formatarDataHora = (iso) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  if (carregando) return <p className="section-loading">Carregando seus agendamentos...</p>;

  const ativos = agendamentos.filter((a) => a.status !== 'cancelado');

  if (ativos.length === 0) {
    return <p className="section-empty">Você ainda não tem agendamentos.</p>;
  }

  return (
    <div className="meus-agendamentos-list">
      {ativos.map((agendamento) => (
        <div key={agendamento.id} className="agendamento-card">
          <div>
            <strong>{agendamento.servico?.nome}</strong> com {agendamento.profissional?.nome_completo}
            <p>{formatarDataHora(agendamento.data_hora)} — status: {agendamento.status}</p>
          </div>
          {agendamento.status !== 'cancelado' && (
            <button
              className="cancelar-btn"
              onClick={() => onCancelar(agendamento.id)}
              disabled={cancelandoId === agendamento.id}
            >
              {cancelandoId === agendamento.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          )}
        </div>
      ))}
    </div>
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
  const navigate = useNavigate();
  const clienteLogado = obterClienteLogado();
  const primeiroNome = clienteLogado?.nome_completo?.split(' ')[0] || 'visitante';
  const [searchTerm, setSearchTerm] = useState('');
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);

  const carregarAgendamentos = () => {
    if (!clienteLogado) {
      setCarregandoAgendamentos(false);
      return;
    }
    setCarregandoAgendamentos(true);
    listarAgendamentos({ cliente_id: clienteLogado.id })
      .then(setAgendamentos)
      .catch((error) => console.error('Erro ao carregar agendamentos:', error))
      .finally(() => setCarregandoAgendamentos(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregarAgendamentos, [clienteLogado?.id]);

  const handleCancelar = async (id) => {
    setCancelandoId(id);
    try {
      await cancelarAgendamento(id);
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    } finally {
      setCancelandoId(null);
    }
  };

  const barbershops = [
    { id: 1, name: 'BarberFlow', address: 'Sua barbearia', distance: '' },
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

  const handleCardClick = () => {
    navigate('/cliente/agendamentos');
  };

  return (
    <div className="home-page">
      <Header 
        greeting={`Olá, ${primeiroNome}`}
        date={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        onNotificationClick={handleNotificationClick}
      />

      <SearchBar 
        placeholder="Encontrar barbearia"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <SectionTitle text="Meus Agendamentos" />
      <MeusAgendamentos
        agendamentos={agendamentos}
        carregando={carregandoAgendamentos}
        onCancelar={handleCancelar}
        cancelandoId={cancelandoId}
      />

      <MainContent 
        title="Sua Barbearia"
        barbershops={filteredBarbershops}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default HomePage;