import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientHome.css';
import { FaMapMarkerAlt, FaBell, FaSearch } from 'react-icons/fa';
import { obterClienteLogado } from '../../../services/authStorage';
import { listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';
import { proximosAgendamentos } from '../../../utils/agendamentosCliente';
import { linkGoogleMaps } from '../../../data/barbearias';
import useBarbearias from '../../../hooks/useBarbearias';
import AgendamentoItem from '../components/AgendamentoItem/AgendamentoItem';

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

function BarbershopAvatar({ logo, name }) {
  if (logo) {
    return (
      <div className="avatar avatar--logo">
        <img src={logo} alt={`Logo ${name}`} className="avatar-img" />
      </div>
    );
  }
  return (
    <div className="avatar">
      <div className="avatar-icon">✂️</div>
    </div>
  );
}

function BarbershopInfo(props) {
  return (
    <div className="card-info">
      <h3 className="barbershop-name">
        {props.name}
        {!props.real && <span className="demo-badge">Demonstração</span>}
      </h3>
      <p className="barbershop-address">{props.address}</p>
    </div>
  );
}

// O pino abre a localização no Google Maps (e não dispara o clique do card)
function BarbershopDistance({ distance, mapsUrl, name }) {
  return (
    <div className="card-right">
      <a
        className="location-link"
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir ${name} no Google Maps`}
        aria-label={`Abrir ${name} no Google Maps`}
        onClick={(e) => e.stopPropagation()}
      >
        <FaMapMarkerAlt size={18} className="location-icon" />
      </a>
      {distance && <span className="distance">{distance}</span>}
    </div>
  );
}

function BarbershopCard({ shop, onClick }) {
  return (
    <div
      className="barbershop-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      <div className="card-left">
        <BarbershopAvatar logo={shop.logo} name={shop.name} />
        <BarbershopInfo name={shop.name} address={shop.address} real={shop.real} />
      </div>
      <BarbershopDistance distance={shop.distance} mapsUrl={linkGoogleMaps(shop)} name={shop.name} />
    </div>
  );
}

function BarbershopList(props) {
  if (props.barbershops.length === 0) {
    return <p className="section-empty">Nenhuma barbearia encontrada.</p>;
  }
  return (
    <div className="barbershop-list">
      {props.barbershops.map((shop) => (
        <BarbershopCard key={shop.id} shop={shop} onClick={() => props.onCardClick(shop)} />
      ))}
    </div>
  );
}

function MainContent(props) {
  return (
    <main className="main-content">
      <SectionTitle text={props.title} />
      <BarbershopList barbershops={props.barbershops} onCardClick={props.onCardClick} />
    </main>
  );
}

function ProximosAgendamentos({ agendamentos, carregando, onCancelar, cancelandoId }) {
  if (carregando) return <p className="section-loading">Carregando seus agendamentos...</p>;

  const proximos = proximosAgendamentos(agendamentos).slice(0, 5);

  if (proximos.length === 0) {
    return <p className="section-empty">Você não tem agendamentos futuros.</p>;
  }

  return (
    <div className="meus-agendamentos-list">
      {proximos.map((agendamento) => (
        <AgendamentoItem
          key={agendamento.id}
          agendamento={agendamento}
          onCancelar={onCancelar}
          cancelando={cancelandoId === agendamento.id}
        />
      ))}
    </div>
  );
}

function Button(props) {
  return (
    <button
      type={props.type || 'button'}
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

  const { barbearias } = useBarbearias();
  const filteredBarbershops = barbearias.filter((shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNotificationClick = () => {
    navigate('/cliente/agendamentos');
  };

  // Barbearia real: agenda de verdade. As de demonstração abrem a página de detalhes.
  const handleCardClick = (shop) => {
    if (shop.real) {
      navigate('/cliente/agendamentos?aba=novo');
    } else {
      navigate(`/cliente/barbearia/${shop.id}`);
    }
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

      <div className="section-header">
        <SectionTitle text="Próximos agendamentos" />
        <Link to="/cliente/agendamentos" className="section-link">Ver todos</Link>
      </div>
      <ProximosAgendamentos
        agendamentos={agendamentos}
        carregando={carregandoAgendamentos}
        onCancelar={handleCancelar}
        cancelandoId={cancelandoId}
      />

      <MainContent
        title="Barbearias"
        barbershops={filteredBarbershops}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default HomePage;
