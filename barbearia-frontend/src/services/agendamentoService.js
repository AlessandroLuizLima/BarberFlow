import api from './api';

export const criarAgendamento = (dados) => api.post('/agendamentos', dados).then(r => r.data);
export const listarAgendamentos = (params) => api.get('/agendamentos', { params }).then(r => r.data);
export const cancelarAgendamento = (id) => api.delete(`/agendamentos/${id}`).then(r => r.data);
export const concluirAgendamento = (id) => api.patch(`/agendamentos/${id}/concluir`).then(r => r.data);
export const remarcarAgendamento = (id, dados) => api.put(`/agendamentos/${id}`, dados).then(r => r.data);

// Horários livres de um dia: { aberto, horarios: [{ hora: '09:00', profissionais: [ids livres] }] }
export const consultarDisponibilidade = (params) => api.get('/disponibilidade', { params }).then(r => r.data);
