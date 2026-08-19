import React from 'react';
import { Route } from 'react-router-dom';

// Importação da landing page
import LandingPage from '../pages/landingPage/LandingPage';

// Importação da página de autenticação
import AuthPage from '../pages/auth/AuthPage';

const HomeRoutes = () => {
  return (
    <>
      {/* Rota única para a landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Rota para autenticação do barbeiro*/}
      <Route path="/auth/barbeiro" element={<AuthPage />} />

      {/* Rota para autenticação do cliente*/}
      <Route path="/auth/cliente" element={<AuthPage />} />
    </> 
  );
};

export default HomeRoutes;