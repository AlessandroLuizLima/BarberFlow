import React, { useState, useEffect } from 'react';
import './ClientProfile.css';
import { buscarCliente, atualizarCliente, consultarCep } from '../../../services/clienteService';
import { obterClienteLogado, salvarSessaoCliente } from '../../../services/authStorage';

function ClientProfile() {
  const clienteLogado = obterClienteLogado();

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
    complemento: '',
  });

  const [errors, setErrors] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

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
    const { name, value } = e.target;
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
        uf: endereco.uf,
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
    if (!profile.telefone?.trim()) newErrors.telefone = 'Telefone é obrigatório.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSalvando(true);
    try {
      const payload = { ...profile };
      if (!payload.senha) delete payload.senha; // não envia senha vazia

      const resposta = await atualizarCliente(clienteLogado.id, payload);
      salvarSessaoCliente(resposta.cliente);
      setProfile((prev) => ({ ...prev, ...resposta.cliente, senha: '' }));
      setMensagemSucesso('Perfil atualizado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Erro ao salvar perfil.' });
    } finally {
      setSalvando(false);
    }
  };

  if (!clienteLogado) {
    return (
      <div className="client-profile-page">
        <div className="container">
          <p>Você precisa fazer login para ver seu perfil.</p>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="client-profile-page">
        <div className="container">
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Meu Perfil</h1>
          <p>Atualize suas informações pessoais</p>
        </div>

        {mensagemSucesso && <p style={{ color: 'green' }}>{mensagemSucesso}</p>}
        {errors.submit && <p className="error-message">{errors.submit}</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="nome_completo" className="form-label">Nome Completo *</label>
            <input
              type="text"
              id="nome_completo"
              name="nome_completo"
              value={profile.nome_completo || ''}
              onChange={handleChange}
              className={`form-input ${errors.nome_completo ? 'error' : ''}`}
              placeholder="Digite seu nome completo"
            />
            {errors.nome_completo && <span className="error-message">{errors.nome_completo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email || ''}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="seuemail@example.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="telefone" className="form-label">Telefone *</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={profile.telefone || ''}
              onChange={handleChange}
              className={`form-input ${errors.telefone ? 'error' : ''}`}
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && <span className="error-message">{errors.telefone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="cep" className="form-label">CEP</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={profile.cep || ''}
              onChange={handleChange}
              onBlur={handleCepBlur}
              className={`form-input ${errors.cep ? 'error' : ''}`}
              placeholder="00000-000"
              maxLength={9}
            />
            {buscandoCep && <span>Buscando endereço...</span>}
            {errors.cep && <span className="error-message">{errors.cep}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Endereço</label>
            <input
              type="text"
              value={
                profile.logradouro
                  ? `${profile.logradouro}, ${profile.bairro} - ${profile.cidade}/${profile.uf}`
                  : ''
              }
              className="form-input"
              placeholder="Preenchido automaticamente pelo CEP"
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="numero" className="form-label">Número</label>
            <input
              type="text"
              id="numero"
              name="numero"
              value={profile.numero || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Número"
            />
          </div>

          <div className="form-group">
            <label htmlFor="complemento" className="form-label">Complemento</label>
            <input
              type="text"
              id="complemento"
              name="complemento"
              value={profile.complemento || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Apto, bloco, referência..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha" className="form-label">Nova Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={profile.senha || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Digite uma nova senha (opcional)"
            />
          </div>

          <button type="submit" className="submit-button" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClientProfile;
