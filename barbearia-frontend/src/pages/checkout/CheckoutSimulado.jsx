// Pagamento de DEMONSTRAÇÃO (/assinar/simulado/:pedido).
// Só existe quando o backend roda com PAGAMENTO_SIMULADO=true (sem conta no Mercado Pago).
// Em produção o checkout vai direto para o Mercado Pago e esta página não é usada.
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';
import { simularPagamento } from '../../services/assinaturaService';
import { CheckoutLayout } from './Checkout';
import './Checkout.css';

const CheckoutSimulado = () => {
  const { pedido } = useParams();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const pagar = async () => {
    setEnviando(true);
    setErro('');
    try {
      await simularPagamento(pedido);
      navigate(`/assinar/retorno?external_reference=${encodeURIComponent(pedido)}`, { replace: true });
    } catch (error) {
      setErro(error.response?.status === 404
        ? 'O pagamento simulado está desligado no servidor (PAGAMENTO_SIMULADO).'
        : error.response?.data?.error || 'Não foi possível concluir o pagamento simulado.');
      setEnviando(false);
    }
  };

  return (
    <CheckoutLayout>
      <div className="ck-card ck-status">
        <FiAlertTriangle className="ck-icone ck-icone--pendente" />
        <h1>Pagamento de demonstração</h1>
        <p>
          O servidor está em modo de demonstração, sem Mercado Pago. Nenhum valor é cobrado:
          o botão abaixo aprova o pedido como se o pagamento tivesse sido feito.
        </p>
        {erro && <p className="ck-erro" role="alert">{erro}</p>}
        <button type="button" className="ck-btn" onClick={pagar} disabled={enviando}>
          {enviando ? 'Aprovando...' : 'Simular pagamento aprovado'}
        </button>
        <Link to="/#prices" className="ck-link-sec">Cancelar</Link>
      </div>
    </CheckoutLayout>
  );
};

export default CheckoutSimulado;
