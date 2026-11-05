import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { obterTokenCliente, tokenValido } from '../services/authStorage';

// Importações do cliente
import ClientHome from '../pages/client/ClientHome/ClientHome';
import ClientBooking from '../pages/client/ClientBooking/ClientBooking';
import ClientProfile from '../pages/client/ClientProfile/ClientProfile';
import BarberShopDetails from '../pages/client/BarberShopDetails/BarberShopDetails';

// Só entra quem tem sessão de cliente válida (o backend confere o token em toda requisição)
const PrivateRoute = ({ children }) => {
  const token = obterTokenCliente();
  return token && tokenValido(token, 'cliente') ? children : <Navigate to="/auth/cliente" replace />;
};

const ClientRoutes = () => {
  return (
    <>
      {/* Rotas do cliente protegidas */}
      <Route 
        path="/cliente" 
        element={
          <PrivateRoute>
            <ClientHome />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/cliente/agendamentos" 
        element={
          <PrivateRoute>
            <ClientBooking />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/cliente/perfil" 
        element={
          <PrivateRoute>
            <ClientProfile />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/cliente/barbearia/:id" 
        element={
          <PrivateRoute>
            <BarberShopDetails />
          </PrivateRoute>
        } 
      />
    </>
  );
};

export default ClientRoutes;