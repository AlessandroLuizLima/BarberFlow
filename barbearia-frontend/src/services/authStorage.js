// Armazena os dados mínimos da sessão do cliente logado no navegador.
const CHAVE = 'clienteLogado';
// Disparado quando os dados do cliente logado mudam (ex.: nova foto), para a sidebar se atualizar
export const EVENTO_CLIENTE = 'cliente-logado-atualizado';

export const salvarSessaoCliente = (cliente) => {
  localStorage.setItem('auth', 'true');
  localStorage.setItem(CHAVE, JSON.stringify(cliente));
  window.dispatchEvent(new CustomEvent(EVENTO_CLIENTE, { detail: cliente }));
};

export const obterClienteLogado = () => {
  const dados = localStorage.getItem(CHAVE);
  return dados ? JSON.parse(dados) : null;
};

export const encerrarSessaoCliente = () => {
  localStorage.removeItem('auth');
  localStorage.removeItem(CHAVE);
};
