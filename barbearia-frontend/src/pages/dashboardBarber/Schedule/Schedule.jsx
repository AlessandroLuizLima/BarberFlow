import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IoChevronBack, IoChevronForward, IoTime, IoPerson, IoCut, IoCash,
  IoCheckmarkCircle, IoCloseCircle, IoRefresh, IoFilterOutline, IoPersonOutline
} from 'react-icons/io5';
import {
  listarAgendamentos, cancelarAgendamento, concluirAgendamento, remarcarAgendamento
} from '../../../services/agendamentoService';
import { listarProfissionais } from '../../../services/profissionalService';
import './Schedule.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const CORES = ['#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#ef4444'];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mensagemDeErro = (e, padrao) => e?.response?.data?.error || e?.response?.data?.message || padrao;

// Converte o agendamento do backend para o formato usado na tela.
// "confirmado" (criado pelo cliente) é exibido como "Agendado".
const normalizar = (a) => {
  const d = new Date(a.data_hora);
  return {
    id: a.id,
    date: toKey(d),
    time: toTime(d),
    clientName: a.cliente?.nome_completo || 'Cliente',
    service: a.servico?.nome || 'Serviço',
    barberId: a.profissional_id,
    barber: a.profissional?.nome_completo || 'Profissional',
    price: a.preco_cobrado ?? a.servico?.preco ?? null,
    duration: a.servico?.duracao_minutos || null,
    status: a.status === 'confirmado' ? 'agendado' : a.status
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
  agendado: 'Agendado', remarcado: 'Remarcado', concluido: 'Concluído', cancelado: 'Cancelado'
}[status] || 'Agendado');

const isAtivo = (status) => status === 'agendado' || status === 'remarcado';

const AppointmentCard = ({ apt, color, showDate, todayKey, busy, onConcluir, onRemarcar, onCancel }) => (
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
      {apt.price !== null && (
        <div className="detail-row">
          <IoCash className="icon" />
          <span className="label">Valor:</span>
          <span className="value">{moeda(apt.price)}</span>
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

    {onConcluir && isAtivo(apt.status) && (
      <div className="appointment-actions">
        <button className="action-btn completed" disabled={busy} onClick={() => onConcluir(apt)}>
          <IoCheckmarkCircle className="btn-icon" /> Concluir
        </button>
        <button className="action-btn rescheduled" disabled={busy} onClick={() => onRemarcar(apt)}>
          <IoRefresh className="btn-icon" /> Remarcar
        </button>
        <button className="action-btn cancelled" disabled={busy} onClick={() => onCancel(apt)}>
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
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Remarcar
  const [remarcando, setRemarcando] = useState(null);
  const [form, setForm] = useState({ data: '', hora: '', profissionalId: '' });
  const [erroRemarcar, setErroRemarcar] = useState('');

  const todayKey = toKey(new Date());

  const carregar = useCallback(async () => {
    try {
      setErro('');
      const [lista, profs] = await Promise.all([listarAgendamentos(), listarProfissionais()]);
      setAppointments((Array.isArray(lista) ? lista : []).map(normalizar));
      setProfissionais(Array.isArray(profs) ? profs : []);
    } catch (e) {
      console.error(e);
      setErro('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const barbers = useMemo(() => [
    { id: 'todos', name: 'Todos os Barbeiros', color: '#3b82f6' },
    ...profissionais.map((p, i) => ({ id: String(p.id), name: p.nome_completo, color: CORES[i % CORES.length], ativo: p.ativo !== false }))
  ], [profissionais]);

  const filtered = useMemo(
    () => selectedBarber === 'todos' ? appointments : appointments.filter(a => String(a.barberId) === selectedBarber),
    [appointments, selectedBarber]
  );

  const getBarberColor = (id) => barbers.find(b => b.id === String(id))?.color || '#3b82f6';
  const selectedBarberInfo = barbers.find(b => b.id === selectedBarber) || barbers[0];

  const getAppointmentsForDate = (date) =>
    filtered.filter(a => a.date === toKey(date)).sort((a, b) => a.time.localeCompare(b.time));

  const statusCounts = {
    agendado: filtered.filter(a => a.status === 'agendado').length,
    remarcado: filtered.filter(a => a.status === 'remarcado').length,
    concluido: filtered.filter(a => a.status === 'concluido').length,
    cancelado: filtered.filter(a => a.status === 'cancelado').length
  };

  const executar = async (apt, acao, mensagemPadrao) => {
    try {
      setBusyId(apt.id);
      await acao();
      await carregar();
    } catch (e) {
      console.error(e);
      alert(mensagemDeErro(e, mensagemPadrao));
    } finally {
      setBusyId(null);
    }
  };

  const handleConcluir = (apt) => {
    const futuro = apt.date > todayKey;
    const aviso = futuro
      ? `Este agendamento é de ${apt.date.split('-').reverse().join('/')}, um dia que ainda não chegou. Concluir o atendimento de ${apt.clientName} mesmo assim?`
      : `Concluir o atendimento de ${apt.clientName}? O valor entra no lucro do dia.`;
    if (!window.confirm(aviso)) return;
    executar(apt, () => concluirAgendamento(apt.id), 'Não foi possível concluir o atendimento.');
  };

  const handleCancel = (apt) => {
    if (!window.confirm('Cancelar este agendamento? A lista de espera será avisada.')) return;
    executar(apt, () => cancelarAgendamento(apt.id), 'Não foi possível cancelar o agendamento.');
  };

  const abrirRemarcar = (apt) => {
    setErroRemarcar('');
    setForm({ data: apt.date, hora: apt.time, profissionalId: String(apt.barberId) });
    setRemarcando(apt);
  };

  const confirmarRemarcar = async () => {
    if (!form.data || !form.hora) {
      setErroRemarcar('Informe a nova data e o horário.');
      return;
    }
    try {
      setBusyId(remarcando.id);
      setErroRemarcar('');
      await remarcarAgendamento(remarcando.id, {
        data_hora: new Date(`${form.data}T${form.hora}:00`).toISOString(),
        profissional_id: Number(form.profissionalId)
      });
      setRemarcando(null);
      await carregar();
    } catch (e) {
      console.error(e);
      setErroRemarcar(mensagemDeErro(e, 'Não foi possível remarcar o agendamento.'));
    } finally {
      setBusyId(null);
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
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(y, m, day);
      // Cancelados não contam no calendário (continuam no relatório do dia)
      const dayApts = getAppointmentsForDate(date).filter(a => a.status !== 'cancelado');
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
                {[...new Set(dayApts.map(a => a.barberId))].slice(0, 3).map(id => (
                  <div key={id} className="barber-dot" style={{ backgroundColor: getBarberColor(id) }}></div>
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

  const cardProps = {
    todayKey,
    onConcluir: handleConcluir,
    onRemarcar: abrirRemarcar,
    onCancel: handleCancel
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
                      color={getBarberColor(apt.barberId)}
                      busy={busyId === apt.id}
                      {...cardProps}
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
                    <AppointmentCard
                      key={apt.id}
                      apt={apt}
                      color={getBarberColor(apt.barberId)}
                      busy={busyId === apt.id}
                      showDate
                      {...cardProps}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remarcar */}
      {remarcando && (
        <div className="modal-overlay reschedule-overlay" onClick={() => setRemarcando(null)}>
          <div className="appointment-modal reschedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Remarcar agendamento
                <span className="modal-barber">{remarcando.clientName} · {remarcando.service}</span>
              </h3>
              <button className="close-btn" onClick={() => setRemarcando(null)}>×</button>
            </div>
            <div className="reschedule-form">
              <label>
                Nova data
                <input
                  type="date"
                  min={todayKey}
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </label>
              <label>
                Novo horário
                <input
                  type="time"
                  step="900"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </label>
              <label>
                Barbeiro
                <select
                  value={form.profissionalId}
                  onChange={(e) => setForm({ ...form, profissionalId: e.target.value })}
                >
                  {barbers.slice(1)
                    .filter(b => b.ativo || b.id === String(remarcando.barberId))
                    .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              {erroRemarcar && <div className="reschedule-error">{erroRemarcar}</div>}
              <div className="reschedule-actions">
                <button className="btn-secondary" onClick={() => setRemarcando(null)}>Voltar</button>
                <button className="btn-primary" disabled={busyId === remarcando.id} onClick={confirmarRemarcar}>
                  {busyId === remarcando.id ? 'Salvando...' : 'Confirmar remarcação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="schedule-legend">
        <div className="legend-section">
          <h4>Status dos Agendamentos:</h4>
          <div className="legend-items">
            <div className="legend-item"><div className="legend-color scheduled"></div><span>Agendado</span></div>
            <div className="legend-item"><div className="legend-color rescheduled"></div><span>Remarcado</span></div>
            <div className="legend-item"><div className="legend-color completed"></div><span>Concluído</span></div>
            <div className="legend-item"><div className="legend-color cancelled"></div><span>Cancelado</span></div>
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
