import api from './api';

// Produtos da barbearia do barbeiro logado (painel)
export const listarProdutos = () => api.get('/produtos').then((r) => r.data);
export const criarProduto = (dados) => api.post('/produtos', dados).then((r) => r.data);
export const atualizarProduto = (id, dados) => api.put(`/produtos/${id}`, dados).then((r) => r.data);
export const excluirProduto = (id) => api.delete(`/produtos/${id}`).then((r) => r.data);

// Venda no balcão: baixa o estoque e entra no Financeiro
export const venderProduto = (id, quantidade) => api.post(`/produtos/${id}/vendas`, { quantidade }).then((r) => r.data);
export const listarVendasProdutos = () => api.get('/vendas-produtos').then((r) => r.data);

// Público: produtos ativos de uma barbearia (página da barbearia no app do cliente)
export const listarProdutosDaBarbearia = (barbeariaId) =>
  api.get(`/barbearias/${encodeURIComponent(barbeariaId)}/produtos`).then((r) => r.data);
