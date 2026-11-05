import React from 'react';
import { FiScissors, FiClock, FiUser, FiMapPin } from 'react-icons/fi';
import { STATUS_LABEL, STATUS_ATIVOS, formatarMoeda, valorDoAgendamento } from '../../../../utils/agendamentosCliente';
import './AgendamentoItem.css';

// Mesmo visual dos "próximos agendamentos" do dashboard do barbeiro, usado em toda a área do cliente.
const AgendamentoItem = ({ agendamento, onCancelar, cancelando = false, destaque = false }) => {
  const data = new Date(agendamento.data_hora);
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const podeCancelar = onCancelar && STATUS_ATIVOS.includes(agendamento.status) && data >= new Date();

  return (
    <div className={`ag-item ${destaque ? 'ag-item--destaque' : ''}`}>
      <div className="ag-time">
        <strong>{hora}</strong>
        <span>{dia}</span>
      </div>

      <div className="ag-info">
        <span className="ag-badge">
          <FiScissors size={14} />
          {agendamento.servico?.nome || 'Serviço'}
        </span>
        <p className="ag-pro">
          <FiUser size={13} /> com {agendamento.profissional?.nome_completo || 'profissional'}
        </p>
        {agendamento.barbearia?.nome && (
          <p className="ag-meta">
            <FiMapPin size={13} /> {agendamento.barbearia.nome}
          </p>
        )}
        {agendamento.servico?.duracao_minutos && (
          <p className="ag-meta">
            <FiClock size={13} /> {agendamento.servico.duracao_minutos} min
          </p>
        )}
      </div>

      <div className="ag-side">
        <span className="ag-price">{formatarMoeda(valorDoAgendamento(agendamento))}</span>
        <span className={`ag-status ag-status--${agendamento.status}`}>
          {STATUS_LABEL[agendamento.status] || agendamento.status}
        </span>
        {podeCancelar && (
          <button
            type="button"
            className="ag-cancel"
            onClick={() => onCancelar(agendamento.id)}
            disabled={cancelando}
          >
            {cancelando ? 'Cancelando...' : 'Cancelar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AgendamentoItem;
