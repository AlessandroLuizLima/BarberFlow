import api from './api';

// Envia a mensagem do formulário "Entre em contato" para o e-mail do suporte
export const enviarContato = (dados) => api.post('/contato', dados).then((r) => r.data);
