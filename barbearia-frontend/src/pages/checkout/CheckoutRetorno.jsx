// Volta do Mercado Pago (/assinar/retorno?external_reference=<pedido>&payment_id=...&status=...).
// Quem decide se foi pago é o backend (consulta o pagamento direto no Mercado Pago);
// esta página só acompanha até o pedido ser aprovado.
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiXCircle, FiMail } from 'react-icons/fi';
import { consultarPedido } from '../../services/assinaturaService';
import { formatarPreco } from '../../data/planos';
import { CheckoutLayout } from './Checkout';
import './Checkout.css';

const INTERVALO_MS = 4000;
const TENTATIVAS = 30; // ~2 minutos acompanhando um pagamento pendente

const CheckoutRetorno = () => {
  const [params] = useSearchParams();
  const pedidoId = params.get('external_reference') || params.get('pedido');
  const pagamentoId = params.get('payment_id') || params.get('collection_id');
  const statusMp = params.get('status') || params.get('collection_status');

  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState('');
  const tentativas = useRef(0);

  useEffect(() => {
    if (!pedidoId) return undefined;
    let ativo = true;
    let timer;

    const consultar = () => {
      consultarPedido(pedidoId, pagamentoId)
        .then((dados) => {
          if (!ativo) return;
          setPedido(dados);
          tentativas.current += 1;
          if (dados.status === 'pendente' && tentativas.current < TENTATIVAS) timer = setTimeout(consultar, INTERVALO_MS);
        })
        .catch((error) => {
          if (!ativo) return;
          setErro(error.response?.status === 404 ? 'Pedido não encontrado.' : 'Não foi possível consultar o pagamento agora.');
        });
    };
    consultar();
    return () => { ativo = false; clearTimeout(timer); };
  }, [pedidoId, pagamentoId]);

  const status = pedido?.status;
  const renovacao = pedido?.tipo === 'renovacao';

  let conteudo;
  if (!pedidoId || erro) {
    conteudo = (
      <>
        <FiXCircle className="ck-icone ck-icone--erro" />
        <h1>{erro || 'Não encontramos o seu pedido'}</h1>
        <p>Se você já pagou, confira seu e-mail. Em caso de dúvida, fale com a gente pelo formulário de contato da Home.</p>
      </>
    );
  } else if (!pedido) {
    conteudo = (
      <>
        <FiClock className="ck-icone ck-icone--pendente ck-girando" />
        <h1>Conferindo o pagamento...</h1>
      </>
    );
  } else if (status === 'aprovado') {
    conteudo = (
      <>
        <FiCheckCircle className="ck-icone ck-icone--ok" />
        <h1>{renovacao ? 'Assinatura renovada!' : 'Pagamento aprovado!'}</h1>
        <p className="ck-destaque">{pedido.plano} · {formatarPreco(pedido.valor)}</p>
        {renovacao ? (
          <p>O novo período já está valendo no seu painel.</p>
        ) : (
          <div className="ck-email-box">
            <FiMail size={20} />
            <div>
              <strong>{pedido.email_enviado ? 'Enviamos seu acesso por e-mail' : 'Estamos enviando seu acesso por e-mail'}</strong>
              <p>
                Confira a caixa de entrada (e o spam) de <b>{pedido.email}</b>. Lá estão o login e a senha temporária.
                Entre em <em>Área do Barbeiro</em>, crie a sua senha e configure a barbearia.
              </p>
            </div>
          </div>
        )}
        <Link to={renovacao ? '/dashboard/configuracoes?aba=conta' : '/auth/barbeiro'} className="ck-btn ck-btn--link">
          {renovacao ? 'Voltar ao painel' : 'Ir para o login do barbeiro'}
        </Link>
      </>
    );
  } else if (status === 'pendente') {
    const esgotou = tentativas.current >= TENTATIVAS;
    conteudo = (
      <>
        <FiClock className={`ck-icone ck-icone--pendente ${esgotou ? '' : 'ck-girando'}`} />
        <h1>Pagamento em processamento</h1>
        <p>
          {statusMp === 'in_process' || statusMp === 'pending'
            ? 'Pix e boleto podem levar alguns minutos (boleto, até 3 dias úteis) para serem confirmados.'
            : 'Estamos aguardando a confirmação do Mercado Pago.'}
          {' '}Assim que for aprovado, o acesso chega em <b>{pedido.email}</b>. Pode fechar esta página.
        </p>
      </>
    );
  } else {
    conteudo = (
      <>
        <FiXCircle className="ck-icone ck-icone--erro" />
        <h1>{status === 'recusado' ? 'Pagamento recusado' : 'Pedido cancelado'}</h1>
        <p>Nenhum valor foi cobrado por este pedido. Você pode tentar de novo com outra forma de pagamento.</p>
        <Link to="/#prices" className="ck-btn ck-btn--link">Escolher um plano</Link>
      </>
    );
  }

  return (
    <CheckoutLayout>
      <div className="ck-card ck-status" aria-live="polite">{conteudo}</div>
    </CheckoutLayout>
  );
};

export default CheckoutRetorno;
