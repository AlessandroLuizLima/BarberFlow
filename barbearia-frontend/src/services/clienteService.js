import api from './api';

export const cadastrarCliente = (dados) => api.post('/clientes', dados).then(r => r.data);
export const loginCliente = (email, senha) => api.post('/clientes/login', { email, senha }).then(r => r.data);
export const listarClientes = () => api.get('/clientes').then(r => r.data);
export const buscarCliente = (id) => api.get(`/clientes/${id}`).then(r => r.data);
export const atualizarCliente = (id, dados) => api.put(`/clientes/${id}`, dados).then(r => r.data);
export const consultarCep = (cep) => api.get(`/cep/${cep}`).then(r => r.data);
