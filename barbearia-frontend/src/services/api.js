import axios from 'axios';

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

export default api;
