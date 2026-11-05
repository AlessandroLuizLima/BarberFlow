import api from './api';

// Com barbeariaId: barbeiros daquela barbearia (área do cliente).
// Sem: barbeiros da barbearia do barbeiro logado (painel).
export const listarProfissionais = (barbeariaId) =>
  api.get(barbeariaId ? `/barbearias/${encodeURIComponent(barbeariaId)}/profissionais` : '/profissionais').then((r) => r.data);

// Painel do barbeiro (só a barbearia dele). O cadastro respeita o limite de profissionais do plano.
export const criarProfissional = (dados) => api.post('/profissionais', dados).then((r) => r.data);
export const atualizarProfissional = (id, dados) => api.put(`/profissionais/${id}`, dados).then((r) => r.data);
export const excluirProfissional = (id) => api.delete(`/profissionais/${id}`).then((r) => r.data);
export const enviarFotoProfissional = (id, imagem) => api.put(`/profissionais/${id}/foto`, { imagem }).then((r) => r.data);
export const removerFotoProfissional = (id) => api.delete(`/profissionais/${id}/foto`).then((r) => r.data);
