import axios from 'axios';
import {
  obterTokenCliente,
  obterTokenBarbeiro,
  encerrarSessaoCliente,
  encerrarSessaoBarbeiro
} from './authStorage';

// URL do backend. Em produção, defina VITE_API_URL no .env do frontend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// O backend devolve imagens como caminho relativo ("/imagens/<id>"). Para usar no <img src>
// é preciso completar com o endereço da API (frontend e backend rodam em hosts diferentes).
// Data URLs e URLs completas passam sem mudança.
export const urlImagem = (caminho) => {
  if (!caminho) return null;
  if (/^(data:|https?:\/\/|blob:)/.test(caminho)) return caminho;
  return `${API_URL.replace(/\/$/, '')}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
};

// Na área do barbeiro (/dashboard) vai o token do barbeiro; no resto do site, o do cliente.
const naAreaDoBarbeiro = () => window.location.pathname.startsWith('/dashboard');

api.interceptors.request.use((config) => {
  const token = naAreaDoBarbeiro() ? obterTokenBarbeiro() : obterTokenCliente();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sessão expirada ou derrubada (ex.: senha trocada em outro aparelho): volta para o login
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro.response?.status;
    const ehLogin = /\/login$/.test(erro.config?.url || '');
    // 401 = sessão inválida; 403 na área do barbeiro = token que não é de barbeiro
    if ((status === 401 || (status === 403 && naAreaDoBarbeiro())) && !ehLogin) {
      if (naAreaDoBarbeiro()) {
        encerrarSessaoBarbeiro();
        window.location.assign('/auth/barbeiro');
      } else if (obterTokenCliente()) {
        encerrarSessaoCliente();
        window.location.assign('/auth/cliente');
      }
    }
    return Promise.reject(erro);
  }
);

export default api;
