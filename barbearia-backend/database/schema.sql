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
-- rodar (sequelize.sync()), então este script é útil para
-- quem quer visualizar/documentar o modelo direto no pgAdmin
-- antes mesmo de rodar o servidor.
-- ============================================================

-- Tipos ENUM usados pelas tabelas
CREATE TYPE status_agendamento AS ENUM ('agendado', 'confirmado', 'cancelado', 'concluido');
CREATE TYPE status_lista_espera AS ENUM ('aguardando', 'notificado', 'expirado');
CREATE TYPE tipo_mensagem AS ENUM ('confirmacao', 'lembrete', 'lista_espera');

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
    preco             DECIMAL(10, 2) NOT NULL,
    ativo             BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- Tabela: agendamentos
-- ============================================================
CREATE TABLE agendamentos (
    id                 SERIAL PRIMARY KEY,
    cliente_id         INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    profissional_id    INTEGER NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    servico_id         INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    data_hora          TIMESTAMP NOT NULL,
    status             status_agendamento NOT NULL DEFAULT 'agendado',
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
    status             status_lista_espera NOT NULL DEFAULT 'aguardando'
);

CREATE INDEX idx_lista_espera_busca ON lista_espera (profissional_id, servico_id, data_desejada, status);

-- ============================================================
-- Tabela: mensagens
-- ============================================================
CREATE TABLE mensagens (
    id               SERIAL PRIMARY KEY,
    cliente_id       INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    agendamento_id   INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    tipo             tipo_mensagem NOT NULL,
    conteudo         TEXT NOT NULL,
    enviada_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_cliente ON mensagens (cliente_id);
