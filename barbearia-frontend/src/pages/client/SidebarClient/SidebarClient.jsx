import React, { useState, useEffect } from "react";
import "./SidebarClient.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome, FiCalendar, FiUser, FiLogOut, FiSun, FiMoon, FiSettings
} from "react-icons/fi"; // Ícones do React Icons
import { obterClienteLogado, encerrarSessaoCliente, EVENTO_CLIENTE } from "../../../services/authStorage";
import { urlImagem } from "../../../services/api";
import { obterTema, aplicarTema, salvarTema } from "../../../utils/tema";
import BarraMobile from "../../../components/BarraMobile/BarraMobile";
import useMenuMobile from "../../../hooks/useMenuMobile";

const TITULOS = [
  ["/cliente/agendamentos", "Agendamentos"],
  ["/cliente/perfil", "Configurações"],
  ["/cliente/barbearia", "Barbearia"],
  ["/cliente", "Início"]
];

const SidebarClient = () => {  // Renomeei para SidebarClient para consistência com o App.js
  const [clienteLogado, setClienteLogado] = useState(obterClienteLogado());
  const [isLightMode, setIsLightMode] = useState(obterTema() === 'claro');
  const menu = useMenuMobile();
  const { pathname } = useLocation();
  const titulo = TITULOS.find(([rota]) => pathname.startsWith(rota))?.[1] || "BarberFlow";

  const toggleTheme = () => {
    salvarTema(isLightMode ? 'escuro' : 'claro');
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

  // Atualiza nome e foto quando o cliente muda os dados nas Configurações
  useEffect(() => {
    const aoAtualizar = (e) => setClienteLogado(e.detail);
    window.addEventListener(EVENTO_CLIENTE, aoAtualizar);
    return () => window.removeEventListener(EVENTO_CLIENTE, aoAtualizar);
  }, []);

  const navigate = useNavigate();

  return (
    <>
      <BarraMobile
        titulo={titulo}
        subtitulo={clienteLogado?.nome_completo ? `Olá, ${clienteLogado.nome_completo.split(' ')[0]}` : undefined}
        aberto={menu.aberto}
        onAlternar={menu.alternar}
        imagem={clienteLogado?.foto_url ? urlImagem(clienteLogado.foto_url) : null}
      />

      {/* Sidebar */}
      <aside id="menu-lateral" className={`sidebar ${menu.aberto ? 'open' : ''}`}>
        <div className="profile">
          <div className={`profile-icon ${clienteLogado?.foto_url ? 'profile-icon--foto' : ''}`}>
            {clienteLogado?.foto_url
              ? <img src={urlImagem(clienteLogado.foto_url)} alt="Foto de perfil" />
              : <FiUser size={28} />}
          </div>
          <div className="profile-text">
            <h2>Bem-vindo, {clienteLogado?.nome_completo?.split(' ')[0] || 'Cliente'}</h2>
            <p>Agende seus serviços</p>
          </div>
        </div>

        <nav className="menu">
          <ul>
            <li><NavLink to="/cliente" end className={({ isActive }) => (isActive ? 'ativo' : undefined)}><FiHome className="icon" /> Home</NavLink></li>
            <li><NavLink to="/cliente/agendamentos" className={({ isActive }) => (isActive ? 'ativo' : undefined)}><FiCalendar className="icon" /> Agendamentos</NavLink></li>
            <li><NavLink to="/cliente/perfil" className={({ isActive }) => (isActive ? 'ativo' : undefined)}><FiSettings className="icon" /> Configurações</NavLink></li>
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

      {menu.aberto && <div className="menu-fundo" onClick={menu.fechar} aria-hidden="true" />}
    </>
  );
};

export default SidebarClient;