import React, { useState, useEffect } from 'react';
import './ClientBooking.css';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiScissors,
  FiDollarSign,
  FiMapPin,
  FiPhone,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiInfo
} from 'react-icons/fi';
import { listarServicos } from '../../../services/servicoService';
import { listarProfissionais } from '../../../services/profissionalService';
import { criarAgendamento } from '../../../services/agendamentoService';
import { entrarNaListaDeEspera } from '../../../services/listaEsperaService';
import { obterClienteLogado } from '../../../services/authStorage';

const ClientBooking = () => {
  const clienteLogado = obterClienteLogado();

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

  useEffect(() => {
    Promise.all([listarServicos(), listarProfissionais()])
      .then(([servicosApi, profissionaisApi]) => {
        setServices(servicosApi.map((s) => ({
          id: s.id,
          name: s.nome,
          price: Number(s.preco),
          duration: s.duracao_minutos,
          description: s.descricao,
          category: s.descricao || 'Serviço'
        })));
        setBarbers(profissionaisApi.map((p) => ({
          id: p.id,
          name: p.nome_completo,
          specialty: p.especialidade || 'Barbeiro',
          rating: 5,
          totalReviews: 0,
          experience: ''
        })));
      })
      .catch((error) => {
        console.error('Erro ao carregar serviços/profissionais:', error);
        setErroCarregar('Não foi possível carregar os serviços e profissionais. Verifique se o backend está rodando.');
      })
      .finally(() => setCarregandoDados(false));
  }, []);

  const availableTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dias vazios
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = date < today;
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      days.push(
        <button
          key={day}
          className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => !isPast && setSelectedDate(date)}
          disabled={isPast}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedBarber !== null;
      case 3:
        return selectedDate !== null && selectedTime !== null;
      default:
        return false;
    }
  };

  const montarDataHoraISO = () => {
    const [hora, minuto] = selectedTime.split(':').map(Number);
    const dataHora = new Date(selectedDate);
    dataHora.setHours(hora, minuto, 0, 0);
    return dataHora.toISOString();
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

  return (
    <div className="client-booking">
      <div className="container">
        <div className="booking-header">
          <h1>Novo Agendamento</h1>
          <p>Escolha seu serviço, barbeiro e horário preferido</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > 1 ? <FiCheck size={16} /> : '1'}
            </div>
            <span>Serviço</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > 2 ? <FiCheck size={16} /> : '2'}
            </div>
            <span>Barbeiro</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > 3 ? <FiCheck size={16} /> : '3'}
            </div>
            <span>Data e Hora</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span>Confirmação</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="booking-content">
          {carregandoDados && <p>Carregando serviços e profissionais...</p>}
          {erroCarregar && <p className="error-message">{erroCarregar}</p>}

          {!carregandoDados && !erroCarregar && currentStep === 1 && (
            <div className="step-content">
              <h2>Escolha o Serviço</h2>
              <p className="step-description">Selecione o serviço que deseja realizar</p>
              
              <div className="services-grid">
                {services.map(service => (
                  <button
                    key={service.id}
                    className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="service-icon">
                      <FiScissors size={24} />
                    </div>
                    <div className="service-info">
                      <h3>{service.name}</h3>
                      <p className="service-category">{service.category}</p>
                      <p className="service-description">{service.description}</p>
                      <div className="service-details">
                        <span className="service-duration">
                          <FiClock size={14} />
                          {service.duration} min
                        </span>
                        <span className="service-price">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>
                    {selectedService === service.id && (
                      <div className="selected-indicator">
                        <FiCheck size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <h2>Escolha o Barbeiro</h2>
              <p className="step-description">Selecione o profissional de sua preferência</p>
              
              <div className="barbers-grid">
                {barbers.map(barber => (
                  <button
                    key={barber.id}
                    className={`barber-card ${selectedBarber === barber.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBarber(barber.id)}
                  >
                    <div className="barber-avatar">
                      <FiUser size={32} />
                    </div>
                    <div className="barber-info">
                      <h3>{barber.name}</h3>
                      <p className="barber-specialty">{barber.specialty}</p>
                      <div className="barber-rating">
                        <div className="stars">
                          {renderStars(barber.rating)}
                        </div>
                        <span className="rating-text">
                          {barber.rating} ({barber.totalReviews} avaliações)
                        </span>
                      </div>
                      <p className="barber-experience">
                        <FiInfo size={14} />
                        {barber.experience} de experiência
                      </p>
                    </div>
                    {selectedBarber === barber.id && (
                      <div className="selected-indicator">
                        <FiCheck size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h2>Escolha Data e Horário</h2>
              <p className="step-description">Selecione quando deseja ser atendido</p>
              
              <div className="datetime-container">
                <div className="calendar-section">
                  <div className="calendar-header">
                    <button onClick={() => navigateMonth(-1)} className="nav-btn">
                      <FiChevronLeft />
                    </button>
                    <h3>
                      {currentMonth.toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h3>
                    <button onClick={() => navigateMonth(1)} className="nav-btn">
                      <FiChevronRight />
                    </button>
                  </div>
                  
                  <div className="calendar-weekdays">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  
                  <div className="calendar-grid">
                    {renderCalendar()}
                  </div>
                </div>

                {selectedDate && (
                  <div className="time-section">
                    <h3>Horários Disponíveis</h3>
                    <p className="selected-date-text">
                      {formatDate(selectedDate)}
                    </p>
                    <div className="time-slots">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && agendamentoConfirmado && (
            <div className="step-content">
              <h2>Agendamento confirmado!</h2>
              <p className="step-description">
                Você receberá uma mensagem de confirmação. Chegue com 5 minutos de antecedência.
              </p>
            </div>
          )}

          {currentStep === 4 && !agendamentoConfirmado && conflito && (
            <div className="step-content">
              <h2>Horário indisponível</h2>
              <p className="step-description">
                Esse horário acabou de ser ocupado por outro cliente para este profissional.
              </p>
              {entrouNaFila ? (
                <p>Você entrou na lista de espera! Avisaremos assim que um horário vagar nesse dia.</p>
              ) : (
                <button className="nav-button primary" onClick={handleEntrarNaFila} disabled={enviando}>
                  {enviando ? 'Entrando...' : 'Entrar na lista de espera'}
                </button>
              )}
            </div>
          )}

          {currentStep === 4 && !agendamentoConfirmado && !conflito && (
            <div className="step-content">
              <h2>Confirmação do Agendamento</h2>
              <p className="step-description">Revise os detalhes do seu agendamento</p>
              {erroAgendamento && <p className="error-message">{erroAgendamento}</p>}

              <div className="confirmation-card">
                <div className="confirmation-section">
                  <div className="confirmation-icon">
                    <FiScissors size={24} />
                  </div>
                  <div>
                    <h4>Serviço</h4>
                    <p>{services.find(s => s.id === selectedService)?.name}</p>
                    <span className="confirmation-detail">
                      <FiClock size={14} />
                      {services.find(s => s.id === selectedService)?.duration} minutos
                    </span>
                    <span className="confirmation-detail">
                      <FiDollarSign size={14} />
                      {formatCurrency(services.find(s => s.id === selectedService)?.price || 0)}
                    </span>
                  </div>
                </div>

                <div className="confirmation-divider"></div>

                <div className="confirmation-section">
                  <div className="confirmation-icon">
                    <FiUser size={24} />
                  </div>
                  <div>
                    <h4>Barbeiro</h4>
                    <p>{barbers.find(b => b.id === selectedBarber)?.name}</p>
                    <span className="confirmation-detail">
                      {barbers.find(b => b.id === selectedBarber)?.specialty}
                    </span>
                  </div>
                </div>

                <div className="confirmation-divider"></div>

                <div className="confirmation-section">
                  <div className="confirmation-icon">
                    <FiCalendar size={24} />
                  </div>
                  <div>
                    <h4>Data e Horário</h4>
                    <p>{selectedDate && formatDate(selectedDate)}</p>
                    <span className="confirmation-detail">
                      <FiClock size={14} />
                      {selectedTime}
                    </span>
                  </div>
                </div>

                <div className="confirmation-divider"></div>

                <div className="confirmation-section">
                  <div className="confirmation-icon">
                    <FiMapPin size={24} />
                  </div>
                  <div>
                    <h4>Local</h4>
                    <p>Barbearia Estilo Clássico</p>
                    <span className="confirmation-detail">
                      Rua das Flores, 123, Centro
                    </span>
                    <span className="confirmation-detail">
                      <FiPhone size={14} />
                      (11) 99999-9999
                    </span>
                  </div>
                </div>
              </div>

              <div className="confirmation-note">
                <FiInfo size={18} />
                <p>
                  Você receberá uma confirmação por email e SMS. 
                  Por favor, chegue com 5 minutos de antecedência.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!agendamentoConfirmado && (
          <div className="booking-navigation">
            {currentStep > 1 && !conflito && (
              <button className="nav-button secondary" onClick={handleBack}>
                <FiChevronLeft size={20} />
                Voltar
              </button>
            )}

            <div className="nav-spacer"></div>

            {currentStep < 4 ? (
              <button
                className="nav-button primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Próximo
                <FiChevronRight size={20} />
              </button>
            ) : !conflito ? (
              <button
                className="nav-button primary confirm"
                onClick={handleConfirm}
                disabled={enviando}
              >
                <FiCheck size={20} />
                {enviando ? 'Confirmando...' : 'Confirmar Agendamento'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBooking;