import api from './api';

export const entrarNaListaDeEspera = (dados) => api.post('/lista-espera', dados).then(r => r.data);
