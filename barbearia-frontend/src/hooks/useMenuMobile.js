import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Estado do menu lateral no celular: fecha ao trocar de tela, com Esc e ao voltar para o computador,
// e trava a rolagem da página enquanto está aberto.
export default function useMenuMobile() {
  const [aberto, setAberto] = useState(false);
  const { pathname, search } = useLocation();

  useEffect(() => { setAberto(false); }, [pathname, search]);

  useEffect(() => {
    document.body.classList.toggle('menu-aberto', aberto);
    if (!aberto) return undefined;
    const aoTeclar = (e) => { if (e.key === 'Escape') setAberto(false); };
    const aoRedimensionar = () => { if (window.innerWidth > 1024) setAberto(false); };
    window.addEventListener('keydown', aoTeclar);
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('resize', aoRedimensionar);
      document.body.classList.remove('menu-aberto');
    };
  }, [aberto]);

  const alternar = useCallback(() => setAberto((a) => !a), []);
  const fechar = useCallback(() => setAberto(false), []);
  return { aberto, alternar, fechar };
}
