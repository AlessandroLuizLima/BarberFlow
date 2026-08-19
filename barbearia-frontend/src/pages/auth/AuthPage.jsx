import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AiOutlineMail, 
  AiOutlineLock, 
  AiOutlineUser, 
  AiOutlinePhone, 
  AiOutlineEye, 
  AiOutlineEyeInvisible,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle
} from 'react-icons/ai';
import { MdSecurity } from 'react-icons/md';
import './AuthPage.css';

function FormInput({ 
  label, 
  icon: Icon, 
  type, 
  name, 
  value, 
  onChange, 
  placeholder, 
  maxLength, 
  autoComplete, 
  error, 
  required, 
  showToggle, 
  onToggle, 
  showValue 
}) {
  return (
    <div className="form-group">
      <label className={`form-label ${required ? 'required' : ''}`}>
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showToggle ? (showValue ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`form-input ${error ? 'error' : ''} ${value && !error ? 'success' : ''}`}
          style={{ paddingRight: showToggle ? '60px' : '12px' }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="password-toggle"
            aria-label={showValue ? "Ocultar senha" : "Mostrar senha"}
          >
            {showValue ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
          </button>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function PasswordStrengthMeter({ strength }) {
  const getColor = () => {
    if (strength < 40) return '#ef4444';
    if (strength < 70) return '#f59e0b';
    return '#10b981';
  };

  const getText = () => {
    if (strength < 40) return 'Senha Fraca';
    if (strength < 70) return 'Senha Média';
    return 'Senha Forte';
  };

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div 
          className="strength-fill" 
          style={{ 
            width: `${strength}%`,
            backgroundColor: getColor()
          }} 
        />
      </div>
      <div className="strength-text" style={{ color: getColor() }}>
        {getText()}
      </div>
    </div>
  );
}

function SuccessNotification({ message }) {
  return (
    <div className="success-notification">
      <div className="success-icon">
        <AiOutlineCheckCircle size={20} />
      </div>
      <p>{message}</p>
    </div>
  );
}

function ModeToggle({ isLogin, onToggle }) {
  return (
    <div className="mode-toggle">
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`toggle-btn ${isLogin ? 'active' : ''}`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`toggle-btn ${!isLogin ? 'active' : ''}`}
      >
        Cadastro
      </button>
    </div>
  );
}

function PasswordMatchIndicator({ show }) {
  // Componente removido - não exibe mais o indicador
  return null;
}

function AuthHeader({ title, subtitle }) {
  return (
    <div className="auth-header">
      <div className="auth-logo">
        <MdSecurity size={32} color="white" />
      </div>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </div>
  );
}

function SecurityBadge({ text }) {
  return (
    <div className="security-badge">
      <MdSecurity size={16} />
      {text}
    </div>
  );
}

function ToggleText({ question, linkText, onClick }) {
  return (
    <div className="toggle-text">
      <p>
        {question}
        <button
          type="button"
          onClick={onClick}
          className="toggle-link"
        >
          {linkText}
        </button>
      </p>
    </div>
  );
}

function SubmitButton({ disabled, text }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`btn-primary ${disabled ? 'btn-loading' : ''}`}
    >
      {text}
    </button>
  );
}

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detecta se está na rota de cliente ou barbeiro
  const isClientRoute = location.pathname.includes('/cliente');
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: ''
  });

  // Limpa formulário ao trocar modo
  useEffect(() => {
    setForm({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      telefone: ''
    });
    setErrors({});
    setPasswordStrength(0);
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isLogin]);

  // Auto-oculta mensagem de sucesso
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const formatTelefone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength: (strength / 5) * 100, checks };
  };

  const validatePassword = (password) => {
    const result = calculatePasswordStrength(password);
    return {
      isValid: result.strength >= 60,
      strength: result.strength,
      checks: result.checks
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case 'telefone':
        formattedValue = formatTelefone(value);
        break;
      case 'nome':
        formattedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        break;
      case 'senha':
        if (!isLogin) {
          const validation = validatePassword(value);
          setPasswordStrength(validation.strength);
        }
        break;
      default:
        formattedValue = value;
    }

    setForm(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Remove erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validação de email
    if (!form.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação de senha
    if (!form.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (!isLogin) {
      const passwordValidation = validatePassword(form.senha);
      if (!passwordValidation.isValid) {
        newErrors.senha = 'Senha deve ter no mínimo 8 caracteres com letras e números';
      }
    } else if (form.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    // Validações específicas do cadastro
    if (!isLogin) {
      // Nome
      if (!form.nome) {
        newErrors.nome = 'Nome é obrigatório';
      } else if (form.nome.trim().length < 3) {
        newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
      }

      // Telefone
      if (!form.telefone) {
        newErrors.telefone = 'Telefone é obrigatório';
      } else if (form.telefone.replace(/\D/g, '').length < 10) {
        newErrors.telefone = 'Telefone inválido';
      }

      // Confirmação de senha
      if (!form.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirme sua senha';
      } else if (form.senha !== form.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simula chamada API
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isLogin) {
        console.log('Login realizado:', { 
          email: form.email, 
          tipo: isClientRoute ? 'cliente' : 'barbeiro' 
        });
        
        // Define mensagem de sucesso
        setSuccessMessage('Login realizado!');
        
        // Redireciona baseado no tipo de usuário
        setTimeout(() => {
          if (isClientRoute) {
            // Se está na rota de cliente, redireciona para área do cliente
            navigate('/cliente');
          } else {
            // Se está na rota de barbeiro, redireciona para dashboard
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        console.log('Cadastro realizado:', { 
          nome: form.nome, 
          email: form.email, 
          telefone: form.telefone,
          tipo: isClientRoute ? 'cliente' : 'barbeiro'
        });
        
        setSuccessMessage('Cadastro realizado! Faça login para continuar.');
        
        // Troca para modo login após 2 segundos
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 2000);
      }

      // Limpa formulário
      setForm({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        telefone: ''
      });

    } catch (error) {
      console.error('Erro:', error);
      setErrors({ submit: 'Erro ao processar solicitação. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {successMessage && (
          <SuccessNotification message={successMessage} />
        )}
        
        <AuthHeader 
          title={isLogin ? 'Bem-vindo de volta!' : 'Criar nova conta'}
          subtitle={isLogin 
            ? `Entre com suas credenciais ${isClientRoute ? 'de cliente' : 'de barbeiro'}` 
            : `Cadastre-se como ${isClientRoute ? 'cliente' : 'barbeiro'}`
          }
        />

        <ModeToggle 
          isLogin={isLogin} 
          onToggle={setIsLogin} 
        />

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <FormInput
              label="Nome completo"
              icon={AiOutlineUser}
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
              maxLength={100}
              error={errors.nome}
              required={true}
              showToggle={false}
            />
          )}

          <FormInput
            label="Email"
            icon={AiOutlineMail}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email}
            required={true}
            showToggle={false}
          />

          {!isLogin && (
            <FormInput
              label="Telefone"
              icon={AiOutlinePhone}
              type="tel"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(11) 91234-5678"
              maxLength={15}
              error={errors.telefone}
              required={true}
              showToggle={false}
            />
          )}

          <FormInput
            label="Senha"
            icon={AiOutlineLock}
            name="senha"
            value={form.senha}
            onChange={handleChange}
            placeholder={isLogin ? "Digite sua senha" : "Mínimo 8 caracteres"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            error={errors.senha}
            required={true}
            showToggle={true}
            onToggle={() => setShowPassword(!showPassword)}
            showValue={showPassword}
          />

          {!isLogin && form.senha && (
            <PasswordStrengthMeter strength={passwordStrength} />
          )}

          {!isLogin && (
            <>
              <FormInput
                label="Confirmar senha"
                icon={AiOutlineLock}
                name="confirmarSenha"
                value={form.confirmarSenha}
                onChange={handleChange}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                error={errors.confirmarSenha}
                required={true}
                showToggle={true}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                showValue={showConfirmPassword}
              />
              <PasswordMatchIndicator 
                show={form.confirmarSenha && form.senha === form.confirmarSenha && !errors.confirmarSenha}
              />
            </>
          )}

          {errors.submit && (
            <div className="error-message" style={{ marginTop: '16px', textAlign: 'center' }}>
              {errors.submit}
            </div>
          )}

          <SubmitButton 
            disabled={isLoading}
            text={isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar conta')}
          />
        </form>

        <ToggleText
          question={isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
          linkText={isLogin ? 'Criar conta' : 'Fazer login'}
          onClick={() => setIsLogin(!isLogin)}
        />

        <SecurityBadge text="Seus dados estão protegidos com criptografia de ponta a ponta" />
      </div>
    </div>
  );
};

export default AuthPage;