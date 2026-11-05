import api from './api';
import { deApi } from './configuracaoService';

// Barbearias com assinatura ativa (dados públicos), já no formato usado no app
export const listarBarbeariasPublicas = () =>
  api.get('/barbearias').then((r) => (Array.isArray(r.data) ? r.data.map(deApi) : []));
