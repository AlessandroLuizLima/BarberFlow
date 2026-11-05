import api from './api';

// Com barbeariaId: serviços públicos daquela barbearia (área do cliente).
// Sem: serviços da barbearia do barbeiro logado (painel).
export const listarServicos = (barbeariaId) =>
  api.get(barbeariaId ? `/barbearias/${encodeURIComponent(barbeariaId)}/servicos` : '/servicos').then((r) => r.data);

// Painel do barbeiro (só a barbearia dele)
export const criarServico = (dados) => api.post('/servicos', dados).then((r) => r.data);
export const atualizarServico = (id, dados) => api.put(`/servicos/${id}`, dados).then((r) => r.data);
export const excluirServico = (id) => api.delete(`/servicos/${id}`).then((r) => r.data);
