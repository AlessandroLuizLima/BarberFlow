-- ============================================================
-- BarberFlow - Schema do banco de dados
-- Banco: Barbearia_Cortae_DB (PostgreSQL)
--
-- Como usar no pgAdmin:
-- 1. Crie o banco "Barbearia_Cortae_DB" (botão direito em
--    Databases > Create > Database...)
-- 2. Clique com o botão direito no banco criado > Query Tool
-- 3. Cole todo este arquivo e execute (F5)
--
-- Observação: o backend também cria essas tabelas sozinho ao
-- rodar (sequelize.sync()) e aplica as migrações em
-- src/database/migrations.js. Este script espelha o resultado
-- final, útil para visualizar/documentar o modelo no pgAdmin.
-- (Se usar este script, os nomes dos tipos abaixo são os mesmos
-- que o Sequelize cria, então o backend continua compatível.)
-- ============================================================

-- Tipos ENUM usados pelas tabelas
-- agendado/confirmado/remarcado = ativos (ocupam o horário); concluido/cancelado = finais
CREATE TYPE enum_agendamentos_status AS ENUM ('agendado', 'confirmado', 'remarcado', 'cancelado', 'concluido');
CREATE TYPE enum_lista_espera_status AS ENUM ('aguardando', 'notificado', 'expirado');
CREATE TYPE enum_mensagens_tipo AS ENUM ('confirmacao', 'lembrete', 'lista_espera', 'remarcacao');

-- ============================================================
-- Tabela: clientes
-- ============================================================
CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    nome_completo   VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    telefone        VARCHAR(20),
    senha           VARCHAR(100) NOT NULL, -- armazenada com hash (bcrypt)

    -- Endereço, completado automaticamente via API ViaCEP
    cep             VARCHAR(9),
    logradouro      VARCHAR(150),
    bairro          VARCHAR(100),
    cidade          VARCHAR(100),
    uf              VARCHAR(2),
    numero          VARCHAR(20),
    complemento     VARCHAR(100)
);

-- ============================================================
-- Tabela: profissionais
-- ============================================================
CREATE TABLE profissionais (
    id              SERIAL PRIMARY KEY,
    nome_completo   VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    telefone        VARCHAR(20),
    especialidade   VARCHAR(100),
    ativo           BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- Tabela: servicos
-- ============================================================
CREATE TABLE servicos (
    id                SERIAL PRIMARY KEY,
    nome              VARCHAR(100) NOT NULL,
    descricao         VARCHAR(255),
    duracao_minutos   INTEGER NOT NULL,
    preco             DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
    ativo             BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (duracao_minutos > 0)
);

-- ============================================================
-- Tabela: agendamentos
-- ============================================================
CREATE TABLE agendamentos (
    id                 SERIAL PRIMARY KEY,
    -- RESTRICT: quem tem histórico não pode ser apagado (profissionais/serviços são desativados)
    cliente_id         INTEGER NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    profissional_id    INTEGER NOT NULL REFERENCES profissionais(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    servico_id         INTEGER NOT NULL REFERENCES servicos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    data_hora          TIMESTAMPTZ NOT NULL,
    status             enum_agendamentos_status NOT NULL DEFAULT 'agendado',
    -- valor cobrado no momento do agendamento (não muda se o preço do serviço mudar depois)
    preco_cobrado      DECIMAL(10, 2) NOT NULL CHECK (preco_cobrado >= 0),
    lembrete_enviado   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_agendamentos_profissional_data ON agendamentos (profissional_id, data_hora);
CREATE INDEX idx_agendamentos_cliente ON agendamentos (cliente_id);

-- ============================================================
-- Tabela: lista_espera
-- ============================================================
CREATE TABLE lista_espera (
    id                 SERIAL PRIMARY KEY,
    cliente_id         INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    profissional_id    INTEGER NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    servico_id         INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    data_desejada      DATE NOT NULL,
    status             enum_lista_espera_status NOT NULL DEFAULT 'aguardando'
);

CREATE INDEX idx_lista_espera_busca ON lista_espera (profissional_id, servico_id, data_desejada, status);

-- ============================================================
-- Tabela: mensagens
-- ============================================================
CREATE TABLE mensagens (
    id               SERIAL PRIMARY KEY,
    cliente_id       INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    agendamento_id   INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    tipo             enum_mensagens_tipo NOT NULL,
    conteudo         TEXT NOT NULL,
    enviada_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_cliente ON mensagens (cliente_id);

-- ============================================================
-- Tabela: configuracoes_barbearia (uma única linha, id = 1)
-- Nome, logo, endereço, horários e notificações da barbearia.
-- ============================================================
CREATE TABLE configuracoes_barbearia (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    nome                VARCHAR(100) NOT NULL,
    telefone            VARCHAR(20),
    email               VARCHAR(150),
    endereco            VARCHAR(255),
    endereco_detalhado  JSONB NOT NULL DEFAULT '{}',
    dias_atendimento    JSONB NOT NULL DEFAULT '[]',
    horario_inicio      VARCHAR(5) NOT NULL DEFAULT '08:00',
    horario_fim         VARCHAR(5) NOT NULL DEFAULT '18:00',
    logo                TEXT,
    email_notificacoes  VARCHAR(150),
    notificacoes        JSONB NOT NULL DEFAULT '{}',
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_configuracao_unica CHECK (id = 1)
);
