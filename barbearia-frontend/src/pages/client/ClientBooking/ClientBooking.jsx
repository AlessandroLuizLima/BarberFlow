import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ClientBooking.css';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiScissors,
  FiDollarSign,
  FiMapPin,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiPlus,
  FiTrendingUp,
  FiStar,
  FiExternalLink
} from 'react-icons/fi';
import { listarServicos } from '../../../services/servicoService';
import { listarProfissionais } from '../../../services/profissionalService';
import { criarAgendamento, listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';
import { entrarNaListaDeEspera } from '../../../services/listaEsperaService';
import { obterClienteLogado } from '../../../services/authStorage';
import { proximosAgendamentos, gerarRelatorio, formatarMoeda } from '../../../utils/agendamentosCliente';
import { barbearias, BARBEARIA_REAL_ID, linkGoogleMaps } from '../../../data/barbearias';
import AgendamentoItem from '../components/AgendamentoItem/AgendamentoItem';

const barbeariaReal = barbearias.find((b) => b.id === BARBEARIA_REAL_ID);

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const ClientBooking = () => {
  const clienteLogado = obterClienteLogado();
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = searchParams.get('aba') === 'novo' ? 'novo' : 'meus';

  // ---- Meus agendamentos / histórico
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);

  // ---- Novo agendamento (wizard)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroCarregar, setErroCarregar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroAgendamento, setErroAgendamento] = useState('');
  const [conflito, setConflito] = useState(false);
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);
  const [entrouNaFila, setEntrouNaFila] = useState(false);

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

  useEffect(() => {
    Promise.all([listarServicos(), listarProfissionais()])
      .then(([servicosApi, profissionaisApi]) => {
        setServices(servicosApi.filter((s) => s.ativo !== false).map((s) => ({
          id: s.id,
          name: s.nome,
          price: Number(s.preco),
          duration: s.duracao_minutos,
          description: s.descricao
        })));
        setBarbers(profissionaisApi.filter((p) => p.ativo !== false).map((p) => ({
          id: p.id,
          name: p.nome_completo,
          specialty: p.especialidade || 'Barbeiro'
        })));
      })
      .catch((error) => {
        console.error('Erro ao carregar serviços/profissionais:', error);
        setErroCarregar('Não foi possível carregar os serviços e profissionais. Verifique se o backend está rodando.');
      })
      .finally(() => setCarregandoDados(false));
  }, []);

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

  // ---- Calendário
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const selecionarData = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const horarioPassou = (time) => {
    if (!selectedDate) return false;
    const agora = new Date();
    if (selectedDate.toDateString() !== agora.toDateString()) return false;
    const [h, m] = time.split(':').map(Number);
    const slot = new Date(selectedDate);
    slot.setHours(h, m, 0, 0);
    return slot <= agora;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cb-day cb-day--empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = date < today;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          type="button"
          key={day}
          className={`cb-day ${isPast ? 'cb-day--past' : ''} ${isSelected ? 'cb-day--selected' : ''}`}
          onClick={() => !isPast && selecionarData(date)}
          disabled={isPast}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // ---- Navegação do wizard
  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedService !== null;
      case 2: return selectedBarber !== null;
      case 3: return selectedDate !== null && selectedTime !== null;
      default: return false;
    }
  };

  const montarDataHoraISO = () => {
    const [hora, minuto] = selectedTime.split(':').map(Number);
    const dataHora = new Date(selectedDate);
    dataHora.setHours(hora, minuto, 0, 0);
    return dataHora.toISOString();
  };

  const reiniciarWizard = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setConflito(false);
    setEntrouNaFila(false);
    setErroAgendamento('');
    setAgendamentoConfirmado(false);
  };

  const handleConfirm = async () => {
    if (!clienteLogado) {
      setErroAgendamento('Você precisa estar logado para agendar.');
      return;
    }

    setEnviando(true);
    setErroAgendamento('');
    setConflito(false);

    try {
      await criarAgendamento({
        cliente_id: clienteLogado.id,
        profissional_id: selectedBarber,
        servico_id: selectedService,
        data_hora: montarDataHoraISO()
      });
      setAgendamentoConfirmado(true);
      carregarAgendamentos();
    } catch (error) {
      if (error.response?.status === 409) {
        setConflito(true);
      } else {
        setErroAgendamento(error.response?.data?.error || 'Erro ao criar agendamento.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleEntrarNaFila = async () => {
    setEnviando(true);
    try {
      await entrarNaListaDeEspera({
        cliente_id: clienteLogado.id,
        profissional_id: selectedBarber,
        servico_id: selectedService,
        data_desejada: selectedDate.toISOString().slice(0, 10)
      });
      setEntrouNaFila(true);
    } catch (error) {
      setErroAgendamento(error.response?.data?.error || 'Erro ao entrar na lista de espera.');
    } finally {
      setEnviando(false);
    }
  };

  const servicoEscolhido = services.find((s) => s.id === selectedService);
  const barbeiroEscolhido = barbers.find((b) => b.id === selectedBarber);

  const etapas = [
    { n: 1, titulo: 'Serviço' },
    { n: 2, titulo: 'Barbeiro' },
    { n: 3, titulo: 'Data e Hora' },
    { n: 4, titulo: 'Confirmação' }
  ];

  // ---- Dados da aba "Meus agendamentos"
  const proximos = proximosAgendamentos(agendamentos);
  const proximo = proximos[0];
  const demais = proximos.slice(1, 6);
  const relatorio = gerarRelatorio(agendamentos);

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
                  <div>
                    <h3><FiMapPin size={16} /> {b.nome}</h3>
                    <span className="cb-muted">
                      {b.visitas} {b.visitas === 1 ? 'atendimento' : 'atendimentos'}
                      {b.ultima && ` · última visita em ${b.ultima.toLocaleDateString('pt-BR')}`}
                    </span>
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

  const renderWizard = () => (
    <>
      <div className="cb-progress">
        {etapas.map((etapa, i) => (
          <React.Fragment key={etapa.n}>
            {i > 0 && <div className={`cb-step-line ${currentStep >= etapa.n ? 'cb-step-line--active' : ''}`}></div>}
            <div className={`cb-step ${currentStep >= etapa.n ? 'cb-step--active' : ''} ${currentStep > etapa.n ? 'cb-step--done' : ''}`}>
              <div className="cb-step-number">
                {currentStep > etapa.n ? <FiCheck size={16} /> : etapa.n}
              </div>
              <span>{etapa.titulo}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="cb-content">
        {carregandoDados && <p className="cb-muted">Carregando serviços e profissionais...</p>}
        {erroCarregar && <p className="cb-error">{erroCarregar}</p>}

        {!carregandoDados && !erroCarregar && currentStep === 1 && (
          <div>
            <h2 className="cb-title">Escolha o Serviço</h2>
            <p className="cb-subtitle">Selecione o serviço que deseja realizar</p>

            {services.length === 0 ? (
              <p className="cb-muted">Nenhum serviço disponível no momento.</p>
            ) : (
              <div className="cb-grid">
                {services.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    className={`cb-card ${selectedService === service.id ? 'cb-card--selected' : ''}`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="cb-card-icon"><FiScissors size={22} /></div>
                    <div className="cb-card-body">
                      <h3>{service.name}</h3>
                      {service.description && <p className="cb-card-desc">{service.description}</p>}
                      <div className="cb-card-meta">
                        <span><FiClock size={14} /> {service.duration} min</span>
                        <strong>{formatarMoeda(service.price)}</strong>
                      </div>
                    </div>
                    {selectedService === service.id && (
                      <span className="cb-check"><FiCheck size={16} /></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!carregandoDados && !erroCarregar && currentStep === 2 && (
          <div>
            <h2 className="cb-title">Escolha o Barbeiro</h2>
            <p className="cb-subtitle">Selecione o profissional de sua preferência</p>

            {barbers.length === 0 ? (
              <p className="cb-muted">Nenhum profissional disponível no momento.</p>
            ) : (
              <div className="cb-grid">
                {barbers.map((barber) => (
                  <button
                    type="button"
                    key={barber.id}
                    className={`cb-card ${selectedBarber === barber.id ? 'cb-card--selected' : ''}`}
                    onClick={() => setSelectedBarber(barber.id)}
                  >
                    <div className="cb-card-icon cb-card-icon--round"><FiUser size={22} /></div>
                    <div className="cb-card-body">
                      <h3>{barber.name}</h3>
                      <p className="cb-card-desc">{barber.specialty}</p>
                    </div>
                    {selectedBarber === barber.id && (
                      <span className="cb-check"><FiCheck size={16} /></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!carregandoDados && !erroCarregar && currentStep === 3 && (
          <div>
            <h2 className="cb-title">Escolha Data e Horário</h2>
            <p className="cb-subtitle">Selecione quando deseja ser atendido</p>

            <div className="cb-datetime">
              <div className="cb-calendar">
                <div className="cb-calendar-head">
                  <button type="button" onClick={() => navigateMonth(-1)} className="cb-nav-btn" aria-label="Mês anterior">
                    <FiChevronLeft />
                  </button>
                  <h3>
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button type="button" onClick={() => navigateMonth(1)} className="cb-nav-btn" aria-label="Próximo mês">
                    <FiChevronRight />
                  </button>
                </div>

                <div className="cb-weekdays">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="cb-days">{renderCalendar()}</div>
              </div>

              <div className="cb-times">
                <h3>Horários Disponíveis</h3>
                {selectedDate ? (
                  <>
                    <p className="cb-selected-date">{formatDate(selectedDate)}</p>
                    <div className="cb-time-grid">
                      {HORARIOS.map((time) => {
                        const passou = horarioPassou(time);
                        return (
                          <button
                            type="button"
                            key={time}
                            className={`cb-time ${selectedTime === time ? 'cb-time--selected' : ''}`}
                            onClick={() => setSelectedTime(time)}
                            disabled={passou}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="cb-muted">Escolha um dia no calendário para ver os horários.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && agendamentoConfirmado && (
          <div className="cb-success">
            <span className="cb-success-icon"><FiCheckCircle size={48} /></span>
            <h2 className="cb-title">Agendamento confirmado!</h2>
            <p className="cb-subtitle">
              Você receberá uma mensagem de confirmação. Chegue com 5 minutos de antecedência.
            </p>
            <div className="cb-success-actions">
              <button
                type="button"
                className="cb-btn cb-btn--primary"
                onClick={() => { reiniciarWizard(); irParaAba('meus'); }}
              >
                Ver meus agendamentos
              </button>
              <button type="button" className="cb-btn cb-btn--secondary" onClick={reiniciarWizard}>
                Fazer outro agendamento
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && !agendamentoConfirmado && conflito && (
          <div className="cb-success">
            <h2 className="cb-title">Horário indisponível</h2>
            <p className="cb-subtitle">
              Esse horário acabou de ser ocupado por outro cliente para este profissional.
            </p>
            {entrouNaFila ? (
              <p className="cb-info">Você entrou na lista de espera! Avisaremos assim que um horário vagar nesse dia.</p>
            ) : (
              <div className="cb-success-actions">
                <button type="button" className="cb-btn cb-btn--primary" onClick={handleEntrarNaFila} disabled={enviando}>
                  {enviando ? 'Entrando...' : 'Entrar na lista de espera'}
                </button>
                <button
                  type="button"
                  className="cb-btn cb-btn--secondary"
                  onClick={() => { setConflito(false); setCurrentStep(3); }}
                >
                  Escolher outro horário
                </button>
              </div>
            )}
            {erroAgendamento && <p className="cb-error">{erroAgendamento}</p>}
          </div>
        )}

        {currentStep === 4 && !agendamentoConfirmado && !conflito && (
          <div>
            <h2 className="cb-title">Confirmação do Agendamento</h2>
            <p className="cb-subtitle">Revise os detalhes do seu agendamento</p>
            {erroAgendamento && <p className="cb-error">{erroAgendamento}</p>}

            <div className="cb-confirm">
              <div className="cb-confirm-row">
                <div className="cb-confirm-icon"><FiScissors size={22} /></div>
                <div>
                  <h4>Serviço</h4>
                  <p>{servicoEscolhido?.name}</p>
                  <span><FiClock size={14} /> {servicoEscolhido?.duration} minutos</span>
                  <span><FiDollarSign size={14} /> {formatarMoeda(servicoEscolhido?.price || 0)}</span>
                </div>
              </div>

              <div className="cb-confirm-row">
                <div className="cb-confirm-icon"><FiUser size={22} /></div>
                <div>
                  <h4>Barbeiro</h4>
                  <p>{barbeiroEscolhido?.name}</p>
                  <span>{barbeiroEscolhido?.specialty}</span>
                </div>
              </div>

              <div className="cb-confirm-row">
                <div className="cb-confirm-icon"><FiCalendar size={22} /></div>
                <div>
                  <h4>Data e Horário</h4>
                  <p>{selectedDate && formatDate(selectedDate)}</p>
                  <span><FiClock size={14} /> {selectedTime}</span>
                </div>
              </div>

              <div className="cb-confirm-row">
                <div className="cb-confirm-icon"><FiMapPin size={22} /></div>
                <div>
                  <h4>Local</h4>
                  <p>{barbeariaReal.name}</p>
                  <a
                    className="cb-maps-link"
                    href={linkGoogleMaps(barbeariaReal)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiExternalLink size={14} /> Ver no Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="cb-note">
              <FiInfo size={18} />
              <p>Você receberá uma confirmação por mensagem. Por favor, chegue com 5 minutos de antecedência.</p>
            </div>
          </div>
        )}
      </div>

      {!agendamentoConfirmado && (
        <div className="cb-nav">
          {currentStep > 1 && !conflito && (
            <button type="button" className="cb-btn cb-btn--secondary" onClick={handleBack}>
              <FiChevronLeft size={18} /> Voltar
            </button>
          )}

          <div className="cb-spacer"></div>

          {currentStep < 4 ? (
            <button type="button" className="cb-btn cb-btn--primary" onClick={handleNext} disabled={!canProceed()}>
              Próximo <FiChevronRight size={18} />
            </button>
          ) : !conflito ? (
            <button type="button" className="cb-btn cb-btn--primary" onClick={handleConfirm} disabled={enviando}>
              <FiCheck size={18} /> {enviando ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          ) : null}
        </div>
      )}
    </>
  );

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

        {aba === 'meus' ? renderMeusAgendamentos() : renderWizard()}
      </div>
    </div>
  );
};

export default ClientBooking;
