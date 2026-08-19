import React from 'react';
import { Route, Navigate } from 'react-router-dom';

// Importações do cliente
import ClientHome from '../pages/client/ClientHome/ClientHome';
import ClientBooking from '../pages/client/ClientBooking/ClientBooking';
import ClientProfile from '../pages/client/ClientProfile/ClientProfile';
import BarberShopDetails from '../pages/client/BarberShopDetails/BarberShopDetails';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const isAuth = localStorage.getItem('auth') === 'true';
  return isAuth ? children : <Navigate to="/auth" />;
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