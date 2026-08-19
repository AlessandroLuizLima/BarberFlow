import React, { useState } from 'react';
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

const ClientBooking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const services = [
    {
      id: 1,
      name: 'Corte de Cabelo',
      price: 35.00,
      duration: 30,
      description: 'Corte moderno e personalizado',
      category: 'Cortes'
    },
    {
      id: 2,
      name: 'Barba Completa',
      price: 25.00,
      duration: 20,
      description: 'Aparar, desenhar e finalizar',
      category: 'Barba'
    },
    {
      id: 3,
      name: 'Corte + Barba',
      price: 55.00,
      duration: 50,
      description: 'Pacote completo de cuidados',
      category: 'Combos'
    },
    {
      id: 4,
      name: 'Sobrancelha',
      price: 15.00,
      duration: 15,
      description: 'Design e aparar sobrancelhas',
      category: 'Extras'
    },
    {
      id: 5,
      name: 'Lavagem + Hidratação',
      price: 20.00,
      duration: 25,
      description: 'Limpeza profunda e hidratação',
      category: 'Tratamentos'
    },
    {
      id: 6,
      name: 'Bigode',
      price: 12.00,
      duration: 10,
      description: 'Aparar e modelar bigode',
      category: 'Barba'
    }
  ];

  const barbers = [
    {
      id: 1,
      name: 'Carlos Santos',
      rating: 4.9,
      totalReviews: 156,
      specialty: 'Cortes Modernos',
      experience: '8 anos',
      image: null
    },
    {
      id: 2,
      name: 'João Silva',
      rating: 4.8,
      totalReviews: 203,
      specialty: 'Barbas e Bigodes',
      experience: '10 anos',
      image: null
    },
    {
      id: 3,
      name: 'Rafael Costa',
      rating: 4.7,
      totalReviews: 98,
      specialty: 'Cortes Clássicos',
      experience: '5 anos',
      image: null
    }
  ];

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

  const handleConfirm = () => {
    const booking = {
      service: services.find(s => s.id === selectedService),
      barber: barbers.find(b => b.id === selectedBarber),
      date: selectedDate,
      time: selectedTime
    };
    console.log('Agendamento confirmado:', booking);
    // Aqui você enviaria para o backend
    alert('Agendamento realizado com sucesso!');
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
          {currentStep === 1 && (
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

          {currentStep === 4 && (
            <div className="step-content">
              <h2>Confirmação do Agendamento</h2>
              <p className="step-description">Revise os detalhes do seu agendamento</p>
              
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
        <div className="booking-navigation">
          {currentStep > 1 && (
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
          ) : (
            <button 
              className="nav-button primary confirm" 
              onClick={handleConfirm}
            >
              <FiCheck size={20} />
              Confirmar Agendamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBooking;