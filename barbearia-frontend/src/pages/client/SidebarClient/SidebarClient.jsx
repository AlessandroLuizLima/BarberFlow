import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHome, FiCalendar, FiUser, FiLogOut, FiSun, FiMoon, FiMenu, FiX
} from "react-icons/fi"; // Ícones do React Icons
const SidebarClient = () => {  // Renomeei para SidebarClient para consistência com o App.js
  const [isLightMode, setIsLightMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Para mobile

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const body = document.body;
    if (isLightMode) {
      body.classList.add("light-mode");
    } else {
      body.classList.remove("light-mode");
    }
  }, [isLightMode]);

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
            <h2>Bem-vindo, Cliente</h2>
            <p>Agende seus serviços</p>
          </div>
        </div>

        <nav className="menu">
          <ul>
            <li><Link to="/client" onClick={closeSidebar}><FiHome className="icon" /> Home</Link></li>
            <li><Link to="/client/agendamentos" onClick={closeSidebar}><FiCalendar className="icon" /> Agendamentos</Link></li>
            <li><Link to="/client/perfil" onClick={closeSidebar}><FiUser className="icon" /> Perfil</Link></li>
          </ul>
        </nav>

        <div className="bottom-options">
          <div className="mode-toggle" onClick={toggleTheme}>
            {isLightMode ? <FiMoon className="icon" /> : <FiSun className="icon" />}
            {isLightMode ? "Modo Escuro" : "Modo Claro"}
          </div>
          <div className="logout" onClick={() => navigate('/')}> {/* Pode levar para login ou home */}
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