import api from './api';

export const cadastrarCliente = (dados) => api.post('/clientes', dados).then(r => r.data);
export const loginCliente = (email, senha) => api.post('/clientes/login', { email, senha }).then(r => r.data);
export const listarClientes = () => api.get('/clientes').then(r => r.data);
export const buscarCliente = (id) => api.get(`/clientes/${id}`).then(r => r.data);
export const atualizarCliente = (id, dados) => api.put(`/clientes/${id}`, dados).then(r => r.data);
export const consultarCep = (cep) => api.get(`/cep/${cep}`).then(r => r.data);

// Foto de perfil: envia a imagem já reduzida (data URL) e recebe o cliente atualizado
export const enviarFotoCliente = (id, imagem) => api.put(`/clientes/${id}/foto`, { imagem }).then(r => r.data);
export const removerFotoCliente = (id) => api.delete(`/clientes/${id}/foto`).then(r => r.data);
