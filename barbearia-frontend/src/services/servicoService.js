import api from './api';

export const listarServicos = () => api.get('/servicos').then(r => r.data);
