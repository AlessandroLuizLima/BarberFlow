import React, { useState, useEffect } from "react";
import "./SidebarClient.css";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHome, FiCalendar, FiUser, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiSettings
} from "react-icons/fi"; // Ícones do React Icons
import { obterClienteLogado, encerrarSessaoCliente } from "../../../services/authStorage";
import { obterTema, aplicarTema, salvarTema } from "../../../utils/tema";

const SidebarClient = () => {  // Renomeei para SidebarClient para consistência com o App.js
  const clienteLogado = obterClienteLogado();
  const [isLightMode, setIsLightMode] = useState(obterTema() === 'claro');
  const [isOpen, setIsOpen] = useState(false); // Para mobile

  const toggleTheme = () => {
    salvarTema(isLightMode ? 'escuro' : 'claro');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Aplica o tema salvo e acompanha mudanças feitas em outras telas (ex.: Configurações)
  useEffect(() => {
    const sincronizar = () => {
      const tema = obterTema();
      aplicarTema(tema);
      setIsLightMode(tema === 'claro');
    };
    sincronizar();
    window.addEventListener('tema-cliente', sincronizar);
    return () => window.removeEventListener('tema-cliente', sincronizar);
  }, []);

  const navigate = useNavigate();

  return (
    <>
      {/* Botão Hambúrguer para Mobile */}
      <button 
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="profile">
          <div className="profile-icon">
            <FiUser size={28} /> {/* Ícone genérico para cliente */}
          </div>
          <div className="profile-text">
            <h2>Bem-vindo, {clienteLogado?.nome_completo?.split(' ')[0] || 'Cliente'}</h2>
            <p>Agende seus serviços</p>
          </div>
        </div>

        <nav className="menu">
          <ul>
            <li><Link to="/cliente" onClick={closeSidebar}><FiHome className="icon" /> Home</Link></li>
            <li><Link to="/cliente/agendamentos" onClick={closeSidebar}><FiCalendar className="icon" /> Agendamentos</Link></li>
            <li><Link to="/cliente/perfil" onClick={closeSidebar}><FiSettings className="icon" /> Configurações</Link></li>
          </ul>
        </nav>

        <div className="bottom-options">
          <div className="mode-toggle" onClick={toggleTheme}>
            {isLightMode ? <FiMoon className="icon" /> : <FiSun className="icon" />}
            {isLightMode ? "Modo Escuro" : "Modo Claro"}
          </div>
          <div className="logout" onClick={() => { encerrarSessaoCliente(); navigate('/'); }}>
            <FiLogOut className="icon" /> Sair
          </div>
        </div>
      </aside>

      {/* Overlay para Mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
    </>
  );
};

export default SidebarClient;