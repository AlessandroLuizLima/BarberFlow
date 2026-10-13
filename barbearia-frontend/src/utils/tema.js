// Tema (claro/escuro) do lado do cliente, salvo no navegador.
const CHAVE = 'tema-cliente';

export const obterTema = () => (localStorage.getItem(CHAVE) === 'claro' ? 'claro' : 'escuro');

export const aplicarTema = (tema) => {
  document.body.classList.toggle('light-mode', tema === 'claro');
};

export const salvarTema = (tema) => {
  localStorage.setItem(CHAVE, tema);
  aplicarTema(tema);
  window.dispatchEvent(new Event('tema-cliente'));
};
