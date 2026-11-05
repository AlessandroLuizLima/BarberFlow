// Barbeiros da barbearia (painel): cadastra, edita, foto, ativa/desativa e exclui.
// Os ativos aparecem para o cliente escolher na hora de agendar.
// O número de barbeiros ativos segue o limite do plano (Starter 1, Profissional 3, Enterprise ilimitado).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiCamera, FiEdit, FiEye, FiEyeOff, FiPlus, FiTrash2, FiUser, FiUsers, FiX } from "react-icons/fi";
import {
  listarProfissionais,
  criarProfissional,
  atualizarProfissional,
  excluirProfissional,
  enviarFotoProfissional,
  removerFotoProfissional
} from "../../../services/profissionalService";
import { obterAssinatura } from "../../../services/assinaturaService";
import { urlImagem } from "../../../services/api";
import { prepararImagem } from "../../../utils/imagem";
import { formatarTelefone } from "../../../utils/telefone";
import "../Services/Services.css";
import "./Barbers.css";

const FORM_VAZIO = { nome_completo: "", email: "", telefone: "", especialidade: "" };
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const iniciais = (nome) =>
  String(nome || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

function Barbers() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo, texto }

  const [modal, setModal] = useState(null); // null | 'novo' | barbeiro em edição
  const [form, setForm] = useState(FORM_VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const inputFoto = useRef(null);
  const [fotoDe, setFotoDe] = useState(null);

  const carregar = useCallback(async () => {
    setErroLista("");
    try {
      const [lista, assinatura] = await Promise.all([listarProfissionais(), obterAssinatura().catch(() => null)]);
      setBarbeiros(lista);
      setPlano(assinatura?.plano || null);
    } catch (error) {
      setErroLista(error.response?.data?.error || "Não foi possível carregar os barbeiros.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const avisar = (texto, tipo = "ok") => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  };

  const ativos = barbeiros.filter((b) => b.ativo !== false).length;
  const limite = plano?.max_profissionais ?? null; // null = ilimitado
  const noLimite = limite !== null && ativos >= limite;

  const abrirNovo = () => {
    setForm(FORM_VAZIO);
    setErroForm("");
    setModal("novo");
  };

  const abrirEdicao = (b) => {
    setForm({ nome_completo: b.nome_completo, email: b.email || "", telefone: b.telefone || "", especialidade: b.especialidade || "" });
    setErroForm("");
    setModal(b);
  };

  const alterar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "telefone" ? formatarTelefone(value) : value }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (form.nome_completo.trim().length < 3) return setErroForm("Informe o nome completo.");
    if (!REGEX_EMAIL.test(form.email.trim())) return setErroForm("Informe um e-mail válido.");
    setSalvando(true);
    setErroForm("");
    const dados = {
      nome_completo: form.nome_completo.trim(),
      email: form.email.trim(),
      telefone: form.telefone,
      especialidade: form.especialidade.trim()
    };
    try {
      if (modal === "novo") await criarProfissional(dados);
      else await atualizarProfissional(modal.id, dados);
      avisar(modal === "novo" ? "Barbeiro cadastrado: já aparece para os clientes." : "Barbeiro atualizado.");
      setModal(null);
      carregar();
    } catch (error) {
      setErroForm(error.response?.data?.error || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (b) => {
    try {
      await atualizarProfissional(b.id, { ativo: b.ativo === false });
      avisar(b.ativo === false ? "Barbeiro ativado." : "Barbeiro desativado: não recebe novos agendamentos.");
      carregar();
    } catch (error) {
      avisar(error.response?.data?.error || "Não foi possível alterar o barbeiro.", "erro");
    }
  };

  const confirmarExclusao = async () => {
    setSalvando(true);
    try {
      await excluirProfissional(excluindo.id);
      avisar("Barbeiro excluído.");
      carregar();
    } catch (error) {
      avisar(error.response?.data?.error || "Não foi possível excluir.", "erro");
    } finally {
      setExcluindo(null);
      setSalvando(false);
    }
  };

  const escolherFoto = (b) => {
    setFotoDe(b);
    inputFoto.current?.click();
  };

  const aoEscolherFoto = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || !fotoDe) return;
    try {
      const imagem = await prepararImagem(arquivo);
      await enviarFotoProfissional(fotoDe.id, imagem);
      avisar("Foto atualizada.");
      carregar();
    } catch (error) {
      avisar(error.response?.data?.error || error.message || "Não foi possível enviar a foto.", "erro");
    }
  };

  const tirarFoto = async (b) => {
    try {
      await removerFotoProfissional(b.id);
      avisar("Foto removida.");
      carregar();
    } catch (error) {
      avisar(error.response?.data?.error || "Não foi possível remover a foto.", "erro");
    }
  };

  return (
    <div className="services-page">
      <div className="container">
        <div className="header">
          <div>
            <h1>Barbeiros</h1>
            <p>Os barbeiros ativos aparecem para o cliente escolher na hora de agendar</p>
          </div>
        </div>

        {aviso && <div className={`services-aviso ${aviso.tipo === "erro" ? "barbers-aviso-erro" : ""}`} role="status">{aviso.texto}</div>}

        <div className="search-section">
          <div className="search-controls barbers-topo">
            <div className="barbers-limite">
              <FiUsers size={18} />
              <span>
                <strong>{ativos}</strong>{" "}
                {limite === null
                  ? "barbeiros ativos (ilimitado no seu plano)"
                  : `de ${limite} barbeiro${limite === 1 ? "" : "s"} ativo${limite === 1 ? "" : "s"} no ${plano?.nome || "plano"}`}
              </span>
              {noLimite && <Link to="/dashboard/configuracoes?aba=conta" className="barbers-upgrade">Mudar de plano</Link>}
            </div>
            <button className="add-button" onClick={abrirNovo} disabled={noLimite} title={noLimite ? "Limite do plano atingido" : undefined}>
              <FiPlus size={20} />
              Novo Barbeiro
            </button>
          </div>
        </div>

        <div className="services-list" role="list" aria-label="Barbeiros cadastrados">
          <div className="services-list-header">
            <h2>Equipe ({barbeiros.length})</h2>
          </div>
          <div className="services-list-content">
            {carregando ? (
              <div className="no-services"><p>Carregando barbeiros...</p></div>
            ) : erroLista ? (
              <div className="no-services" role="alert">
                <h3>{erroLista}</h3>
                <button type="button" className="button-secondary" onClick={carregar}>Tentar de novo</button>
              </div>
            ) : barbeiros.length === 0 ? (
              <div className="no-services">
                <div className="no-services-icon"><FiUser size={48} /></div>
                <h3>Nenhum barbeiro cadastrado</h3>
                <p>Cadastre quem atende (pode ser você mesmo): sem barbeiro, os clientes não conseguem agendar.</p>
              </div>
            ) : (
              barbeiros.map((b) => (
                <div key={b.id} className="service-item" role="listitem">
                  <div className="service-content">
                    <div className="service-left">
                      <div className="barbers-foto">
                        {b.foto_url ? <img src={urlImagem(b.foto_url)} alt="" /> : <span>{iniciais(b.nome_completo)}</span>}
                      </div>
                      <div className="service-info">
                        <div className="service-name-row">
                          <h3>{b.nome_completo}</h3>
                          <span className={`status-badge ${b.ativo !== false ? "status-active" : "status-inactive"}`}>
                            {b.ativo !== false ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="service-description">{b.especialidade || "Barbeiro"}</p>
                        <div className="service-meta">
                          <span>{b.email}</span>
                          {b.telefone && <span>{b.telefone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="service-right">
                      <div className="service-actions">
                        <button type="button" className="action-button edit" onClick={() => escolherFoto(b)} title="Trocar foto" aria-label={`Trocar foto de ${b.nome_completo}`}>
                          <FiCamera size={16} />
                        </button>
                        {b.foto_url && (
                          <button type="button" className="action-button delete" onClick={() => tirarFoto(b)} title="Remover foto" aria-label={`Remover foto de ${b.nome_completo}`}>
                            <FiX size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`action-button toggle ${b.ativo !== false ? "active" : "inactive"}`}
                          onClick={() => alternarAtivo(b)}
                          title={b.ativo !== false ? "Desativar" : "Ativar"}
                          aria-label={b.ativo !== false ? `Desativar ${b.nome_completo}` : `Ativar ${b.nome_completo}`}
                        >
                          {b.ativo !== false ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                        </button>
                        <button type="button" className="action-button edit" onClick={() => abrirEdicao(b)} title="Editar" aria-label={`Editar ${b.nome_completo}`}>
                          <FiEdit size={16} />
                        </button>
                        <button type="button" className="action-button delete" onClick={() => setExcluindo(b)} title="Excluir" aria-label={`Excluir ${b.nome_completo}`}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <input ref={inputFoto} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={aoEscolherFoto} />

        {modal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="barbeiro-modal-titulo">
            <div className="modal">
              <div className="modal-header">
                <h2 id="barbeiro-modal-titulo">{modal === "novo" ? "Cadastrar Barbeiro" : "Editar Barbeiro"}</h2>
                <button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar"><FiX size={20} /></button>
              </div>
              <form onSubmit={salvar} noValidate>
                <div className="modal-content">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="b-nome">Nome completo *</label>
                      <input id="b-nome" name="nome_completo" className="form-input" maxLength={100} value={form.nome_completo} onChange={alterar} autoFocus />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="b-email">E-mail *</label>
                      <input id="b-email" name="email" type="email" className="form-input" maxLength={100} value={form.email} onChange={alterar} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="b-tel">Telefone</label>
                      <input id="b-tel" name="telefone" type="tel" className="form-input" placeholder="(00) 00000-0000" value={form.telefone} onChange={alterar} />
                    </div>
                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="b-esp">Especialidade</label>
                      <input id="b-esp" name="especialidade" className="form-input" placeholder="Ex: Cortes clássicos e barba" maxLength={100} value={form.especialidade} onChange={alterar} />
                    </div>
                  </div>
                  {erroForm && <p className="services-erro" role="alert"><FiAlertTriangle size={16} /> {erroForm}</p>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="button-secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button type="submit" className="button-primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {excluindo && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="barbeiro-excluir-titulo">
            <div className="modal modal-delete">
              <div className="modal-header">
                <h2 id="barbeiro-excluir-titulo"><FiAlertTriangle className="alert-icon" aria-hidden="true" /> Excluir barbeiro</h2>
                <button className="modal-close" onClick={() => setExcluindo(null)} aria-label="Fechar"><FiX size={20} /></button>
              </div>
              <div className="modal-content">
                <div className="delete-content">
                  <p>Excluir <strong>{excluindo.nome_completo}</strong>?</p>
                  <div className="delete-warning">
                    <FiAlertTriangle size={16} />
                    <span>Quem já tem agendamentos não pode ser excluído: desative (ícone do olho).</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="button-secondary" onClick={() => setExcluindo(null)}>Cancelar</button>
                <button className="button-primary danger" onClick={confirmarExclusao} disabled={salvando}>Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Barbers;
