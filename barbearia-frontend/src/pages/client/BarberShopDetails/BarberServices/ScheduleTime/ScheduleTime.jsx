// ScheduleTime.jsx
// Modal de agendamento da página da barbearia.
// - Barbearia real (real = true): barbeiros, horários livres e confirmação vêm da API.
//   Os dias seguem os dias de atendimento das Configurações e os horários respeitam
//   expediente, duração do serviço e agendamentos já marcados. Dia lotado = lista de espera.
// - Barbearias de demonstração: tudo simulado, nada é gravado.
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoCalendar, IoTime, IoPerson, IoClose, IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoAlertCircle
} from "react-icons/io5";
import { listarProfissionais } from "../../../../../services/profissionalService";
import { criarAgendamento, consultarDisponibilidade } from "../../../../../services/agendamentoService";
import { entrarNaListaDeEspera } from "../../../../../services/listaEsperaService";
import { obterClienteLogado } from "../../../../../services/authStorage";
import { urlImagem } from "../../../../../services/api";
import "./ScheduleTime.css";

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Dados das barbearias de demonstração
const BARBEIROS_DEMO = [
  { id: 1, name: 'João Silva', avatar: '👨', rating: 4.9, services: 127 },
  { id: 2, name: 'Pedro Santos', avatar: '👨‍🦱', rating: 4.8, services: 98 },
  { id: 3, name: 'Carlos Souza', avatar: '👨‍🦰', rating: 4.7, services: 85 },
  { id: 4, name: 'Rafael Lima', avatar: '👨‍🦲', rating: 4.9, services: 156 }
];
const HORARIOS_DEMO = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

// "Ocupado" fixo por dia/horário na demonstração (antes era aleatório e mudava a cada clique)
const ocupadoNaDemo = (date, time) => {
  const texto = `${date.toDateString()}-${time}`;
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 997;
  return h % 10 < 3;
};

const diaISO = (date) => date.toLocaleDateString('en-CA'); // AAAA-MM-DD no horário local

const iniciais = (nome) =>
  String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

const ScheduleTime = ({
  isOpen,
  onClose,
  service,
  real = false,
  barbeariaId,
  diasAtendimento,
  serviceName = service?.name || "Corte de Cabelo",
  servicePrice = service ? `R$ ${Number(service.price).toFixed(2).replace('.', ',')}` : "R$ 45,00",
  serviceDuration = service?.duration ? `${service.duration}min` : "45min"
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entrouNaFila, setEntrouNaFila] = useState(false);
  const [erro, setErro] = useState('');

  // Barbearia real
  const [barbeirosApi, setBarbeirosApi] = useState([]);
  const [disponibilidade, setDisponibilidade] = useState(null);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  // Começa do zero sempre que o modal abre (ex.: outro serviço)
  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedBarber(null);
    setShowSuccess(false);
    setEntrouNaFila(false);
    setErro('');
    setDisponibilidade(null);
    setCurrentMonth(new Date());
  }, [isOpen, service?.id]);

  useEffect(() => {
    if (!isOpen || !real || !barbeariaId) return;
    listarProfissionais(barbeariaId)
      .then((lista) => setBarbeirosApi(lista.filter((p) => p.ativo !== false).map((p) => ({
        id: p.id,
        name: p.nome_completo,
        specialty: p.especialidade || 'Barbeiro',
        foto: p.foto_url ? urlImagem(p.foto_url) : null
      }))))
      .catch(() => setErro('Não foi possível carregar os barbeiros. Verifique sua conexão.'));
  }, [isOpen, real, barbeariaId]);

  const carregarHorarios = useCallback((date) => {
    if (!real || !date || !service?.id) return;
    setCarregandoHorarios(true);
    consultarDisponibilidade({ data: diaISO(date), servico_id: service.id })
      .then(setDisponibilidade)
      .catch(() => setErro('Não foi possível carregar os horários deste dia.'))
      .finally(() => setCarregandoHorarios(false));
  }, [real, service?.id]);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // ---------- Calendário ----------
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay()
    };
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isDateDisabled = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (real && Array.isArray(diasAtendimento) && diasAtendimento.length > 0) {
      return !diasAtendimento.includes(DIAS_SEMANA[date.getDay()]);
    }
    return date.getDay() === 0; // demonstração: fecha aos domingos
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const mudarMes = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta));
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedBarber(null);
    setDisponibilidade(null);
  };

  const handleDateSelect = (day) => {
    if (isDateDisabled(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedBarber(null);
    setErro('');
    setEntrouNaFila(false);
    setDisponibilidade(null);
    carregarHorarios(date);
  };

  // ---------- Horários e barbeiros ----------
  const horarios = real
    ? (disponibilidade?.horarios || []).map((h) => ({ hora: h.hora, livres: h.profissionais }))
    : HORARIOS_DEMO.map((hora) => ({ hora, livres: selectedDate && ocupadoNaDemo(selectedDate, hora) ? [] : null }));

  const horarioEscolhido = horarios.find((h) => h.hora === selectedTime);
  const barbeiros = real ? barbeirosApi : BARBEIROS_DEMO;
  const barbeiroLivre = (id) => !real || !horarioEscolhido || horarioEscolhido.livres.includes(id);

  // Dia sem nenhum horário livre (com expediente) -> oferecer lista de espera
  const diaLotado = real && disponibilidade?.aberto && horarios.length > 0 && horarios.every((h) => h.livres.length === 0);
  const semHorariosHoje = real && disponibilidade?.aberto && horarios.length === 0;

  const handleTimeSelect = (hora) => {
    setSelectedTime(hora);
    setErro('');
    // Se o barbeiro escolhido não está livre no novo horário, desmarca
    const slot = horarios.find((h) => h.hora === hora);
    if (real && selectedBarber && slot && !slot.livres.includes(selectedBarber)) setSelectedBarber(null);
  };

  // ---------- Ações ----------
  const montarDataHora = () => {
    const [h, m] = selectedTime.split(':').map(Number);
    const data = new Date(selectedDate);
    data.setHours(h, m, 0, 0);
    return data.toISOString();
  };

  const confirmarDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    }, 1000);
  };

  const confirmarReal = async () => {
    const cliente = obterClienteLogado();
    if (!cliente) {
      setErro('Faça login para agendar.');
      return;
    }
    setIsSubmitting(true);
    setErro('');
    try {
      await criarAgendamento({
        cliente_id: cliente.id,
        profissional_id: selectedBarber,
        servico_id: service.id,
        data_hora: montarDataHora()
      });
      setShowSuccess(true);
    } catch (error) {
      if (error.response?.status === 409) {
        setErro('Esse horário acabou de ser ocupado. Escolha outro horário ou outro barbeiro.');
        setSelectedTime(null);
        carregarHorarios(selectedDate);
      } else {
        setErro(error.response?.data?.error || 'Não foi possível confirmar o agendamento.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const entrarNaFila = async () => {
    const cliente = obterClienteLogado();
    if (!cliente) {
      setErro('Faça login para entrar na lista de espera.');
      return;
    }
    setIsSubmitting(true);
    setErro('');
    try {
      await entrarNaListaDeEspera({
        cliente_id: cliente.id,
        profissional_id: selectedBarber,
        servico_id: service.id,
        data_desejada: diaISO(selectedDate)
      });
      setEntrouNaFila(true);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível entrar na lista de espera.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canConfirm = diaLotado
    ? Boolean(selectedDate && selectedBarber)
    : Boolean(selectedDate && selectedTime && selectedBarber && barbeiroLivre(selectedBarber));

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (!real) return confirmarDemo();
    return diaLotado ? entrarNaFila() : confirmarReal();
  };

  if (!isOpen) return null;

  const mostrarBarbeiros = selectedDate && (selectedTime || diaLotado);
  const nomeBarbeiro = barbeiros.find((b) => b.id === selectedBarber)?.name;

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="schedule-modal-header">
          <div className="schedule-header-content">
            <h2 className="schedule-modal-title">Agendar Horário</h2>
            <p className="schedule-modal-subtitle">
              Escolha a data, horário e barbeiro para seu atendimento
            </p>
          </div>
          <button className="schedule-close-button" onClick={onClose} aria-label="Fechar">
            <IoClose />
          </button>
        </div>

        {/* Service Info */}
        <div className="schedule-service-info">
          <div className="service-info-icon">
            <IoTime />
          </div>
          <div className="service-info-details">
            <span className="service-info-name">{serviceName}</span>
            <div className="service-info-meta">
              <span className="service-info-price">{servicePrice}</span>
              <span className="service-info-duration">• {serviceDuration}</span>
            </div>
          </div>
        </div>

        {showSuccess && real ? (
          <div className="schedule-modal-body">
            <div className="schedule-done">
              <IoCheckmarkCircle className="schedule-done-icon" />
              <h3>Agendamento confirmado!</h3>
              <p>
                {formatDate(selectedDate)} às {selectedTime} com {nomeBarbeiro}.
                Você vai receber a confirmação por e-mail e um lembrete 2 horas antes.
              </p>
              <div className="schedule-footer-buttons">
                <button className="schedule-button-secondary" onClick={onClose}>Fechar</button>
                <button className="schedule-button-primary" onClick={() => navigate('/cliente/agendamentos')}>
                  Ver meus agendamentos
                </button>
              </div>
            </div>
          </div>
        ) : entrouNaFila ? (
          <div className="schedule-modal-body">
            <div className="schedule-done">
              <IoCheckmarkCircle className="schedule-done-icon" />
              <h3>Você entrou na lista de espera</h3>
              <p>Se um horário vagar em {formatDate(selectedDate)}, avisamos você por e-mail na hora.</p>
              <div className="schedule-footer-buttons">
                <button className="schedule-button-primary" onClick={onClose}>Fechar</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Form Content */}
            <div className="schedule-modal-body">
              {/* Date Selection */}
              <div className="schedule-form-group">
                <label className="schedule-label">
                  <IoCalendar className="label-icon" />
                  Selecione a data
                </label>

                <div className="schedule-month-controls">
                  <button onClick={() => mudarMes(-1)} className="month-nav-button" aria-label="Mês anterior">
                    <IoChevronBack />
                  </button>
                  <span className="month-display">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => mudarMes(1)} className="month-nav-button" aria-label="Próximo mês">
                    <IoChevronForward />
                  </button>
                </div>

                <div className="schedule-calendar">
                  <div className="calendar-weekdays">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                  </div>

                  <div className="time-days">
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="time-day-empty" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSelected = selectedDate &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === currentMonth.getMonth();
                      const isDisabled = isDateDisabled(day);

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateSelect(day)}
                          disabled={isDisabled}
                          className={`time-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="schedule-date-display">
                    {formatDate(selectedDate)}
                  </div>
                )}
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="schedule-form-group">
                  <label className="schedule-label">
                    <IoTime className="label-icon" />
                    Escolha o horário
                  </label>

                  {carregandoHorarios ? (
                    <p className="schedule-hint">Buscando horários livres...</p>
                  ) : semHorariosHoje ? (
                    <p className="schedule-hint">Não há mais horários disponíveis neste dia. Escolha outra data.</p>
                  ) : real && disponibilidade && !disponibilidade.aberto ? (
                    <p className="schedule-hint">A barbearia não atende neste dia.</p>
                  ) : (
                    <>
                      {diaLotado && (
                        <div className="schedule-alert">
                          <IoAlertCircle />
                          <span>Todos os horários deste dia estão ocupados. Escolha um barbeiro e entre na lista de espera: avisamos se vagar.</span>
                        </div>
                      )}
                      <div className="schedule-time-grid">
                        {horarios.map(({ hora, livres }) => {
                          const isSelected = selectedTime === hora;
                          const isAvailable = livres === null || livres.length > 0;
                          return (
                            <button
                              key={hora}
                              onClick={() => isAvailable && handleTimeSelect(hora)}
                              disabled={!isAvailable}
                              className={`schedule-time-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Barber Selection */}
              {mostrarBarbeiros && (
                <div className="schedule-form-group">
                  <label className="schedule-label">
                    <IoPerson className="label-icon" />
                    Selecione o barbeiro
                  </label>

                  {barbeiros.length === 0 ? (
                    <p className="schedule-hint">Nenhum barbeiro disponível no momento.</p>
                  ) : (
                    <div className="schedule-barber-list">
                      {barbeiros.map(barber => {
                        const isSelected = selectedBarber === barber.id;
                        const livre = diaLotado || barbeiroLivre(barber.id);
                        return (
                          <button
                            key={barber.id}
                            onClick={() => livre && setSelectedBarber(barber.id)}
                            disabled={!livre}
                            className={`schedule-barber-card ${isSelected ? 'selected' : ''} ${!livre ? 'busy' : ''}`}
                          >
                            <div className="barber-avatar">
                              {barber.foto
                                ? <img src={barber.foto} alt="" className="barber-avatar-img" />
                                : barber.avatar || <span className="barber-avatar-initials">{iniciais(barber.name)}</span>}
                            </div>
                            <div className="barber-info">
                              <h3 className="barber-name">{barber.name}</h3>
                              <div className="barber-meta">
                                {real ? (
                                  <span>{livre ? barber.specialty : 'Ocupado neste horário'}</span>
                                ) : (
                                  <>
                                    <span>⭐ {barber.rating}</span>
                                    <span>•</span>
                                    <span>{barber.services} serviços</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && <IoCheckmarkCircle className="barber-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {erro && (
                <div className="schedule-alert schedule-alert--error" role="alert">
                  <IoAlertCircle />
                  <span>{erro}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="schedule-modal-footer">
              {showSuccess ? (
                <div className="schedule-success-message">
                  <IoCheckmarkCircle />
                  <span>Agendamento confirmado!</span>
                </div>
              ) : (
                <>
                  <div className="schedule-summary">
                    {canConfirm ? (
                      <>
                        <span className="summary-label">Resumo:</span>
                        <span className="summary-text">
                          {diaLotado
                            ? `Lista de espera em ${formatDate(selectedDate).split(',')[0]} com ${nomeBarbeiro}`
                            : `${formatDate(selectedDate).split(',')[0]} às ${selectedTime} com ${nomeBarbeiro}`}
                        </span>
                      </>
                    ) : (
                      <span className="summary-text-empty">
                        Selecione data, horário e barbeiro
                      </span>
                    )}
                  </div>
                  <div className="schedule-footer-buttons">
                    <button
                      className="schedule-button-secondary"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className="schedule-button-primary"
                      onClick={handleConfirm}
                      disabled={!canConfirm || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="button-spinner"></span>
                          {diaLotado ? 'Entrando...' : 'Agendando...'}
                        </>
                      ) : (
                        <>
                          <IoCheckmarkCircle />
                          {diaLotado ? 'Entrar na lista de espera' : 'Confirmar'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleTime;
