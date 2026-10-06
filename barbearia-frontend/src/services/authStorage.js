// Armazena os dados mínimos da sessão do cliente logado no navegador.
const CHAVE = 'clienteLogado';

export const salvarSessaoCliente = (cliente) => {
  localStorage.setItem('auth', 'true');
  localStorage.setItem(CHAVE, JSON.stringify(cliente));
};

export const obterClienteLogado = () => {
  const dados = localStorage.getItem(CHAVE);
  return dados ? JSON.parse(dados) : null;
};

export const encerrarSessaoCliente = () => {
  localStorage.removeItem('auth');
  localStorage.removeItem(CHAVE);
};
