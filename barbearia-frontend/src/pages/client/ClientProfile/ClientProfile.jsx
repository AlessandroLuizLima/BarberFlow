import React, { useState } from 'react';

function ClientProfile() {
  const [profile, setProfile] = useState({
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '11999999999',
    senha: '',
  });

  const [errors, setErrors] = useState({}); // Para validação simples

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
    // Limpa erro ao digitar
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.nome.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!profile.email.trim()) newErrors.email = 'Email é obrigatório.';
    if (!profile.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Simulação de salvamento
    alert('Perfil atualizado com sucesso!');
    console.log('Perfil salvo:', profile);
  };

  return (
    <div className="client-profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Meu Perfil</h1>
          <p>Atualize suas informações pessoais</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="nome" className="form-label">Nome Completo *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={profile.nome}
              onChange={handleChange}
              className={`form-input ${errors.nome ? 'error' : ''}`}
              placeholder="Digite seu nome completo"
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
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
              value={profile.telefone}
              onChange={handleChange}
              className={`form-input ${errors.telefone ? 'error' : ''}`}
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && <span className="error-message">{errors.telefone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="senha" className="form-label">Nova Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={profile.senha}
              onChange={handleChange}
              className="form-input"
              placeholder="Digite uma nova senha (opcional)"
            />
          </div>

          <button type="submit" className="submit-button">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}

export default ClientProfile;