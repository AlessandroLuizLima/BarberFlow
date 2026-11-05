import React from 'react';
import { Route } from 'react-router-dom';

// Importação da landing page
import LandingPage from '../pages/landingPage/LandingPage';

// Importação da página de autenticação
import AuthPage from '../pages/auth/AuthPage';

// Compra de planos (checkout Mercado Pago)
import Checkout from '../pages/checkout/Checkout';
import CheckoutRetorno from '../pages/checkout/CheckoutRetorno';
import CheckoutSimulado from '../pages/checkout/CheckoutSimulado';

const HomeRoutes = () => {
  return (
    <>
      {/* Rota única para a landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Rota para autenticação do barbeiro*/}
      <Route path="/auth/barbeiro" element={<AuthPage />} />

      {/* Rota para autenticação do cliente*/}
      <Route path="/auth/cliente" element={<AuthPage />} />

      {/* Compra de plano: dados -> Mercado Pago -> volta com o resultado */}
      <Route path="/assinar/retorno" element={<CheckoutRetorno />} />
      <Route path="/assinar/simulado/:pedido" element={<CheckoutSimulado />} />
      <Route path="/assinar/:plano" element={<Checkout />} />
    </> 
  );
};

export default HomeRoutes;