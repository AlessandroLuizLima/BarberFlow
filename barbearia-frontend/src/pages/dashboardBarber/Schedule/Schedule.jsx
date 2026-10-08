import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IoChevronBack, IoChevronForward, IoTime, IoPerson, IoCut, IoDocumentText,
  IoCheckmarkCircle, IoCloseCircle, IoRefresh, IoFilterOutline, IoPersonOutline
} from 'react-icons/io5';
import { listarAgendamentos, cancelarAgendamento } from '../../../services/agendamentoService';
import './Schedule.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const CORES = ['#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#ef4444'];

const STATUS_MAP = {
  agendado: 'agendado', confirmado: 'agendado', pendente: 'agendado',
  concluido: 'concluido', 'concluído': 'concluido', finalizado: 'concluido',
  cancelado: 'cancelado', cancelada: 'cancelado',
  remarcado: 'remarcado', reagendado: 'remarcado'
};

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Converte o formato do backend para o formato usado na tela.
// Se algum campo vier com outro nome, ajuste somente aqui.
const normalizar = (a) => {
  let date = '';
  let time = '';
  const dh = a.data_hora || a.dataHora || a.data_agendamento || a.inicio;
  if (dh) {
    const d = new Date(dh);
    date = toKey(d);
    time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else {
    date = String(a.data || '').slice(0, 10);
    time = String(a.hora || a.horario || '').slice(0, 5);
  }
  const cliente = a.cliente || a.Cliente || {};
  const servico = a.servico || a.Servico || {};
  const prof = a.profissional || a.Profissional || {};
  return {
    id: a.id ?? a.agendamento_id,
    date,
    time,
    clientName: cliente.nome || a.cliente_nome || 'Cliente',
    service: servico.nome || a.servico_nome || 'Serviço',
    barber: prof.nome || a.profissional_nome || 'Profissional',
    description: a.observacao || a.descricao || '',
    status: STATUS_MAP[String(a.status || 'agendado').toLowerCase()] || 'agendado',
    duration: servico.duracao || servico.duracao_minutos || a.duracao || null
  };
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'concluido': return <IoCheckmarkCircle className="status-icon completed" />;
    case 'cancelado': return <IoCloseCircle className="status-icon cancelled" />;
    case 'remarcado': return <IoRefresh className="status-icon rescheduled" />;
    default: return <IoTime className="status-icon scheduled" />;
  }
};

const getStatusText = (status) => ({
  concluido: 'Concluído', cancelado: 'Cancelado', remarcado: 'Remarcado'
}[status] || 'Agendado');

const AppointmentCard = ({ apt, color, showDate, onStatus, onCancel }) => (
  <div className={`appointment-card ${apt.status}`} style={{ borderLeftColor: color }}>
    <div className="appointment-header">
      <div className="appointment-time">
        <IoTime className="icon" />
        {apt.time}{showDate && ` - ${apt.date.split('-').reverse().join('/')}`}
      </div>
      <div className="appointment-status">
        {getStatusIcon(apt.status)}
        {getStatusText(apt.status)}
      </div>
    </div>

    <div className="appointment-details">
      <div className="detail-row">
        <IoPerson className="icon" />
        <span className="label">Cliente:</span>
        <span className="value">{apt.clientName}</span>
      </div>
      <div className="detail-row">
        <IoCut className="icon" />
        <span className="label">Serviço:</span>
        <span className="value">{apt.service}</span>
      </div>
      <div className="detail-row">
        <IoPersonOutline className="icon" />
        <span className="label">Barbeiro:</span>
        <span className="value barber-name" style={{ color }}>{apt.barber}</span>
      </div>
      {apt.description && (
        <div className="detail-row">
          <IoDocumentText className="icon" />
          <span className="label">Descrição:</span>
          <span className="value">{apt.description}</span>
        </div>
      )}
      {apt.duration && (
        <div className="detail-row">
          <IoTime className="icon" />
          <span className="label">Duração:</span>
          <span className="value">{apt.duration} min</span>
        </div>
      )}
    </div>

    {onStatus && apt.status === 'agendado' && (
      <div className="appointment-actions">
        <button className="action-btn completed" onClick={() => onStatus(apt.id, 'concluido')}>
          <IoCheckmarkCircle className="btn-icon" /> Concluir
        </button>
        <button className="action-btn rescheduled" onClick={() => onStatus(apt.id, 'remarcado')}>
          <IoRefresh className="btn-icon" /> Remarcar
        </button>
        <button className="action-btn cancelled" onClick={() => onCancel(apt.id)}>
          <IoCloseCircle className="btn-icon" /> Cancelar
        </button>
      </div>
    )}
  </div>
);

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState('todos');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setErro('');
      const resp = await listarAgendamentos();
      const lista = Array.isArray(resp) ? resp : (resp?.agendamentos || []);
      if (lista[0]) console.log('[Agenda] exemplo bruto do backend:', lista[0]); // remover depois
      setAppointments(lista.map(normalizar));
    } catch (e) {
      console.error(e);
      setErro('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const barbers = useMemo(() => {
    const nomes = [...new Set(appointments.map(a => a.barber))].sort();
    return [
      { id: 'todos', name: 'Todos os Barbeiros', color: '#3b82f6' },
      ...nomes.map((n, i) => ({ id: n, name: n, color: CORES[i % CORES.length] }))
    ];
  }, [appointments]);

  const filtered = useMemo(
    () => selectedBarber === 'todos' ? appointments : appointments.filter(a => a.barber === selectedBarber),
    [appointments, selectedBarber]
  );

  const getBarberColor = (name) => barbers.find(b => b.id === name)?.color || '#3b82f6';
  const selectedBarberInfo = barbers.find(b => b.id === selectedBarber) || barbers[0];

  const getAppointmentsForDate = (date) =>
    filtered.filter(a => a.date === toKey(date)).sort((a, b) => a.time.localeCompare(b.time));

  const statusCounts = {
    agendado: filtered.filter(a => a.status === 'agendado').length,
    concluido: filtered.filter(a => a.status === 'concluido').length,
    cancelado: filtered.filter(a => a.status === 'cancelado').length,
    remarcado: filtered.filter(a => a.status === 'remarcado').length
  };

  // Concluir/Remarcar ainda só alteram a tela (próximo passo: salvar no backend)
  const updateStatus = (id, status) =>
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));

  const handleCancel = async (id) => {
    if (!window.confirm('Cancelar este agendamento? A lista de espera será avisada.')) return;
    try {
      await cancelarAgendamento(id);
      await carregar();
    } catch (e) {
      console.error(e);
      alert('Não foi possível cancelar o agendamento.');
    }
  };

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const renderCalendar = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const todayKey = toKey(new Date());
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m, day);
      const dayApts = getAppointmentsForDate(date);
      const has = dayApts.length > 0;
      cells.push(
        <div
          key={day}
          className={`calendar-day ${has ? 'has-appointments' : ''} ${toKey(date) === todayKey ? 'today' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {has && (
            <div className="appointment-indicators">
              <div className="appointment-count-badge">{dayApts.length}</div>
              <div className="barber-dots">
                {[...new Set(dayApts.map(a => a.barber))].slice(0, 3).map(b => (
                  <div key={b} className="barber-dot" style={{ backgroundColor: getBarberColor(b) }} title={b}></div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  const dayList = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const statusList = selectedStatus
    ? filtered.filter(a => a.status === selectedStatus).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    : [];

  const filtroInfo = selectedBarber !== 'todos' && (
    <span className="modal-barber" style={{ color: selectedBarberInfo.color }}>
      {selectedBarberInfo.name}
    </span>
  );

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
            >
              {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {erro && <div className="schedule-error">{erro}</div>}

      <div className="status-summary">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className={`status-card ${status}`} onClick={() => setSelectedStatus(status)}>
            <div className="status-icon-container">{getStatusIcon(status)}</div>
            <div className="status-info">
              <span className="status-count">{count}</span>
              <span className="status-label">{getStatusText(status)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-section">
        <div className="calendar-navigation">
          <button className="nav-btn" onClick={() => navigateMonth(-1)}><IoChevronBack /></button>
          <h2 className="current-period">{`${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</h2>
          <button className="nav-btn" onClick={() => navigateMonth(1)}><IoChevronForward /></button>
        </div>

        <div className="calendar-container">
          <div className="calendar-weekdays">
            {DIAS_SEMANA.map(d => <div key={d} className="weekday-header">{d}</div>)}
          </div>
          <div className="calendar-grid">
            {loading ? <p className="schedule-loading">Carregando agendamentos...</p> : renderCalendar()}
          </div>
        </div>
      </div>

      {/* Relatório do dia clicado */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                <span className="modal-barber">
                  {dayList.length} {dayList.length === 1 ? 'agendamento' : 'agendamentos'}
                </span>
                {filtroInfo}
              </h3>
              <button className="close-btn" onClick={() => setSelectedDate(null)}>×</button>
            </div>
            <div className="modal-content">
              {dayList.length === 0 ? (
                <div className="no-appointments">
                  <IoPersonOutline className="no-appointments-icon" />
                  <p>Nenhum agendamento para este dia.</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {dayList.map(apt => (
                    <AppointmentCard
                      key={apt.id}
                      apt={apt}
                      color={getBarberColor(apt.barber)}
                      onStatus={updateStatus}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Relatório por status */}
      {selectedStatus && (
        <div className="modal-overlay" onClick={() => setSelectedStatus(null)}>
          <div className="status-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Relatório - {getStatusText(selectedStatus)}
                <span className="modal-barber">{statusList.length} no total</span>
                {filtroInfo}
              </h3>
              <button className="close-btn" onClick={() => setSelectedStatus(null)}>×</button>
            </div>
            <div className="modal-content">
              {statusList.length === 0 ? (
                <div className="no-appointments">
                  <IoPersonOutline className="no-appointments-icon" />
                  <p>Nenhum agendamento com status "{getStatusText(selectedStatus)}".</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {statusList.map(apt => (
                    <AppointmentCard key={apt.id} apt={apt} color={getBarberColor(apt.barber)} showDate />
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
            <div className="legend-item"><div className="legend-color scheduled"></div><span>Agendado</span></div>
            <div className="legend-item"><div className="legend-color completed"></div><span>Concluído</span></div>
            <div className="legend-item"><div className="legend-color cancelled"></div><span>Cancelado</span></div>
            <div className="legend-item"><div className="legend-color rescheduled"></div><span>Remarcado</span></div>
          </div>
        </div>
        <div className="legend-section">
          <h4>Barbeiros:</h4>
          <div className="legend-items">
            {barbers.slice(1).map(b => (
              <div key={b.id} className="legend-item">
                <div className="legend-color barber-color" style={{ backgroundColor: b.color, borderColor: b.color }}></div>
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;