// Sessões guardadas no navegador. Cliente e barbeiro têm sessões separadas:
// entrar como cliente NÃO dá acesso ao painel do barbeiro (e vice-versa).
// O token é conferido pelo backend em toda requisição; isto aqui só lembra quem está logado.
const CHAVE_CLIENTE = 'sessaoCliente';
const CHAVE_BARBEIRO = 'sessaoBarbeiro';

// Disparado quando os dados do cliente logado mudam (ex.: nova foto), para a sidebar se atualizar
export const EVENTO_CLIENTE = 'cliente-logado-atualizado';

const ler = (chave) => {
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || 'null');
    return dados && typeof dados.token === 'string' ? dados : null;
  } catch {
    return null;
  }
};

const gravar = (chave, valor) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // armazenamento indisponível (modo privado com cota cheia): a sessão vale só nesta aba
  }
};

// Limpa as chaves antigas da versão sem login de verdade ("auth" = "true" dava acesso a tudo)
try {
  localStorage.removeItem('auth');
  localStorage.removeItem('clienteLogado');
} catch {
  // ignora
}

// ---------- Cliente ----------
export const salvarSessaoCliente = (cliente, token) => {
  const atual = ler(CHAVE_CLIENTE);
  const tokenFinal = token || atual?.token;
  if (!tokenFinal) return;
  gravar(CHAVE_CLIENTE, { token: tokenFinal, cliente });
  window.dispatchEvent(new CustomEvent(EVENTO_CLIENTE, { detail: cliente }));
};

export const obterClienteLogado = () => ler(CHAVE_CLIENTE)?.cliente || null;
export const obterTokenCliente = () => ler(CHAVE_CLIENTE)?.token || null;

export const encerrarSessaoCliente = () => {
  try { localStorage.removeItem(CHAVE_CLIENTE); } catch { /* ignora */ }
};

// ---------- Barbeiro ----------
export const salvarSessaoBarbeiro = (barbeiro, token) => gravar(CHAVE_BARBEIRO, { token, barbeiro });
export const obterBarbeiroLogado = () => ler(CHAVE_BARBEIRO)?.barbeiro || null;
export const obterTokenBarbeiro = () => ler(CHAVE_BARBEIRO)?.token || null;

export const encerrarSessaoBarbeiro = () => {
  try { localStorage.removeItem(CHAVE_BARBEIRO); } catch { /* ignora */ }
};

// Confere validade e papel do token só para decidir a navegação (quem garante a segurança é o backend)
export const tokenValido = (token, papel) => {
  try {
    const { exp, papel: papelDoToken } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof exp === 'number' && exp * 1000 > Date.now() && (!papel || papelDoToken === papel);
  } catch {
    return false;
  }
};
