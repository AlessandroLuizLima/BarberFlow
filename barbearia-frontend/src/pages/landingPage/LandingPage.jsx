import React, { useState } from 'react';
import './LandingPage.css'; 
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/imagens/logo.png';
import { FaCalendarAlt, FaUsers, FaChartLine, FaMobileAlt, FaClock, FaChartBar } from 'react-icons/fa';

function Button(props) {
  return (
    <button 
      type={props.type || "button"}
      className={props.className}
      onClick={props.onClick}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  );
}

function NavLink(props) {
  return (
    <li className="nav-item">
      <a href={props.href} className="nav-link">
        {props.text}
      </a>
    </li>
  );
}

function MobileMenuButton(props) {
  return (
    <button 
      onClick={props.onClick}
      className="mobile-menu-btn"
      aria-label="Open menu"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

function Navbar(props) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#home" className="logo">
          <img src={props.logo} alt="Logo Cortaê" />
        </a>
        
        <div className="nav-buttons">
          <Button 
            className="btn-outline"
            onClick={props.onNavigateCliente}
          >
            Área do Cliente
          </Button>
          <Button 
            className="btn-outline" 
            onClick={props.onNavigateBarbeiro}
          >
            Área do Barbeiro
          </Button>
          <MobileMenuButton onClick={props.onToggleMenu} />
        </div>
        
        <div className={`nav-menu ${props.mobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            <NavLink href="#home" text="Início" />
            <NavLink href="#about" text="Sobre" />
            <NavLink href="#services" text="Serviços" />
            <NavLink href="#prices" text="Planos" />
          </ul>
        </div>
      </div>
    </nav>
  );
}

function HeroSection(props) {
  return (
    <section id="home" className="section">
      <div className="container hero-section">
        <h1 className="hero-title">
          {props.titlePart1}<br />
          {props.titlePart2} <span className="text-blue">{props.titleHighlight}</span>
        </h1>
        
        <p className="hero-subtitle">
          {props.subtitle}
        </p>
      </div>
    </section>
  );
}

function SectionLabel(props) {
  return <span className="section-label">{props.text}</span>;
}

function SectionTitle(props) {
  return (
    <h2 className={`section-title ${props.centered ? 'text-center' : ''}`}>
      {props.text}
    </h2>
  );
}

function AboutSection(props) {
  return (
    <section id="about" className="section about-section">
      <div className="about-grid">
        <div className="about-content">
          <SectionLabel text={props.label} />
          <SectionTitle text={props.title} />
          <p className="about-text">{props.paragraph1}</p>
          <p>{props.paragraph2}</p>
        </div>
      </div>
    </section>
  );
}

function ServiceCard(props) {
  return (
    <div className="service-card">
      <div className="service-icon">
        {props.icon}
      </div>
      <h3 className="service-title">{props.title}</h3>
      <p className="service-description">{props.description}</p>
    </div>
  );
}

function ServicesSection(props) {
  return (
    <section id="services" className="section services-section">
      <div className="container">
        <SectionLabel text={props.label} />
        <div className="services-intro">
          <SectionTitle text={props.title} />
          <p className="hero-subtitle">{props.description}</p>
        </div>
        
        <div className="services-grid">
          {props.services.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanFeature(props) {
  return (
    <li className="plan-feature">
      <svg className="feature-icon" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
      </svg>
      <span>{props.text}</span>
    </li>
  );
}

function PricingCard(props) {
  return (
    <div className="pricing-card">
      <h3 className="plan-name">{props.name}</h3>
      <p className="plan-description">{props.description}</p>
      <div className="plan-price">
        <span className="price-value">{props.price}</span>
        <span className="price-period">{props.period}</span>
      </div>
      <ul className="plan-features">
        {props.features.map((feature, index) => (
          <PlanFeature key={index} text={feature} />
        ))}
      </ul>
      <Button className="btn-outline">Adquirir</Button>
    </div>
  );
}

function PricingSection(props) {
  return (
    <section id="prices" className="section pricing-section">
      <div className="container">
        <div className="pricing-intro">
          <SectionTitle text={props.title} />
          <p className="contact-intro">{props.description}</p>
        </div>
        
        <div className="pricing-grid">
          {props.plans.map((plan, index) => (
            <PricingCard 
              key={index}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              period={plan.period}
              features={plan.features}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FormInput(props) {
  return (
    <div className="form-group">
      <label htmlFor={props.id} className="form-label">
        {props.label}
      </label>
      <input 
        type={props.type}
        id={props.id}
        className="form-input"
        placeholder={props.placeholder}
        required={props.required}
      />
    </div>
  );
}

function FormTextarea(props) {
  return (
    <div className="form-group">
      <label htmlFor={props.id} className="form-label">
        {props.label}
      </label>
      <textarea 
        id={props.id}
        className="form-textarea"
        placeholder={props.placeholder}
        required={props.required}
      ></textarea>
    </div>
  );
}

function ContactSection(props) {
  return (
    <section className="section">
      <div className="contact-container">
        <SectionTitle text={props.title} centered={true} />
        <p className="contact-intro">{props.description}</p>
        <form onSubmit={props.onSubmit} className="contact-form">
          <FormInput 
            type="email"
            id="email"
            label="Seu e-mail"
            placeholder="exemplo@gmail.com"
            required={true}
          />
          <FormInput 
            type="text"
            id="subject"
            label="Assunto"
            placeholder="Deixe-nos saber como podemos ajudar você"
            required={true}
          />
          <FormTextarea 
            id="message"
            label="Sua mensagem"
            placeholder="Deixe sua mensagem"
            required={true}
          />
          <Button type="submit" className="btn-outline">
            Enviar
          </Button>
        </form>
      </div>
    </section>
  );
}

function FooterSection(props) {
  return (
    <div className="footer-section">
      <h2 className="footer-title">{props.title}</h2>
      <ul className="footer-list">
        {props.links.map((link, index) => (
          <li key={index}>
            <a href={link.href} className="footer-link">
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer(props) {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <a href="#" className="footer-logo">
              <img src={props.logo} alt="logo" />
            </a>
          </div>
          <div className="footer-links">
            {props.sections.map((section, index) => (
              <FooterSection 
                key={index}
                title={section.title}
                links={section.links}
              />
            ))}
          </div>
        </div>
        
        <hr className="footer-divider" />
        
        <div className="footer-bottom">
          <span className="footer-copyright">{props.copyright}</span>
        </div>
      </div>
    </footer>
  );
}

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navega para página de auth do CLIENTE
  const handleNavigateCliente = () => {
    navigate('/auth/cliente');
  };

  // Navega para página de auth do BARBEIRO
  const handleNavigateBarbeiro = () => {
    navigate('/auth/barbeiro');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Formulário enviado com sucesso!');
  };

  const services = [
    {
      icon: <FaCalendarAlt className="w-5 h-5" />,
      title: "Agendamento Online Inteligente",
      description: "Seus clientes agendam horários pelo celular 24/7. Receba notificações automáticas e reduza faltas com lembretes por WhatsApp e SMS."
    },
    {
      icon: <FaUsers className="w-5 h-5" />,
      title: "Cadastro Completo de Clientes",
      description: "Mantenha histórico de atendimentos, preferências e observações. Saiba exatamente o que cada cliente gosta e personalize o atendimento."
    },
    {
      icon: <FaMobileAlt className="w-5 h-5" />,
      title: "App Mobile Profissional",
      description: "Gerencie sua agenda de qualquer lugar. Acesse relatórios, confirme horários e acompanhe seu negócio pelo smartphone."
    },
    {
      icon: <FaClock className="w-5 h-5" />,
      title: "Controle de Horários Flexível",
      description: "Defina seus horários de trabalho, intervalos e bloqueios. O sistema se adapta à sua rotina e evita agendamentos em horários indisponíveis."
    },
    {
      icon: <FaChartBar className="w-5 h-5" />,
      title: "Relatórios e Dashboards",
      description: "Visualize seu faturamento, serviços mais vendidos e horários de pico. Tome decisões baseadas em dados reais do seu negócio."
    },
    {
      icon: <FaChartLine className="w-5 h-5" />,
      title: "Programa de Fidelidade",
      description: "Crie promoções automáticas e recompense clientes frequentes. Aumente a retenção e transforme clientes em fãs da sua barbearia."
    }
  ];

  const plans = [
    {
      name: "Plano Starter",
      description: "Ideal para profissionais autônomos que estão começando.",
      price: "R$ 29,90",
      period: "/mês",
      features: [
        "Até 100 agendamentos/mês",
        "1 profissional",
        "Acesso a dashboard básico",
        "Suporte por email"
      ]
    },
    {
      name: "Plano Profissional",
      description: "Perfeito para barbearias em crescimento.",
      price: "R$ 59,90",
      period: "/mês",
      features: [
        "Até 1000 agendamentos/mês",
        "Até 3 profissionais",
        "Acesso a dashboard avançado",
        "Suporte por email",
        "Suporte por whatsapp"
      ]
    },
    {
      name: "Plano Enterprise",
      description: "Solução completa para grandes estabelecimentos.",
      price: "R$ 99,90",
      period: "/mês",
      features: [
        "Agendamentos ilimitados",
        "Profissionais ilimitados",
        "Acesso a dashboard avançado",
        "Suporte por email",
        "Suporte por whatsapp",
        "Suporte prioritário via chat"
      ]
    }
  ];

  const footerSections = [
    {
      title: "Saiba mais",
      links: [
        { href: "#services", text: "Serviços" },
        { href: "#about", text: "Sobre nós" }
      ]
    },
    {
      title: "Nos siga",
      links: [
        { href: "#", text: "Instagram" }
      ]
    },
    {
      title: "Legal",
      links: [
        { href: "#", text: "Política de privacidade" },
        { href: "#", text: "Termos e condições" }
      ]
    }
  ];

  return (
    <div className="cortae">
      <Navbar 
        logo={Logo}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMenu={toggleMobileMenu}
        onNavigateCliente={handleNavigateCliente}
        onNavigateBarbeiro={handleNavigateBarbeiro}
      />

      <HeroSection 
        titlePart1="Transforme sua barbearia"
        titlePart2="em um"
        titleHighlight="negócio digital"
        subtitle="Gerencie agendamentos, fidelize clientes e aumente seu faturamento. Mais organização, menos trabalho manual."
      />

      <AboutSection 
        label="Sobre nós"
        title="A solução completa para modernizar sua barbearia"
        paragraph1="O Cortaê nasceu da necessidade real de profissionais da beleza que buscavam uma forma simples e eficiente de gerenciar seus negócios. Sabemos que seu tempo é valioso e deve ser dedicado ao que você faz de melhor: atender seus clientes."
        paragraph2="Nossa plataforma elimina a papelada, reduz os 'furos' de agenda e ajuda você a construir um relacionamento duradouro com seus clientes. Com o Cortaê, você tem controle total do seu negócio na palma da mão."
      />

      <ServicesSection 
        label="Nossos serviços"
        title="Tudo que você precisa para crescer"
        description="Ferramentas profissionais que simplificam sua rotina e impressionam seus clientes. Tenha o controle total do seu negócio em uma única plataforma."
        services={services}
      />

      <PricingSection 
        title="Escolha o plano ideal para seu negócio"
        description="Todos os planos incluem 14 dias de teste grátis. Sem compromisso, cancele quando quiser. Oferecemos opções flexíveis que se ajustam ao seu orçamento e objetivos de crescimento."
        plans={plans}
      />

      <ContactSection 
        title="Entre em contato"
        description="Tem dúvidas sobre nossos serviços? Precisa de mais detalhes sobre nossos planos? Nossa equipe está pronta para ajudar você a transformar sua barbearia. Responderemos em até 24 horas."
        onSubmit={handleSubmit}
      />

      <Footer 
        logo={Logo}
        sections={footerSections}
        copyright="© 2025 Cortaê. Todos os Direitos Reservados."
      />
    </div>
  );
};

export default LandingPage;