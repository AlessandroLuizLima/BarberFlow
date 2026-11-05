// Aba "Conta e plano" das Configurações do barbeiro:
// - troca da senha (obrigatória no primeiro acesso, com a senha temporária recebida por e-mail);
// - plano atual, vencimento, renovação/troca de plano (checkout do Mercado Pago) e pagamentos.
import React, { useEffect, useState } from "react";
import { FiShield, FiCreditCard, FiAlertTriangle, FiCheck, FiLock, FiRefreshCw } from "react-icons/fi";
import { obterAssinatura, iniciarCheckout } from "../../../services/assinaturaService";
import { trocarSenhaBarbeiro } from "../../../services/clienteService";
import { obterBarbeiroLogado, salvarSessaoBarbeiro } from "../../../services/authStorage";
import { PLANOS, formatarPreco } from "../../../data/planos";

const STATUS_PEDIDO = { aprovado: "Pago", pendente: "Aguardando", recusado: "Recusado", cancelado: "Cancelado" };
const BADGE_PEDIDO = { aprovado: "enviado", pendente: "simulado", recusado: "falhou", cancelado: "falhou" };

const dataBR = (valor) => (valor ? new Date(valor).toLocaleDateString("pt-BR") : "—");
const diasAte = (valor) => (valor ? Math.ceil((new Date(valor) - Date.now()) / 86400000) : null);
const limite = (n, unidade) => (n === null || n === undefined || n === Infinity ? `${unidade} ilimitados` : `Até ${n} ${unidade}`);

const regraSenha = (senha) => {
  if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha)) return "A senha deve ter letras e números.";
  return null;
};

export default function ContaAssinatura({ onSenhaDefinida }) {
  const [barbeiro, setBarbeiro] = useState(obterBarbeiroLogado());
  const primeiroAcesso = Boolean(barbeiro?.senha_temporaria);

  // ---- Senha
  const [senha, setSenha] = useState({ atual: "", nova: "", confirmar: "" });
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState(null);

  // ---- Assinatura
  const [assinatura, setAssinatura] = useState(null);
  const [erroAssinatura, setErroAssinatura] = useState("");
  const [abrindo, setAbrindo] = useState(null);

  useEffect(() => {
    obterAssinatura()
      .then(setAssinatura)
      .catch(() => setErroAssinatura("Não foi possível carregar o plano agora."));
  }, []);

  const alterarSenha = (e) => setSenha((s) => ({ ...s, [e.target.name]: e.target.value }));

  const salvarSenha = async (e) => {
    e.preventDefault();
    setAvisoSenha(null);
    const erro = !senha.atual
      ? (primeiroAcesso ? "Digite a senha temporária que chegou no seu e-mail." : "Digite a senha atual.")
      : regraSenha(senha.nova) || (senha.nova !== senha.confirmar ? "As senhas não coincidem." : null);
    if (erro) return setAvisoSenha({ tipo: "erro", texto: erro });

    setSalvandoSenha(true);
    try {
      const resposta = await trocarSenhaBarbeiro(senha.atual, senha.nova);
      // A senha nova derruba a sessão antiga: guarda o token novo que veio na resposta
      salvarSessaoBarbeiro(resposta.barbeiro, resposta.token);
      setBarbeiro(resposta.barbeiro);
      setSenha({ atual: "", nova: "", confirmar: "" });
      setAvisoSenha({ tipo: "ok", texto: "Senha alterada! Use a nova senha nos próximos acessos." });
      onSenhaDefinida?.();
    } catch (error) {
      const status = error.response?.status;
      setAvisoSenha({
        tipo: "erro",
        texto: status === 429 ? "Muitas tentativas. Aguarde alguns minutos." : error.response?.data?.error || "Não foi possível alterar a senha."
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const assinar = async (chave) => {
    setAbrindo(chave);
    setErroAssinatura("");
    try {
      // Logado como barbeiro = renovação da própria barbearia (não cria conta nova)
      const { url } = await iniciarCheckout({ plano: chave });
      window.location.assign(url);
    } catch (error) {
      setErroAssinatura(error.response?.data?.error || "Não foi possível abrir o pagamento. Tente novamente.");
      setAbrindo(null);
    }
  };

  const plano = assinatura?.plano;
  const dias = diasAte(assinatura?.expira_em);
  const vencendo = dias !== null && dias <= 7;

  return (
    <div>
      {primeiroAcesso && (
        <div className="conta-alerta" role="alert">
          <FiAlertTriangle size={20} />
          <div>
            <strong>Bem-vindo ao BarberFlow! Crie a sua senha para continuar.</strong>
            <p>Você entrou com a senha temporária do e-mail. Defina uma senha só sua; depois configure o Perfil da Empresa (nome, logo, endereço e horários) para aparecer para os clientes.</p>
          </div>
        </div>
      )}

      <form className="form-section" onSubmit={salvarSenha} noValidate>
        <h3 className="form-section-title">
          <FiShield size={20} />
          {primeiroAcesso ? "Criar senha" : "Alterar senha"}
        </h3>
        <p className="section-description">
          Login do painel: <strong>{barbeiro?.email}</strong>. A senha precisa de 8 caracteres ou mais, com letras e números.
        </p>
        <div className="form-grid two-columns">
          <div className="form-group">
            <label className="form-label" htmlFor="senha-atual">{primeiroAcesso ? "Senha temporária (do e-mail)" : "Senha atual"}</label>
            <input id="senha-atual" name="atual" type="password" className="form-input" autoComplete="current-password" value={senha.atual} onChange={alterarSenha} />
          </div>
          <div className="form-group conta-vazio" aria-hidden="true" />
          <div className="form-group">
            <label className="form-label" htmlFor="senha-nova">Nova senha</label>
            <input id="senha-nova" name="nova" type="password" className="form-input" autoComplete="new-password" maxLength={72} value={senha.nova} onChange={alterarSenha} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="senha-confirmar">Confirmar nova senha</label>
            <input id="senha-confirmar" name="confirmar" type="password" className="form-input" autoComplete="new-password" maxLength={72} value={senha.confirmar} onChange={alterarSenha} />
          </div>
        </div>
        {avisoSenha && (
          <p className={`conta-aviso conta-aviso--${avisoSenha.tipo}`} role={avisoSenha.tipo === "erro" ? "alert" : "status"}>
            {avisoSenha.tipo === "ok" ? <FiCheck size={16} /> : <FiAlertTriangle size={16} />} {avisoSenha.texto}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="save-button" disabled={salvandoSenha}>
            {salvandoSenha ? <><div className="loading-spinner" /> Salvando...</> : <><FiLock size={18} /> Salvar senha</>}
          </button>
        </div>
      </form>

      <section className="form-section">
        <h3 className="form-section-title">
          <FiCreditCard size={20} />
          Plano e pagamento
        </h3>

        {!assinatura && !erroAssinatura && <p className="section-description">Carregando plano...</p>}

        {assinatura && (
          <div className={`notif-status ${vencendo || !assinatura.ativa ? "conta-status--atencao" : ""}`}>
            <div className="notif-status-text">
              <span className={`notif-dot ${assinatura.ativa && !vencendo ? "notif-dot--ok" : ""}`} />
              <div>
                <strong>{plano?.nome || "Sem plano"} {plano && `· ${formatarPreco(plano.preco)} / 30 dias`}</strong>
                <p>
                  {!assinatura.ativa
                    ? `Assinatura vencida em ${dataBR(assinatura.expira_em)}. A barbearia não aparece para os clientes até renovar.`
                    : dias < 0
                      ? `Venceu em ${dataBR(assinatura.expira_em)}: você está nos dias de tolerância. Renove para não sair do ar.`
                      : `Válido até ${dataBR(assinatura.expira_em)} (${dias === 0 ? "vence hoje" : `${dias} dia${dias === 1 ? "" : "s"}`}).`}
                  {plano && ` ${limite(plano.max_profissionais, "profissionais")} · ${limite(plano.max_agendamentos_mes, "agendamentos/mês")}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="section-description">
          Cada pagamento soma 30 dias à validade atual (o tempo que falta não se perde). Trocar de plano vale a partir do pagamento.
        </p>

        <div className="conta-planos">
          {PLANOS.map((p) => {
            const atual = plano?.chave === p.chave;
            return (
              <div key={p.chave} className={`conta-plano ${atual ? "conta-plano--atual" : ""}`}>
                <div className="conta-plano-topo">
                  <strong>{p.nome.replace("Plano ", "")}</strong>
                  {atual && <span className="notif-badge notif-badge--enviado">Atual</span>}
                </div>
                <span className="conta-plano-preco">{formatarPreco(p.preco)}</span>
                <small className="helper-text">{p.recursos.slice(0, 2).join(" · ")}</small>
                <button type="button" className="notif-test-button conta-plano-botao" onClick={() => assinar(p.chave)} disabled={Boolean(abrindo)}>
                  {abrindo === p.chave ? "Abrindo..." : atual ? <><FiRefreshCw size={15} /> Renovar</> : "Mudar para este"}
                </button>
              </div>
            );
          })}
        </div>

        {erroAssinatura && <p className="conta-aviso conta-aviso--erro" role="alert"><FiAlertTriangle size={16} /> {erroAssinatura}</p>}

        {assinatura?.pedidos?.length > 0 && (
          <>
            <h4 className="conta-subtitulo">Pagamentos</h4>
            <ul className="notif-history">
              {assinatura.pedidos.map((p) => (
                <li key={p.id} className="notif-history-item">
                  <div>
                    <strong>{PLANOS.find((x) => x.chave === p.plano)?.nome || p.plano} · {formatarPreco(p.valor)}</strong>
                    <p>{p.tipo === "nova" ? "Compra" : "Renovação"} em {dataBR(p.criado_em)}{p.pago_em ? ` · pago em ${dataBR(p.pago_em)}` : ""}</p>
                  </div>
                  <span className={`notif-badge notif-badge--${BADGE_PEDIDO[p.status] || "simulado"}`}>{STATUS_PEDIDO[p.status] || p.status}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
