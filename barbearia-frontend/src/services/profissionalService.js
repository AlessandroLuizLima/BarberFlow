import api from './api';

export const listarProfissionais = () => api.get('/profissionais').then(r => r.data);
