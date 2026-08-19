import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuHouse, LuCalendarDays, LuUser, LuScissors, LuBox,
  LuWallet, LuChartBarDecreasing, LuLogOut, LuSun, LuMoon
} from "react-icons/lu";
import { GoGear } from "react-icons/go";
import "./sidebar.css";
import Logo from "../../../assets/imagens/logo.png";

const Sidebar = () => {
  const [isLightMode, setIsLightMode] = useState(false);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
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
    <aside className="sidebar">
      <div className="profile">
        <img className="profile-icon" src={Logo} alt="LogoBarbearia"/>
        <div className="profile-text">
          <h2>Bem-vindo, Alessandro</h2>
          <p>Gerenciando Barbearia Style's</p>
        </div>
      </div>

      <nav className="menu">
        <ul>
          <li><Link to="/dashboard"><LuHouse className="icon" /> Dashboard</Link></li>
          <li><Link to="/dashboard/agenda"><LuCalendarDays className="icon" /> Agenda</Link></li>
          <li><Link to="/dashboard/clientes"><LuUser className="icon" /> Clientes</Link></li>
          <li><Link to="/dashboard/servicos"><LuScissors className="icon" /> Serviços</Link></li>
          <li><Link to="/dashboard/produtos"><LuBox className="icon" /> Produtos</Link></li>
          <li><Link to="/dashboard/financeiro"><LuWallet className="icon" /> Financeiro</Link></li>
          <li><Link to="/dashboard/relatorio"><LuChartBarDecreasing className="icon" /> Relatórios</Link></li>
          <li><Link to="/dashboard/configuracoes"><GoGear className="icon" /> Configurações</Link></li>
        </ul>
      </nav>

      <div className="bottom-options">
        <div className="mode-toggle" onClick={toggleTheme}>
          {isLightMode ? <LuMoon className="icon" /> : <LuSun className="icon" />}
          {isLightMode ? "Modo Escuro" : "Modo Claro"}
        </div>
        <div className="logout" onClick={() => navigate('/')}>
          <LuLogOut className="icon" /> Sair
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
