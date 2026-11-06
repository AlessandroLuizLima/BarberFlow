import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LuHouse, LuCalendarDays, LuUser, LuUsers, LuScissors, LuBox,
  LuWallet, LuChartBarDecreasing, LuLogOut, LuSun, LuMoon
} from "react-icons/lu";
import { GoGear } from "react-icons/go";
import "./Sidebar.css";
import Logo from "../../../assets/imagens/logo.png";
import useConfiguracaoBarbearia from "../../../hooks/useConfiguracaoBarbearia";
import { obterBarbeiroLogado, encerrarSessaoBarbeiro } from "../../../services/authStorage";
import BarraMobile from "../../../components/BarraMobile/BarraMobile";
import useMenuMobile from "../../../hooks/useMenuMobile";

const ITENS = [
  { para: "/dashboard", rotulo: "Dashboard", Icone: LuHouse, fim: true },
  { para: "/dashboard/agenda", rotulo: "Agenda", Icone: LuCalendarDays },
  { para: "/dashboard/clientes", rotulo: "Clientes", Icone: LuUser },
  { para: "/dashboard/servicos", rotulo: "Serviços", Icone: LuScissors },
  { para: "/dashboard/barbeiros", rotulo: "Barbeiros", Icone: LuUsers },
  { para: "/dashboard/produtos", rotulo: "Produtos", Icone: LuBox },
  { para: "/dashboard/financeiro", rotulo: "Financeiro", Icone: LuWallet },
  { para: "/dashboard/relatorio", rotulo: "Relatórios", Icone: LuChartBarDecreasing },
  { para: "/dashboard/configuracoes", rotulo: "Configurações", Icone: GoGear }
];

const Sidebar = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  // Nome e logo vêm das Configurações da barbearia (banco) e atualizam assim que o barbeiro salva
  const { config } = useConfiguracaoBarbearia();
  const nomeBarbearia = config?.nome || "sua barbearia";
  const primeiroNome = obterBarbeiroLogado()?.nome?.split(" ")[0] || "barbeiro";

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
  const { pathname } = useLocation();
  const menu = useMenuMobile();
  const telaAtual = ITENS.find((i) => (i.fim ? pathname === i.para : pathname.startsWith(i.para)))?.rotulo || "Painel";

  return (
    <>
    <BarraMobile
      titulo={telaAtual}
      subtitulo={nomeBarbearia}
      aberto={menu.aberto}
      onAlternar={menu.alternar}
      imagem={config?.logo || Logo}
    />
    <aside id="menu-lateral" className={`sidebar ${menu.aberto ? "open" : ""}`}>
      <div className="profile">
        <img
          className={`profile-icon ${config?.logo ? "profile-icon--custom" : ""}`}
          src={config?.logo || Logo}
          alt={`Logo ${nomeBarbearia}`}
        />
        <div className="profile-text">
          <h2>Bem-vindo, {primeiroNome}</h2>
          <p>Gerenciando {nomeBarbearia}</p>
        </div>
      </div>

      <nav className="menu">
        <ul>
          {ITENS.map(({ para, rotulo, Icone, fim }) => (
            <li key={para}>
              <NavLink to={para} end={fim} className={({ isActive }) => (isActive ? "ativo" : undefined)}>
                {React.createElement(Icone, { className: "icon" })} {rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="bottom-options">
        <div className="mode-toggle" onClick={toggleTheme}>
          {isLightMode ? <LuMoon className="icon" /> : <LuSun className="icon" />}
          {isLightMode ? "Modo Escuro" : "Modo Claro"}
        </div>
        <div className="logout" onClick={() => { encerrarSessaoBarbeiro(); navigate('/'); }}>
          <LuLogOut className="icon" /> Sair
        </div>
      </div>
    </aside>
    {menu.aberto && <div className="menu-fundo" onClick={menu.fechar} aria-hidden="true" />}
    </>
  );
};

export default Sidebar;
