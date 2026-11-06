import React from 'react';
import { FiScissors, FiClock, FiUser, FiMapPin, FiNavigation } from 'react-icons/fi';
import { STATUS_LABEL, STATUS_ATIVOS, formatarMoeda, valorDoAgendamento } from '../../../../utils/agendamentosCliente';
import './AgendamentoItem.css';

// Link do Google Maps para a barbearia do agendamento: endereço escrito (o Maps acha melhor),
// senão as coordenadas, senão o nome da barbearia
function linkDaBarbearia(b) {
  if (!b) return null;
  const d = b.endereco_detalhado || {};
  const rua = [d.rua, d.numero].filter(Boolean).join(', ');
  const partes = [rua, d.bairro, d.cidade, d.estado, d.cep].filter(Boolean);
  let destino = partes.length && (d.cidade || rua) ? [...partes, 'Brasil'].join(', ') : (b.endereco || '').trim();
  const lat = Number(b.latitude);
  const lng = Number(b.longitude);
  if (!destino && b.latitude != null && Number.isFinite(lat) && Number.isFinite(lng)) destino = `${lat},${lng}`;
  if (!destino) destino = `${b.nome || ''} barbearia`.trim();
  return destino ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}` : null;
}

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
          <p className="ag-meta ag-local">
            <FiMapPin size={13} />
            <span className="ag-local-nome">{agendamento.barbearia.nome}</span>
            {linkDaBarbearia(agendamento.barbearia) && (
              <a
                className="ag-mapa"
                href={linkDaBarbearia(agendamento.barbearia)}
                target="_blank"
                rel="noopener noreferrer"
                title={agendamento.barbearia.endereco ? `Ver no mapa: ${agendamento.barbearia.endereco}` : 'Ver no mapa'}
                aria-label={`Ver ${agendamento.barbearia.nome} no Google Maps`}
              >
                <FiNavigation size={12} /> Ver no mapa
              </a>
            )}
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
