import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ClientBooking.css';
import {
  FiCalendar,
  FiScissors,
  FiDollarSign,
  FiMapPin,
  FiCheckCircle,
  FiChevronRight,
  FiPlus,
  FiTrendingUp,
  FiStar,
  FiSearch
} from 'react-icons/fi';
import { listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';
import { obterClienteLogado } from '../../../services/authStorage';
import { proximosAgendamentos, gerarRelatorio, formatarMoeda } from '../../../utils/agendamentosCliente';
import { ordenarPorDistancia } from '../../../utils/geo';
import useBarbearias from '../../../hooks/useBarbearias';
import useLocalizacao from '../../../hooks/useLocalizacao';
import AgendamentoItem from '../components/AgendamentoItem/AgendamentoItem';

// Passo 1 do novo agendamento: escolher a barbearia (da mais perto para a mais longe).
// Ao escolher, abre a página da barbearia, onde o cliente vê os serviços e agenda.
function EscolherBarbearia({ barbearias, busca, setBusca, navigate }) {
  const { posicao } = useLocalizacao();
  const ordenadas = useMemo(() => ordenarPorDistancia(barbearias, posicao), [barbearias, posicao]);
  const termo = busca.trim().toLowerCase();
  const lista = ordenadas.filter((b) =>
    !termo || b.name.toLowerCase().includes(termo) || (b.address || '').toLowerCase().includes(termo)
  );

  return (
    <div className="cb-content">
      <h2 className="cb-title">Escolha a barbearia</h2>
      <p className="cb-subtitle">
        {posicao ? 'Ordenadas da mais próxima para a mais distante de você.' : 'Selecione onde você quer ser atendido.'}
      </p>

      <div className="cb-search">
        <FiSearch size={18} />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou endereço"
          aria-label="Buscar barbearia"
        />
      </div>

      {lista.length === 0 ? (
        <p className="cb-muted">Nenhuma barbearia encontrada.</p>
      ) : (
        <div className="cb-grid">
          {lista.map((b) => (
            <button
              type="button"
              key={b.id}
              className="cb-card cb-card--shop"
              onClick={() => navigate(`/cliente/barbearia/${b.id}`)}
            >
              {b.logo
                ? <img src={b.logo} alt="" className="cb-logo" />
                : <div className="cb-card-icon cb-card-icon--round"><FiScissors size={22} /></div>}
              <div className="cb-card-body">
                <h3>
                  {b.name}
                  {!b.real && <span className="cb-demo-badge">Demonstração</span>}
                </h3>
                <p className="cb-card-desc">{b.address}</p>
                <div className="cb-card-meta">
                  <span><FiStar size={14} /> {Number(b.rating).toFixed(1)}</span>
                  {b.distance && <span><FiMapPin size={14} /> {b.distance}</span>}
                </div>
              </div>
              <FiChevronRight size={18} className="cb-card-arrow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ClientBooking = () => {
  const clienteLogado = obterClienteLogado();
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = searchParams.get('aba') === 'novo' ? 'novo' : 'meus';

  // ---- Meus agendamentos / histórico
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);

  // ---- Novo agendamento: primeiro o cliente escolhe a barbearia
  const navigate = useNavigate();
  const { barbearias } = useBarbearias();
  const [busca, setBusca] = useState('');

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

  const irParaAba = (nova) => {
    if (nova === 'novo') setSearchParams({ aba: 'novo' });
    else setSearchParams({});
  };

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

  // ---- Dados da aba "Meus agendamentos"
  const proximos = proximosAgendamentos(agendamentos);
  const proximo = proximos[0];
  const demais = proximos.slice(1, 6);
  const barbeariaReal = barbearias[0];
  const relatorio = gerarRelatorio(agendamentos, { nome: barbeariaReal.name, logo: barbeariaReal.logo });

  const renderMeusAgendamentos = () => (
    <div className="cb-overview">
      <section className="cb-section">
        <h2 className="cb-section-title">Próximo agendamento</h2>
        {carregandoAgendamentos ? (
          <p className="cb-muted">Carregando seus agendamentos...</p>
        ) : proximo ? (
          <AgendamentoItem
            agendamento={proximo}
            destaque
            onCancelar={handleCancelar}
            cancelando={cancelandoId === proximo.id}
          />
        ) : (
          <div className="cb-empty">
            <FiCalendar size={36} />
            <p>Você não tem nenhum agendamento marcado.</p>
            <button type="button" className="cb-btn cb-btn--primary" onClick={() => irParaAba('novo')}>
              <FiPlus size={18} /> Agendar agora
            </button>
          </div>
        )}
      </section>

      {demais.length > 0 && (
        <section className="cb-section">
          <h2 className="cb-section-title">Outros agendamentos</h2>
          <div className="cb-list">
            {demais.map((a) => (
              <AgendamentoItem
                key={a.id}
                agendamento={a}
                onCancelar={handleCancelar}
                cancelando={cancelandoId === a.id}
              />
            ))}
          </div>
        </section>
      )}

      <section className="cb-section">
        <h2 className="cb-section-title">Meu histórico</h2>
        {carregandoAgendamentos ? (
          <p className="cb-muted">Carregando histórico...</p>
        ) : relatorio.visitas === 0 ? (
          <div className="cb-empty">
            <FiTrendingUp size={36} />
            <p>Seus atendimentos concluídos aparecerão aqui, com as barbearias, serviços e valores.</p>
          </div>
        ) : (
          <>
            <div className="cb-stats">
              <div className="cb-stat">
                <span className="cb-stat-icon cb-stat-icon--blue"><FiCheckCircle size={20} /></span>
                <div>
                  <strong>{relatorio.visitas}</strong>
                  <span>{relatorio.visitas === 1 ? 'Atendimento' : 'Atendimentos'}</span>
                </div>
              </div>
              <div className="cb-stat">
                <span className="cb-stat-icon cb-stat-icon--green"><FiDollarSign size={20} /></span>
                <div>
                  <strong>{formatarMoeda(relatorio.totalGasto)}</strong>
                  <span>Total investido</span>
                </div>
              </div>
              <div className="cb-stat">
                <span className="cb-stat-icon cb-stat-icon--purple"><FiTrendingUp size={20} /></span>
                <div>
                  <strong>{formatarMoeda(relatorio.ticketMedio)}</strong>
                  <span>Média por visita</span>
                </div>
              </div>
              <div className="cb-stat">
                <span className="cb-stat-icon cb-stat-icon--orange"><FiStar size={20} /></span>
                <div>
                  <strong>{relatorio.servicoFavorito}</strong>
                  <span>Serviço favorito</span>
                </div>
              </div>
            </div>

            {relatorio.barbearias.map((b) => (
              <div key={b.nome} className="cb-report-card">
                <div className="cb-report-head">
                  <div className="cb-report-shop">
                    {b.logo && <img src={b.logo} alt={`Logo ${b.nome}`} className="cb-logo cb-logo--sm" />}
                    <div>
                    <h3><FiMapPin size={16} /> {b.nome}</h3>
                    <span className="cb-muted">
                      {b.visitas} {b.visitas === 1 ? 'atendimento' : 'atendimentos'}
                      {b.ultima && ` · última visita em ${b.ultima.toLocaleDateString('pt-BR')}`}
                    </span>
                    </div>
                  </div>
                  <strong className="cb-report-total">{formatarMoeda(b.total)}</strong>
                </div>
                <ul className="cb-report-list">
                  {b.servicos.map((s) => (
                    <li key={s.nome}>
                      <span className="cb-report-service"><FiScissors size={14} /> {s.nome}</span>
                      <span className="cb-report-qty">{s.quantidade}x</span>
                      <strong>{formatarMoeda(s.total)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );

  const renderEscolherBarbearia = () => <EscolherBarbearia barbearias={barbearias} busca={busca} setBusca={setBusca} navigate={navigate} />;

  return (
    <div className="client-booking">
      <div className="cb-container">
        <div className="cb-header">
          <h1>Agendamentos</h1>
          <p>Acompanhe seus horários e marque um novo atendimento</p>
        </div>

        <div className="cb-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'meus'}
            className={`cb-tab ${aba === 'meus' ? 'cb-tab--active' : ''}`}
            onClick={() => irParaAba('meus')}
          >
            <FiCalendar size={18} /> Meus agendamentos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'novo'}
            className={`cb-tab ${aba === 'novo' ? 'cb-tab--active' : ''}`}
            onClick={() => irParaAba('novo')}
          >
            <FiPlus size={18} /> Novo agendamento
          </button>
        </div>

        {aba === 'meus' ? renderMeusAgendamentos() : renderEscolherBarbearia()}
      </div>
    </div>
  );
};

export default ClientBooking;
