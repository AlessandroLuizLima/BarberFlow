import React, { useState, useEffect, useRef } from 'react';
import './ClientProfile.css';
import {
  FiUser,
  FiMapPin,
  FiLock,
  FiSun,
  FiMoon,
  FiMail,
  FiPhone,
  FiSave,
  FiCheckCircle,
  FiExternalLink,
  FiCamera,
  FiTrash2
} from 'react-icons/fi';
import {
  buscarCliente,
  atualizarCliente,
  consultarCep,
  enviarFotoCliente,
  removerFotoCliente
} from '../../../services/clienteService';
import { obterClienteLogado, salvarSessaoCliente } from '../../../services/authStorage';
import { urlImagem } from '../../../services/api';
import { prepararImagem } from '../../../utils/imagem';
import { formatarTelefone, telefoneValido } from '../../../utils/telefone';
import { obterTema, salvarTema } from '../../../utils/tema';

const ABAS = [
  { key: 'dados', label: 'Dados pessoais', icon: FiUser },
  { key: 'endereco', label: 'Endereço', icon: FiMapPin },
  { key: 'seguranca', label: 'Segurança', icon: FiLock },
  { key: 'aparencia', label: 'Aparência', icon: FiSun }
];

const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor || '');

const iniciais = (nome) =>
  (nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

function ClientProfile() {
  const clienteLogado = obterClienteLogado();

  const [aba, setAba] = useState('dados');
  const [profile, setProfile] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    senha: '',
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero: '',
    complemento: ''
  });
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tema, setTema] = useState(obterTema());

  const [errors, setErrors] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState('');
  const inputFotoRef = useRef(null);

  useEffect(() => {
    if (!clienteLogado) {
      setCarregando(false);
      return;
    }
    buscarCliente(clienteLogado.id)
      .then((cliente) => {
        setProfile((prev) => ({ ...prev, ...cliente, senha: '' }));
      })
      .catch((error) => {
        console.error('Erro ao carregar perfil:', error);
      })
      .finally(() => setCarregando(false));
    // clienteLogado vem do localStorage e não muda durante o ciclo de vida da página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === 'telefone' ? formatarTelefone(e.target.value) : e.target.value;
    setProfile({ ...profile, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Ao terminar de digitar o CEP (8 dígitos), consulta o ViaCEP e preenche o endereço automaticamente
  const handleCepBlur = async () => {
    const cepLimpo = (profile.cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const endereco = await consultarCep(cepLimpo);
      setProfile((prev) => ({
        ...prev,
        cep: endereco.cep,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf
      }));
      setErrors((prev) => ({ ...prev, cep: '' }));
    } catch {
      setErrors((prev) => ({ ...prev, cep: 'CEP não encontrado' }));
    } finally {
      setBuscandoCep(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.nome_completo?.trim()) newErrors.nome_completo = 'Nome é obrigatório.';
    if (!profile.email?.trim()) newErrors.email = 'Email é obrigatório.';
    else if (!emailValido(profile.email)) newErrors.email = 'Email inválido.';
    if (!profile.telefone?.trim()) newErrors.telefone = 'Telefone é obrigatório.';
    else if (!telefoneValido(profile.telefone)) newErrors.telefone = 'Telefone inválido. Use DDD + número.';
    if (profile.senha) {
      if (profile.senha.length < 6) newErrors.senha = 'A senha deve ter pelo menos 6 caracteres.';
      else if (profile.senha !== confirmarSenha) newErrors.confirmarSenha = 'As senhas não conferem.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // leva o cliente para a aba que tem o erro
      if (validationErrors.senha || validationErrors.confirmarSenha) setAba('seguranca');
      else if (validationErrors.nome_completo || validationErrors.email || validationErrors.telefone) setAba('dados');
      return;
    }

    setSalvando(true);
    try {
      const payload = { ...profile };
      if (!payload.senha) delete payload.senha; // não envia senha vazia

      const resposta = await atualizarCliente(clienteLogado.id, payload);
      salvarSessaoCliente(resposta.cliente);
      setProfile((prev) => ({ ...prev, ...resposta.cliente, senha: '' }));
      setConfirmarSenha('');
      setErrors({});
      mostrarSucesso('Alterações salvas com sucesso!');
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Erro ao salvar as alterações.' });
    } finally {
      setSalvando(false);
    }
  };

  const mostrarSucesso = (texto) => {
    setMensagemSucesso(texto);
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  // Atualiza a tela, a sessão salva no navegador e a sidebar com o cliente devolvido pela API
  const aplicarClienteAtualizado = (cliente) => {
    salvarSessaoCliente(cliente);
    setProfile((prev) => ({ ...prev, foto_id: cliente.foto_id, foto_url: cliente.foto_url }));
  };

  // A imagem é reduzida no navegador (até 256px) antes de ir para o backend
  const handleFotoSelecionada = async (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setErroFoto('');
    setEnviandoFoto(true);
    try {
      const imagem = await prepararImagem(arquivo);
      const resposta = await enviarFotoCliente(clienteLogado.id, imagem);
      aplicarClienteAtualizado(resposta.cliente);
      mostrarSucesso('Foto de perfil atualizada!');
    } catch (error) {
      setErroFoto(error.response?.data?.error || error.message || 'Não foi possível enviar a foto.');
    } finally {
      setEnviandoFoto(false);
    }
  };

  const handleRemoverFoto = async () => {
    setErroFoto('');
    setEnviandoFoto(true);
    try {
      const resposta = await removerFotoCliente(clienteLogado.id);
      aplicarClienteAtualizado(resposta.cliente);
      mostrarSucesso('Foto de perfil removida.');
    } catch (error) {
      setErroFoto(error.response?.data?.error || 'Não foi possível remover a foto.');
    } finally {
      setEnviandoFoto(false);
    }
  };

  const escolherTema = (novo) => {
    setTema(novo);
    salvarTema(novo);
  };

  const enderecoCompleto = profile.logradouro
    ? `${profile.logradouro}${profile.numero ? `, ${profile.numero}` : ''} - ${profile.bairro}, ${profile.cidade}/${profile.uf}`
    : '';

  if (!clienteLogado) {
    return (
      <div className="client-profile-page">
        <div className="cs-container">
          <p className="cs-muted">Você precisa fazer login para ver suas configurações.</p>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="client-profile-page">
        <div className="cs-container">
          <p className="cs-muted">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const campo = (name, label, props = {}) => (
    <div className="cs-field">
      <label htmlFor={name} className="cs-label">{label}</label>
      <input
        id={name}
        name={name}
        value={profile[name] || ''}
        onChange={handleChange}
        className={`cs-input ${errors[name] ? 'cs-input--error' : ''}`}
        {...props}
      />
      {errors[name] && <span className="cs-error-text">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="client-profile-page">
      <div className="cs-container">
        <div className="cs-header">
          <h1>Configurações</h1>
          <p>Gerencie sua conta e preferências</p>
        </div>

        <div className="cs-account">
          <div className="cs-avatar-area">
            <div className={`cs-avatar ${profile.foto_url ? 'cs-avatar--foto' : ''}`}>
              {profile.foto_url
                ? <img src={urlImagem(profile.foto_url)} alt="Sua foto de perfil" />
                : iniciais(profile.nome_completo)}
            </div>
            <button
              type="button"
              className="cs-avatar-edit"
              onClick={() => inputFotoRef.current?.click()}
              disabled={enviandoFoto}
              title={profile.foto_url ? 'Trocar foto' : 'Adicionar foto'}
              aria-label={profile.foto_url ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
            >
              <FiCamera size={14} />
            </button>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFotoSelecionada}
              hidden
            />
          </div>
          <div className="cs-account-info">
            <h2>{profile.nome_completo || 'Cliente'}</h2>
            <span><FiMail size={14} /> {profile.email}</span>
            {profile.telefone && <span><FiPhone size={14} /> {profile.telefone}</span>}
            <div className="cs-photo-actions">
              {enviandoFoto ? (
                <span className="cs-muted">Enviando foto...</span>
              ) : (
                <>
                  <button type="button" className="cs-photo-btn" onClick={() => inputFotoRef.current?.click()}>
                    <FiCamera size={14} /> {profile.foto_url ? 'Trocar foto' : 'Adicionar foto'}
                  </button>
                  {profile.foto_url && (
                    <button type="button" className="cs-photo-btn cs-photo-btn--danger" onClick={handleRemoverFoto}>
                      <FiTrash2 size={14} /> Remover
                    </button>
                  )}
                </>
              )}
            </div>
            {erroFoto && <span className="cs-error-text">{erroFoto}</span>}
          </div>
        </div>

        <div className="cs-tabs" role="tablist">
          {ABAS.map((item) => {
            const Icone = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={aba === item.key}
                className={`cs-tab ${aba === item.key ? 'cs-tab--active' : ''}`}
                onClick={() => setAba(item.key)}
              >
                <Icone size={18} /> {item.label}
              </button>
            );
          })}
        </div>

        {mensagemSucesso && (
          <div className="cs-alert cs-alert--success"><FiCheckCircle size={18} /> {mensagemSucesso}</div>
        )}
        {errors.submit && <div className="cs-alert cs-alert--error">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="cs-panel" noValidate>
          {aba === 'dados' && (
            <section>
              <h3 className="cs-panel-title"><FiUser size={20} /> Dados pessoais</h3>
              <div className="cs-grid">
                {campo('nome_completo', 'Nome completo *', { type: 'text', placeholder: 'Digite seu nome completo', maxLength: 100 })}
                {campo('email', 'Email *', { type: 'email', placeholder: 'seuemail@exemplo.com' })}
                {campo('telefone', 'Telefone *', { type: 'tel', placeholder: '(11) 99999-9999', inputMode: 'tel', maxLength: 15 })}
              </div>
            </section>
          )}

          {aba === 'endereco' && (
            <section>
              <h3 className="cs-panel-title"><FiMapPin size={20} /> Endereço</h3>
              <div className="cs-grid">
                <div className="cs-field">
                  <label htmlFor="cep" className="cs-label">CEP</label>
                  <input
                    id="cep"
                    name="cep"
                    value={profile.cep || ''}
                    onChange={handleChange}
                    onBlur={handleCepBlur}
                    className={`cs-input ${errors.cep ? 'cs-input--error' : ''}`}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {buscandoCep && <span className="cs-muted">Buscando endereço...</span>}
                  {errors.cep && <span className="cs-error-text">{errors.cep}</span>}
                </div>

                <div className="cs-field cs-field--wide">
                  <label className="cs-label">Endereço</label>
                  <input
                    type="text"
                    className="cs-input"
                    value={profile.logradouro ? `${profile.logradouro}, ${profile.bairro} - ${profile.cidade}/${profile.uf}` : ''}
                    placeholder="Preenchido automaticamente pelo CEP"
                    disabled
                  />
                </div>

                {campo('numero', 'Número', { type: 'text', placeholder: 'Número', maxLength: 20 })}
                {campo('complemento', 'Complemento', { type: 'text', placeholder: 'Apto, bloco, referência...', maxLength: 100 })}
              </div>

              {enderecoCompleto && (
                <a
                  className="cs-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiExternalLink size={14} /> Ver meu endereço no Google Maps
                </a>
              )}
            </section>
          )}

          {aba === 'seguranca' && (
            <section>
              <h3 className="cs-panel-title"><FiLock size={20} /> Segurança</h3>
              <p className="cs-muted cs-help">Deixe em branco para manter a senha atual.</p>
              <div className="cs-grid">
                <div className="cs-field">
                  <label htmlFor="senha" className="cs-label">Nova senha</label>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    value={profile.senha || ''}
                    onChange={handleChange}
                    className={`cs-input ${errors.senha ? 'cs-input--error' : ''}`}
                    placeholder="Mínimo de 6 caracteres"
                  />
                  {errors.senha && <span className="cs-error-text">{errors.senha}</span>}
                </div>

                <div className="cs-field">
                  <label htmlFor="confirmarSenha" className="cs-label">Confirmar nova senha</label>
                  <input
                    id="confirmarSenha"
                    type="password"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(e) => {
                      setConfirmarSenha(e.target.value);
                      if (errors.confirmarSenha) setErrors({ ...errors, confirmarSenha: '' });
                    }}
                    className={`cs-input ${errors.confirmarSenha ? 'cs-input--error' : ''}`}
                    placeholder="Repita a nova senha"
                  />
                  {errors.confirmarSenha && <span className="cs-error-text">{errors.confirmarSenha}</span>}
                </div>
              </div>
            </section>
          )}

          {aba === 'aparencia' && (
            <section>
              <h3 className="cs-panel-title"><FiSun size={20} /> Aparência</h3>
              <p className="cs-muted cs-help">Escolha o tema do aplicativo. A escolha fica salva neste dispositivo.</p>
              <div className="cs-theme-options">
                <button
                  type="button"
                  className={`cs-theme ${tema === 'escuro' ? 'cs-theme--active' : ''}`}
                  onClick={() => escolherTema('escuro')}
                >
                  <FiMoon size={22} />
                  <strong>Modo escuro</strong>
                  <span>Fundo escuro, mais confortável à noite</span>
                </button>
                <button
                  type="button"
                  className={`cs-theme ${tema === 'claro' ? 'cs-theme--active' : ''}`}
                  onClick={() => escolherTema('claro')}
                >
                  <FiSun size={22} />
                  <strong>Modo claro</strong>
                  <span>Fundo claro, ideal para ambientes iluminados</span>
                </button>
              </div>
            </section>
          )}

          {aba !== 'aparencia' && (
            <div className="cs-actions">
              <button type="submit" className="cs-save" disabled={salvando}>
                <FiSave size={18} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ClientProfile;
