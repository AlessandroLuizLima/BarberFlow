import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './assets/css/App.css';

// Importação das rotas
import HomeRoutes from './routes/routeHome';
import BarberRoutes from './routes/routeBarber';
import ClientRoutes from './routes/routeClient';

// Importação dos Sidebars
import Sidebar from './pages/dashboardBarber/Sidebar/Sidebar';
import SidebarClient from './pages/client/SidebarClient/SidebarClient';

function App() {
  const location = useLocation();

  // Verifica se a URL atual está dentro do dashboard barbeiro ou cliente
  const isDashboardBarber = location.pathname.startsWith('/dashboard');
  const isClient = location.pathname.startsWith('/client');

  return (
    <div className="app-container">
      {isDashboardBarber && <Sidebar />}
      {isClient && <SidebarClient />}

      <div className="main-content">
        <Routes>
          {/* Rotas da Home/Landing e Auth */}
          {HomeRoutes()}

          {/* Rotas do Dashboard Barbeiro */}
          {BarberRoutes()}

          {/* Rotas do Cliente */}
          {ClientRoutes()}

          {/* Rota fallback para páginas não encontradas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;