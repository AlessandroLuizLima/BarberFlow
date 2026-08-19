import React from 'react';
import { Route, Navigate } from 'react-router-dom';

// Importações do dashboard barbeiro
import Dashboard from '../pages/dashboardBarber/Dashboard/Dashboard';
import Agenda from '../pages/dashboardBarber/Schedule/Schedule';
import Clients from '../pages/dashboardBarber/Clients/Clients';
import Services from '../pages/dashboardBarber/Services/Services';
import Products from '../pages/dashboardBarber/Products/Products';
import Financial from '../pages/dashboardBarber/Financial/Financial';
import Report from '../pages/dashboardBarber/Report/Report';
import Barbers from '../pages/dashboardBarber/Barbers/Barbers';
import Settings from '../pages/dashboardBarber/Settings/Settings';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const isAuth = localStorage.getItem('auth') === 'true';
  return isAuth ? children : <Navigate to="/auth" />;
};

const BarberRoutes = () => {
  return (
    <>
      {/* Rotas do dashboard barbeiro protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/agenda" 
        element={
          <PrivateRoute>
            <Agenda />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/clientes" 
        element={
          <PrivateRoute>
            <Clients />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/servicos" 
        element={
          <PrivateRoute>
            <Services />
          </PrivateRoute>
        }
      />
      <Route 
        path="/dashboard/produtos"
        element={
          <PrivateRoute>
            <Products />
          </PrivateRoute>
        }
      />
      <Route 
        path="/dashboard/financeiro"
        element={
          <PrivateRoute>
            <Financial />
          </PrivateRoute>
        }
      />
      <Route 
        path="/dashboard/relatorio"
        element={
          <PrivateRoute>
            <Report />
          </PrivateRoute>
        }
      />
      <Route 
        path="/dashboard/barbeiros" 
        element={
          <PrivateRoute>
            <Barbers />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes" 
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } 
      />
    </>
  );
};

export default BarberRoutes;