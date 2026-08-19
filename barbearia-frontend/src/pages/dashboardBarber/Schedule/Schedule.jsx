import React, { useState } from 'react';
import { 
  IoChevronBack, 
  IoChevronForward, 
  IoTime, 
  IoPerson, 
  IoCut, 
  IoDocumentText, 
  IoCheckmarkCircle, 
  IoCloseCircle, 
  IoRefresh,
  IoFilterOutline,
  IoPersonOutline
} from 'react-icons/io5';
import './Schedule.css';

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState('todos');
  
  // Lista de barbeiros
  const barbers = [
    { id: 'todos', name: 'Todos os Barbeiros', color: '#3b82f6' },
    { id: 'João', name: 'João Silva', color: '#10b981' },
    { id: 'Carlos', name: 'Carlos Santos', color: '#f59e0b' },
    { id: 'Rafael', name: 'Rafael Costa', color: '#8b5cf6' }
  ];
  
  // Dados mockados de agendamentos
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      date: '2025-09-15',
      time: '09:00',
      clientName: 'João Silva',
      service: 'Corte + Barba',
      barber: 'Carlos',
      description: 'Cliente prefere corte social',
      status: 'agendado',
      duration: 60
    },
    {
      id: 2,
      date: '2025-09-15',
      time: '10:30',
      clientName: 'Pedro Santos',
      service: 'Apenas Corte',
      barber: 'João',
      description: 'Corte degradê',
      status: 'agendado',
      duration: 45
    },
    {
      id: 3,
      date: '2025-09-15',
      time: '14:00',
      clientName: 'Ana Costa',
      service: 'Sobrancelha',
      barber: 'Rafael',
      description: 'Design de sobrancelha',
      status: 'agendado',
      duration: 30
    },
    {
      id: 4,
      date: '2025-09-16',
      time: '09:30',
      clientName: 'Maria Oliveira',
      service: 'Barba + Bigode',
      barber: 'Carlos',
      description: 'Aparar barba',
      status: 'concluido',
      duration: 30
    },
    {
      id: 5,
      date: '2025-09-16',
      time: '11:00',
      clientName: 'Roberto Lima',
      service: 'Corte Infantil',
      barber: 'João',
      description: 'Corte para criança de 8 anos',
      status: 'concluido',
      duration: 30
    },
    {
      id: 6,
      date: '2025-09-16',
      time: '15:30',
      clientName: 'Fernanda Souza',
      service: 'Escova + Hidratação',
      barber: 'Rafael',
      description: 'Tratamento capilar feminino',
      status: 'agendado',
      duration: 75
    },
    {
      id: 7,
      date: '2025-09-17',
      time: '16:00',
      clientName: 'Lucas Costa',
      service: 'Corte + Barba + Sobrancelha',
      barber: 'João',
      description: 'Serviço completo',
      status: 'remarcado',
      duration: 90
    },
    {
      id: 8,
      date: '2025-09-17',
      time: '13:30',
      clientName: 'Marcos Silva',
      service: 'Corte + Lavagem',
      barber: 'Rafael',
      description: 'Corte executivo',
      status: 'cancelado',
      duration: 50
    },
    {
      id: 9,
      date: '2025-09-18',
      time: '10:00',
      clientName: 'Carla Mendes',
      service: 'Coloração + Corte',
      barber: 'Carlos',
      description: 'Mudança de visual',
      status: 'agendado',
      duration: 120
    },
    {
      id: 10,
      date: '2025-09-18',
      time: '14:15',
      clientName: 'Paulo Rodrigues',
      service: 'Barba + Relaxamento',
      barber: 'Rafael',
      description: 'Barba com tratamento relaxante',
      status: 'agendado',
      duration: 45
    }
  ]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getFilteredAppointments = () => {
    if (selectedBarber === 'todos') {
      return appointments;
    }
    return appointments.filter(apt => apt.barber === selectedBarber);
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = formatDate(date);
    return getFilteredAppointments().filter(apt => apt.date === dateStr);
  };

  const hasAppointmentsOnDate = (date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  const updateAppointmentStatus = (appointmentId, newStatus) => {
    setAppointments(prevAppointments =>
      prevAppointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
  };

  const getBarberColor = (barberName) => {
    const barber = barbers.find(b => b.id === barberName);
    return barber ? barber.color : '#3b82f6';
  };

  const getSelectedBarberInfo = () => {
    return barbers.find(b => b.id === selectedBarber) || barbers[0];
  };

  const handleStatusCardClick = (status) => {
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const getAppointmentsByStatus = (status) => {
    return getFilteredAppointments().filter(apt => apt.status === status);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios do início do mês
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const hasAppointments = dayAppointments.length > 0;
      const isToday = formatDate(date) === formatDate(new Date());
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${hasAppointments ? 'has-appointments' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => {
            setSelectedDate(date);
            if (hasAppointments) {
              setShowAppointmentModal(true);
            }
          }}
        >
          <span className="day-number">{day}</span>
          {hasAppointments && (
            <div className="appointment-indicators">
              <div className="appointment-count-badge">
                {dayAppointments.length}
              </div>
              <div className="barber-dots">
                {[...new Set(dayAppointments.map(apt => apt.barber))].slice(0, 3).map(barber => (
                  <div
                    key={barber}
                    className="barber-dot"
                    style={{ backgroundColor: getBarberColor(barber) }}
                    title={barber}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluido':
        return <IoCheckmarkCircle className="status-icon completed" />;
      case 'cancelado':
        return <IoCloseCircle className="status-icon cancelled" />;
      case 'remarcado':
        return <IoRefresh className="status-icon rescheduled" />;
      default:
        return <IoTime className="status-icon scheduled" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'remarcado':
        return 'Remarcado';
      default:
        return 'Agendado';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getStatusCounts = () => {
    const filtered = getFilteredAppointments();
    return {
      agendado: filtered.filter(apt => apt.status === 'agendado').length,
      concluido: filtered.filter(apt => apt.status === 'concluido').length,
      cancelado: filtered.filter(apt => apt.status === 'cancelado').length,
      remarcado: filtered.filter(apt => apt.status === 'remarcado').length,
    };
  };

  return (
    <div className="barber-schedule">
      <div className="schedule-header">
        <div className="header-content">
          <h1 className="schedule-title">Agenda</h1>
          <span className="schedule-subtitle">Aqui você gerencia a sua lista de agendamentos do dia a dia</span>
        </div>
        
        <div className="header-controls">
          <div className="barber-selector">
            <IoFilterOutline className="selector-icon" />
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="barber-select"
              style={{ borderColor: getSelectedBarberInfo().color }}
            >
              {barbers.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="status-summary">
        {Object.entries(getStatusCounts()).map(([status, count]) => (
          <div 
            key={status} 
            className={`status-card ${status}`}
            onClick={() => handleStatusCardClick(status)}
          >
            <div className="status-icon-container">
              {getStatusIcon(status)}
            </div>
            <div className="status-info">
              <span className="status-count">{count}</span>
              <span className="status-label">{getStatusText(status)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-section">
        <div className="calendar-navigation">
          <button
            className="nav-btn"
            onClick={() => navigateMonth(-1)}
          >
            <IoChevronBack />
          </button>
          
          <h2 className="current-period">
            {`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
          
          <button
            className="nav-btn"
            onClick={() => navigateMonth(1)}
          >
            <IoChevronForward />
          </button>
        </div>

        <div className="calendar-container">
          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
          
          <div className="calendar-grid">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Modal de agendamentos do dia */}
      {showAppointmentModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Agendamentos - {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                {selectedBarber !== 'todos' && (
                  <span className="modal-barber" style={{ color: getSelectedBarberInfo().color }}>
                    ({getSelectedBarberInfo().name})
                  </span>
                )}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowAppointmentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {getAppointmentsForDate(selectedDate).length === 0 ? (
                <div className="no-appointments">
                  <IoPersonOutline className="no-appointments-icon" />
                  <p>Nenhum agendamento para este dia.</p>
                  {selectedBarber !== 'todos' && (
                    <p className="no-appointments-subtitle">
                      Filtro ativo: {getSelectedBarberInfo().name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="appointments-list">
                  {getAppointmentsForDate(selectedDate).map(appointment => (
                    <div 
                      key={appointment.id} 
                      className={`appointment-card ${appointment.status}`}
                      style={{ borderLeftColor: getBarberColor(appointment.barber) }}
                    >
                      <div className="appointment-header">
                        <div className="appointment-time">
                          <IoTime className="icon" />
                          {appointment.time}
                        </div>
                        <div className="appointment-status">
                          {getStatusIcon(appointment.status)}
                          {getStatusText(appointment.status)}
                        </div>
                      </div>
                      
                      <div className="appointment-details">
                        <div className="detail-row">
                          <IoPerson className="icon" />
                          <span className="label">Cliente:</span>
                          <span className="value">{appointment.clientName}</span>
                        </div>
                        
                        <div className="detail-row">
                          <IoCut className="icon" />
                          <span className="label">Serviço:</span>
                          <span className="value">{appointment.service}</span>
                        </div>
                        
                        <div className="detail-row">
                          <IoPersonOutline className="icon" />
                          <span className="label">Barbeiro:</span>
                          <span 
                            className="value barber-name"
                            style={{ color: getBarberColor(appointment.barber) }}
                          >
                            {appointment.barber}
                          </span>
                        </div>
                        
                        {appointment.description && (
                          <div className="detail-row">
                            <IoDocumentText className="icon" />
                            <span className="label">Descrição:</span>
                            <span className="value">{appointment.description}</span>
                          </div>
                        )}
                        
                        <div className="detail-row">
                          <IoTime className="icon" />
                          <span className="label">Duração:</span>
                          <span className="value">{appointment.duration} min</span>
                        </div>
                      </div>
                      
                      {appointment.status === 'agendado' && (
                        <div className="appointment-actions">
                          <button
                            className="action-btn completed"
                            onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                          >
                            <IoCheckmarkCircle className="btn-icon" />
                            Concluir
                          </button>
                          <button
                            className="action-btn rescheduled"
                            onClick={() => updateAppointmentStatus(appointment.id, 'remarcado')}
                          >
                            <IoRefresh className="btn-icon" />
                            Remarcar
                          </button>
                          <button
                            className="action-btn cancelled"
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                          >
                            <IoCloseCircle className="btn-icon" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de relatório por status */}
      {showStatusModal && selectedStatus && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="status-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Relatório - {getStatusText(selectedStatus)}
                {selectedBarber !== 'todos' && (
                  <span className="modal-barber" style={{ color: getSelectedBarberInfo().color }}>
                    ({getSelectedBarberInfo().name})
                  </span>
                )}
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {getAppointmentsByStatus(selectedStatus).length === 0 ? (
                <div className="no-appointments">
                  <IoPersonOutline className="no-appointments-icon" />
                  <p>Nenhum agendamento com status "{getStatusText(selectedStatus)}".</p>
                  {selectedBarber !== 'todos' && (
                    <p className="no-appointments-subtitle">
                      Filtro ativo: {getSelectedBarberInfo().name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="appointments-list">
                  {getAppointmentsByStatus(selectedStatus).map(appointment => (
                    <div 
                      key={appointment.id} 
                      className={`appointment-card ${appointment.status}`}
                      style={{ borderLeftColor: getBarberColor(appointment.barber) }}
                    >
                      <div className="appointment-header">
                        <div className="appointment-time">
                          <IoTime className="icon" />
                          {appointment.time} - {appointment.date}
                        </div>
                        <div className="appointment-status">
                          {getStatusIcon(appointment.status)}
                          {getStatusText(appointment.status)}
                        </div>
                      </div>
                      
                      <div className="appointment-details">
                        <div className="detail-row">
                          <IoPerson className="icon" />
                          <span className="label">Cliente:</span>
                          <span className="value">{appointment.clientName}</span>
                        </div>
                        
                        <div className="detail-row">
                          <IoCut className="icon" />
                          <span className="label">Serviço:</span>
                          <span className="value">{appointment.service}</span>
                        </div>
                        
                        <div className="detail-row">
                          <IoPersonOutline className="icon" />
                          <span className="label">Barbeiro:</span>
                          <span 
                            className="value barber-name"
                            style={{ color: getBarberColor(appointment.barber) }}
                          >
                            {appointment.barber}
                          </span>
                        </div>
                        
                        {appointment.description && (
                          <div className="detail-row">
                            <IoDocumentText className="icon" />
                            <span className="label">Descrição:</span>
                            <span className="value">{appointment.description}</span>
                          </div>
                        )}
                        
                        <div className="detail-row">
                          <IoTime className="icon" />
                          <span className="label">Duração:</span>
                          <span className="value">{appointment.duration} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="schedule-legend">
        <div className="legend-section">
          <h4>Status dos Agendamentos:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color scheduled"></div>
              <span>Agendado</span>
            </div>
            <div className="legend-item">
              <div className="legend-color completed"></div>
              <span>Concluído</span>
            </div>
            <div className="legend-item">
              <div className="legend-color cancelled"></div>
              <span>Cancelado</span>
            </div>
            <div className="legend-item">
              <div className="legend-color rescheduled"></div>
              <span>Remarcado</span>
            </div>
          </div>
        </div>
        
        <div className="legend-section">
          <h4>Barbeiros:</h4>
          <div className="legend-items">
            {barbers.slice(1).map(barber => (
              <div key={barber.id} className="legend-item">
                <div 
                  className="legend-color barber-color" 
                  style={{ backgroundColor: barber.color, borderColor: barber.color }}
                ></div>
                <span>{barber.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;