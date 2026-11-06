// Barra superior do celular e do tablet (até 1024px): botão do menu, nome da tela e logo.
// No computador ela some e o menu lateral fica sempre aberto.
import React from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import './BarraMobile.css';

export default function BarraMobile({ titulo, subtitulo, aberto, onAlternar, imagem }) {
  return (
    <header className="barra-mobile">
      <button
        type="button"
        className="barra-mobile__menu"
        onClick={onAlternar}
        aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={aberto}
        aria-controls="menu-lateral"
      >
        {aberto ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>
      <div className="barra-mobile__texto">
        <strong>{titulo}</strong>
        {subtitulo && <span>{subtitulo}</span>}
      </div>
      {imagem && <img className="barra-mobile__imagem" src={imagem} alt="" />}
    </header>
  );
}
