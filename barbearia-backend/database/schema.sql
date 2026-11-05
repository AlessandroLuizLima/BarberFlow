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

-- ============================================================
-- Tabela: imagens
-- Logo da barbearia e fotos de perfil (clientes e profissionais),
-- em binário. As outras tabelas guardam só o id (foto_id/logo_id)
-- e a imagem é servida pela rota GET /imagens/:id.
-- ============================================================
CREATE TABLE imagens (
    id              UUID PRIMARY KEY,
    mime_type       VARCHAR(30) NOT NULL,  -- image/png, image/jpeg, image/webp, image/gif
    dados           BYTEA NOT NULL,
    tamanho_bytes   INTEGER NOT NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tipos ENUM usados pelas tabelas
-- agendado/confirmado/remarcado = ativos (ocupam o horário); concluido/cancelado = finais
CREATE TYPE enum_agendamentos_status AS ENUM ('agendado', 'confirmado', 'remarcado', 'cancelado', 'concluido');
CREATE TYPE enum_lista_espera_status AS ENUM ('aguardando', 'notificado', 'expirado');
CREATE TYPE enum_mensagens_tipo AS ENUM ('confirmacao', 'lembrete', 'lista_espera', 'remarcacao', 'cancelamento');
CREATE TYPE enum_mensagens_status_envio AS ENUM ('enviado', 'simulado', 'falhou');
CREATE TYPE enum_notificacoes_barbearia_tipo AS ENUM ('novo_agendamento', 'cancelamento', 'reagendamento', 'lembrete', 'resumo_diario', 'teste');
CREATE TYPE enum_notificacoes_barbearia_status_envio AS ENUM ('enviado', 'simulado', 'falhou');

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
    complemento     VARCHAR(100),

    -- Coordenadas do endereço (geocodificadas via OpenStreetMap). Plano B para
    -- achar a barbearia mais próxima quando o navegador não libera a localização.
    latitude        DECIMAL(9, 6),
    longitude       DECIMAL(9, 6),

    foto_id         UUID REFERENCES imagens(id) ON UPDATE CASCADE ON DELETE SET NULL,
    token_versao    INTEGER NOT NULL DEFAULT 0,  -- muda ao trocar a senha: derruba sessões antigas
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: administradores
-- Contas de acesso ao painel do barbeiro. Não há cadastro pelo
-- site: são criadas com "npm run criar-admin".
-- ============================================================
CREATE TABLE administradores (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    senha            VARCHAR(100) NOT NULL,          -- hash bcrypt
    ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    token_versao     INTEGER NOT NULL DEFAULT 0,
    ultimo_login_em  TIMESTAMPTZ,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    foto_id         UUID REFERENCES imagens(id) ON UPDATE CASCADE ON DELETE SET NULL,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    lembrete_enviado   BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- quando o cliente marcou
    atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- última remarcação/cancelamento
);

CREATE INDEX idx_agendamentos_profissional_data ON agendamentos (profissional_id, data_hora);
CREATE INDEX idx_agendamentos_cliente ON agendamentos (cliente_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos (data_hora);  -- job de lembretes

-- ============================================================
-- Tabela: lista_espera
-- ============================================================
CREATE TABLE lista_espera (
    id                 SERIAL PRIMARY KEY,
    cliente_id         INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    profissional_id    INTEGER NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    servico_id         INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    data_desejada      DATE NOT NULL,
    status             enum_lista_espera_status NOT NULL DEFAULT 'aguardando',
    criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- ordem de chegada na fila
);

CREATE INDEX idx_lista_espera_busca ON lista_espera (profissional_id, servico_id, data_desejada, status);
CREATE INDEX idx_lista_espera_cliente ON lista_espera (cliente_id);

-- ============================================================
-- Tabela: mensagens
-- ============================================================
CREATE TABLE mensagens (
    id               SERIAL PRIMARY KEY,
    cliente_id       INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    agendamento_id   INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    tipo             enum_mensagens_tipo NOT NULL,
    conteudo         TEXT NOT NULL,
    email_destino    VARCHAR(150),                  -- e-mail para onde a mensagem foi enviada
    status_envio     enum_mensagens_status_envio,   -- enviado / simulado (sem SMTP) / falhou
    erro_envio       VARCHAR(500),
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
    endereco_detalhado  JSONB NOT NULL DEFAULT '{}',  -- cep, rua, numero, bairro, cidade, estado, pontoReferencia
    dias_atendimento    JSONB NOT NULL DEFAULT '[]',
    horario_inicio      VARCHAR(5) NOT NULL DEFAULT '08:00',
    horario_fim         VARCHAR(5) NOT NULL DEFAULT '18:00',
    logo_id             UUID REFERENCES imagens(id) ON UPDATE CASCADE ON DELETE SET NULL,
    latitude            DECIMAL(9, 6),   -- calculadas a partir do endereço ao salvar
    longitude           DECIMAL(9, 6),
    email_notificacoes  VARCHAR(150),
    notificacoes        JSONB NOT NULL DEFAULT '{}',
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_configuracao_unica CHECK (id = 1)
);

-- ============================================================
-- Tabela: notificacoes_barbearia
-- Avisos enviados por e-mail para a barbearia (novo agendamento,
-- cancelamento, reagendamento, lembrete, resumo do dia, teste).
-- ============================================================
CREATE TABLE notificacoes_barbearia (
    id              SERIAL PRIMARY KEY,
    tipo            enum_notificacoes_barbearia_tipo NOT NULL,
    agendamento_id  INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    titulo          VARCHAR(150) NOT NULL,
    conteudo        TEXT NOT NULL,
    email_destino   VARCHAR(150),
    status_envio    enum_notificacoes_barbearia_status_envio NOT NULL,
    erro_envio      VARCHAR(500),
    lida            BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_barbearia_data ON notificacoes_barbearia (criado_em DESC);

-- ============================================================
-- Controle de migrações (preenchida pelo backend)
-- ============================================================
CREATE TABLE schema_migrations (
    nome          VARCHAR(100) PRIMARY KEY,
    executada_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
