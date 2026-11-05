import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientHome.css';
import { FaMapMarkerAlt, FaBell, FaSearch, FaLocationArrow, FaDirections } from 'react-icons/fa';
import { obterClienteLogado } from '../../../services/authStorage';
import { listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';
import { proximosAgendamentos } from '../../../utils/agendamentosCliente';
import { linkGoogleMaps, destinoNoMaps } from '../../../data/barbearias';
import useBarbearias from '../../../hooks/useBarbearias';
import useLocalizacao from '../../../hooks/useLocalizacao';
import { ordenarPorDistancia, linkRotaGoogleMaps } from '../../../utils/geo';
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

// Destaque da barbearia mais próxima do cliente
function BarbeariaMaisProxima({ shop, origem, onAgendar }) {
  return (
    <section className="nearest-card" aria-label="Barbearia mais próxima">
      <div className="nearest-header">
        <span className="nearest-label"><FaLocationArrow size={12} /> Mais próxima de você</span>
        <span className="nearest-distance">{shop.distance}</span>
      </div>
      <div className="nearest-body">
        <BarbershopAvatar logo={shop.logo} name={shop.name} />
        <BarbershopInfo name={shop.name} address={shop.address} real={shop.real} />
      </div>
      <div className="nearest-actions">
        <button type="button" className="nearest-btn nearest-btn--primary" onClick={() => onAgendar(shop)}>
          {shop.real ? 'Agendar agora' : 'Ver barbearia'}
        </button>
        <a
          className="nearest-btn"
          href={linkRotaGoogleMaps(origem, destinoNoMaps(shop))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDirections size={16} /> Como chegar
        </a>
      </div>
    </section>
  );
}

// Mensagem sobre a localização: carregando, negada, usando o endereço cadastrado...
function StatusLocalizacao({ status, origem, onTentarDeNovo }) {
  if (status === 'carregando') {
    return <p className="location-status">Buscando sua localização para mostrar as barbearias mais próximas...</p>;
  }
  if (origem === 'navegador') return null;

  const motivo = {
    negada: 'Você não permitiu o acesso à localização (dá para liberar no ícone de cadeado da barra de endereço).',
    indisponivel: 'Seu navegador não oferece localização nesta página.',
    erro: 'Não foi possível obter sua localização agora.'
  }[status] || '';

  return (
    <div className="location-status location-status--aviso">
      <span>
        {motivo}{' '}
        {origem === 'endereco'
          ? 'As distâncias foram calculadas a partir do seu endereço cadastrado.'
          : 'Ative a localização (ou cadastre seu CEP nas Configurações) para ver a barbearia mais próxima.'}
      </span>
      {status !== 'indisponivel' && (
        <button type="button" className="location-retry" onClick={onTentarDeNovo}>
          <FaLocationArrow size={12} /> Usar minha localização
        </button>
      )}
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
  const localizacao = useLocalizacao();

  // Com a posição do cliente, a lista fica da mais perto para a mais longe (com a distância em cada card)
  const barbeariasOrdenadas = useMemo(
    () => ordenarPorDistancia(barbearias, localizacao.posicao),
    [barbearias, localizacao.posicao]
  );
  const maisProxima = barbeariasOrdenadas.find((shop) => Number.isFinite(shop.distanciaKm)) || null;

  const termo = searchTerm.trim().toLowerCase();
  const filteredBarbershops = barbeariasOrdenadas.filter((shop) =>
    !termo ||
    shop.name.toLowerCase().includes(termo) ||
    (shop.address || '').toLowerCase().includes(termo)
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNotificationClick = () => {
    navigate('/cliente/agendamentos');
  };

  // Todas as barbearias abrem a mesma página (serviços, produtos, detalhes, avaliação).
  // Na barbearia real o agendamento é gravado de verdade; nas de demonstração é simulado.
  const handleCardClick = (shop) => {
    navigate(`/cliente/barbearia/${shop.id}`);
  };

  return (
    <div className="home-page">
      <Header
        greeting={`Olá, ${primeiroNome}`}
        date={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        onNotificationClick={handleNotificationClick}
      />

      <SearchBar
        placeholder="Encontrar barbearia por nome ou endereço"
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

      <StatusLocalizacao
        status={localizacao.status}
        origem={localizacao.origem}
        onTentarDeNovo={localizacao.solicitar}
      />

      {maisProxima && !termo && (
        <BarbeariaMaisProxima shop={maisProxima} origem={localizacao.posicao} onAgendar={handleCardClick} />
      )}

      <MainContent
        title={maisProxima ? 'Barbearias perto de você' : 'Barbearias'}
        barbershops={filteredBarbershops}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default HomePage;
