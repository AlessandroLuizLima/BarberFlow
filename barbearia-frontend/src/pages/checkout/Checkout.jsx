// Checkout de um plano (/assinar/:plano).
// O barbeiro preenche os dados da barbearia, o backend cria o pedido e devolve o link do
// Mercado Pago. Depois do pagamento aprovado chega no e-mail dele o acesso ao painel.
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiLock, FiMail } from 'react-icons/fi';
import Logo from '../../assets/imagens/logo.png';
import { iniciarCheckout, listarPlanos } from '../../services/assinaturaService';
import { PLANOS, obterPlanoLocal, formatarPreco } from '../../data/planos';
import { formatarTelefone, apenasDigitos } from '../../utils/telefone';
import './Checkout.css';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutLayout({ children }) {
  return (
    <div className="ck-page">
      <header className="ck-header">
        <Link to="/" className="ck-logo">
          <img src={Logo} alt="" />
          <span>BarberFlow</span>
        </Link>
        <span className="ck-seguro"><FiLock size={14} /> Pagamento seguro via Mercado Pago</span>
      </header>
      <main className="ck-main">{children}</main>
    </div>
  );
}

const Checkout = () => {
  const { plano: chave } = useParams();
  const planoLocal = obterPlanoLocal(chave);
  const [preco, setPreco] = useState(planoLocal?.preco);
  const [form, setForm] = useState({ nome_responsavel: '', email: '', telefone: '', nome_barbearia: '' });
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Preço oficial (o mesmo que o backend cobra)
  useEffect(() => {
    listarPlanos()
      .then((lista) => {
        const oficial = lista.find((p) => p.chave === chave);
        if (oficial) setPreco(oficial.preco);
      })
      .catch(() => { /* mantém o preço exibido na Home */ });
  }, [chave]);

  if (!planoLocal) return <Navigate to="/#prices" replace />;

  const alterar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'telefone' ? formatarTelefone(value) : value }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setErro('');
    if (form.nome_responsavel.trim().length < 3) return setErro('Informe seu nome completo.');
    if (!REGEX_EMAIL.test(form.email.trim())) return setErro('Informe um e-mail válido: é nele que você vai receber o acesso.');
    if (form.nome_barbearia.trim().length < 2) return setErro('Informe o nome da barbearia.');
    const digitos = apenasDigitos(form.telefone);
    if (digitos && digitos.length < 10) return setErro('Telefone incompleto. Use DDD + número.');
    if (!aceite) return setErro('Confirme que leu e concorda com os termos para continuar.');

    setEnviando(true);
    try {
      const { url } = await iniciarCheckout({
        plano: chave,
        nome_responsavel: form.nome_responsavel.trim(),
        email: form.email.trim(),
        telefone: form.telefone || undefined,
        nome_barbearia: form.nome_barbearia.trim()
      });
      // Vai para a página de pagamento do Mercado Pago
      window.location.assign(url);
    } catch (error) {
      const status = error.response?.status;
      setErro(status === 429
        ? 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
        : error.response?.data?.error || 'Não foi possível abrir o pagamento. Verifique sua conexão e tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <CheckoutLayout>
      <Link to="/#prices" className="ck-voltar"><FiArrowLeft size={16} /> Voltar aos planos</Link>

      <div className="ck-grid">
        <form className="ck-card ck-form" onSubmit={enviar} noValidate>
          <h1>Dados da sua barbearia</h1>
          <p className="ck-sub">
            Depois do pagamento aprovado, enviamos para este e-mail o login e uma senha temporária do painel.
          </p>

          <label className="ck-field">
            <span>Seu nome completo</span>
            <input name="nome_responsavel" value={form.nome_responsavel} onChange={alterar} autoComplete="name" maxLength={100} required />
          </label>
          <label className="ck-field">
            <span>E-mail (será o login do painel)</span>
            <input type="email" name="email" value={form.email} onChange={alterar} autoComplete="email" maxLength={150} required />
          </label>
          <div className="ck-row">
            <label className="ck-field">
              <span>Nome da barbearia</span>
              <input name="nome_barbearia" value={form.nome_barbearia} onChange={alterar} autoComplete="organization" maxLength={100} required />
            </label>
            <label className="ck-field">
              <span>Telefone <em>(opcional)</em></span>
              <input type="tel" name="telefone" value={form.telefone} onChange={alterar} autoComplete="tel" placeholder="(00) 00000-0000" inputMode="numeric" />
            </label>
          </div>

          <label className="ck-check">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span>Entendo que a assinatura vale por 30 dias a cada pagamento e pode ser renovada pelo painel.</span>
          </label>

          {erro && <p className="ck-erro" role="alert">{erro}</p>}

          <button type="submit" className="ck-btn" disabled={enviando}>
            {enviando ? 'Abrindo o pagamento...' : `Ir para o pagamento · ${formatarPreco(preco)}`}
          </button>
          <p className="ck-nota"><FiLock size={13} /> Você vai para o site do Mercado Pago (Pix, cartão ou boleto). Não guardamos dados do cartão.</p>
        </form>

        <aside className="ck-card ck-resumo">
          <span className="ck-tag">Plano escolhido</span>
          <h2>{planoLocal.nome}</h2>
          <p className="ck-desc">{planoLocal.descricao}</p>
          <div className="ck-preco">
            <strong>{formatarPreco(preco)}</strong>
            <span>/ 30 dias</span>
          </div>
          <ul className="ck-recursos">
            {planoLocal.recursos.map((r) => <li key={r}><FiCheck size={15} /> {r}</li>)}
          </ul>
          <div className="ck-trocar">
            {PLANOS.filter((p) => p.chave !== chave).map((p) => (
              <Link key={p.chave} to={`/assinar/${p.chave}`}>Trocar para {p.nome.replace('Plano ', '')}</Link>
            ))}
          </div>
          <div className="ck-passos">
            <p><FiMail size={14} /> <strong>Como funciona</strong></p>
            <ol>
              <li>Você paga no Mercado Pago.</li>
              <li>Recebe por e-mail o login e a senha temporária.</li>
              <li>Entra em <em>Área do Barbeiro</em> na Home, cria sua senha e configura a barbearia.</li>
            </ol>
          </div>
        </aside>
      </div>
    </CheckoutLayout>
  );
};

export default Checkout;
