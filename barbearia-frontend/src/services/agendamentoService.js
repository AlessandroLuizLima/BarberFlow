import api from './api';

export const criarAgendamento = (dados) => api.post('/agendamentos', dados).then(r => r.data);
export const listarAgendamentos = (params) => api.get('/agendamentos', { params }).then(r => r.data);
export const cancelarAgendamento = (id) => api.delete(`/agendamentos/${id}`).then(r => r.data);
