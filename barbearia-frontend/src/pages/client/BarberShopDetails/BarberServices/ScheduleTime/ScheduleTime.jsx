// ScheduleTime.jsx
import React, { useState, useEffect } from "react";
import { IoCalendar, IoTime, IoPerson, IoClose, IoCheckmarkCircle, IoChevronBack, IoChevronForward } from "react-icons/io5";
import "./ScheduleTime.css";

const ScheduleTime = ({ 
  isOpen, 
  onClose, 
  serviceName = "Corte de Cabelo",
  servicePrice = "R$ 45,00",
  serviceDuration = "45min"
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Dados de barbeiros
  const barbers = [
    { id: 1, name: 'João Silva', avatar: '👨', rating: 4.9, services: 127 },
    { id: 2, name: 'Pedro Santos', avatar: '👨‍🦱', rating: 4.8, services: 98 },
    { id: 3, name: 'Carlos Souza', avatar: '👨‍🦰', rating: 4.7, services: 85 },
    { id: 4, name: 'Rafael Lima', avatar: '👨‍🦲', rating: 4.9, services: 156 }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

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

  // Funções de calendário
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDateDisabled = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Desabilita passado e domingos
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (day) => {
    if (isDateDisabled(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedBarber) return;
    
    setIsSubmitting(true);
    
    // Simular chamada API
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Fechar modal após sucesso
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedBarber(null);
        onClose();
      }, 2000);
    }, 1000);
  };

  const canConfirm = selectedDate && selectedTime && selectedBarber;

  if (!isOpen) return null;

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
          <button className="schedule-close-button" onClick={onClose}>
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

        {/* Form Content */}
        <div className="schedule-modal-body">
          {/* Date Selection */}
          <div className="schedule-form-group">
            <label className="schedule-label">
              <IoCalendar className="label-icon" />
              Selecione a data
            </label>

            {/* Controles do Mês */}
            <div className="schedule-month-controls">
              <button onClick={previousMonth} className="month-nav-button">
                <IoChevronBack />
              </button>
              <span className="month-display">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="month-nav-button">
                <IoChevronForward />
              </button>
            </div>

            {/* Calendário */}
            <div className="schedule-calendar">
              <div className="calendar-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              
              <div className="calendar-days">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="calendar-day-empty" />
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
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
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
              
              <div className="schedule-time-grid">
                {timeSlots.map(time => {
                  const isSelected = selectedTime === time;
                  const isAvailable = Math.random() > 0.3; // Simulação

                  return (
                    <button
                      key={time}
                      onClick={() => isAvailable && setSelectedTime(time)}
                      disabled={!isAvailable}
                      className={`schedule-time-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barber Selection */}
          {selectedDate && selectedTime && (
            <div className="schedule-form-group">
              <label className="schedule-label">
                <IoPerson className="label-icon" />
                Selecione o barbeiro
              </label>

              <div className="schedule-barber-list">
                {barbers.map(barber => {
                  const isSelected = selectedBarber === barber.id;

                  return (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber.id)}
                      className={`schedule-barber-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="barber-avatar">{barber.avatar}</div>
                      <div className="barber-info">
                        <h3 className="barber-name">{barber.name}</h3>
                        <div className="barber-meta">
                          <span>⭐ {barber.rating}</span>
                          <span>•</span>
                          <span>{barber.services} serviços</span>
                        </div>
                      </div>
                      {isSelected && (
                        <IoCheckmarkCircle className="barber-check" />
                      )}
                    </button>
                  );
                })}
              </div>
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
                      {formatDate(selectedDate).split(',')[0]} às {selectedTime} com {barbers.find(b => b.id === selectedBarber)?.name}
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
                  onClick={handleSchedule}
                  disabled={!canConfirm || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="button-spinner"></span>
                      Agendando...
                    </>
                  ) : (
                    <>
                      <IoCheckmarkCircle />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleTime;