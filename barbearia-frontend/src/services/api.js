import axios from 'axios';

// URL do backend. Em produção, defina VITE_API_URL no .env do frontend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
