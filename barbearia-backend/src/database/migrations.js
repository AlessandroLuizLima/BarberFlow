/**
 * Migrações do banco. O sequelize.sync() só cria tabelas que ainda não existem,
 * ele não altera tabelas já criadas (ex.: novo valor de ENUM, nova coluna, FKs).
 * Cada migração roda UMA vez e fica registrada em schema_migrations.
 * Para mudar o banco no futuro, basta acrescentar uma migração no fim da lista.
 */

const { randomUUID } = require('crypto');

// Descobre o nome real do tipo ENUM de uma coluna (o Sequelize cria "enum_<tabela>_<coluna>").
async function nomeDoTipo(sequelize, tabela, coluna) {
  const [rows] = await sequelize.query(
    `SELECT udt_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = :tabela AND column_name = :coluna`,
    { replacements: { tabela, coluna } }
  );
  if (!rows[0]) throw new Error(`Coluna ${tabela}.${coluna} não encontrada`);
  return rows[0].udt_name;
}

// A tabela existe? (bancos novos já nascem com "barbearias" e não têm a antiga "configuracoes_barbearia")
async function tabelaExiste(sequelize, tabela, transaction) {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = :tabela`,
    { replacements: { tabela }, transaction }
  );
  return rows.length > 0;
}

async function adicionarValorNoEnum(sequelize, tabela, coluna, valor) {
  const tipo = await nomeDoTipo(sequelize, tabela, coluna);
  // ADD VALUE não pode rodar dentro de transação, por isso é executado direto
  await sequelize.query(`ALTER TYPE "${tipo}" ADD VALUE IF NOT EXISTS '${valor}'`);
}

const migracoes = [
  {
    nome: '001_status_remarcado',
    up: (sequelize) => adicionarValorNoEnum(sequelize, 'agendamentos', 'status', 'remarcado')
  },
  {
    nome: '002_mensagem_tipo_remarcacao',
    up: (sequelize) => adicionarValorNoEnum(sequelize, 'mensagens', 'tipo', 'remarcacao')
  },
  {
    // Guarda o valor cobrado no momento do agendamento. Sem isso, mudar o preço
    // de um serviço alteraria retroativamente o lucro de dias já fechados.
    nome: '003_preco_cobrado',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      await sequelize.query('ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS preco_cobrado DECIMAL(10,2)', { transaction });
      await sequelize.query(
        `UPDATE agendamentos a SET preco_cobrado = s.preco
           FROM servicos s WHERE s.id = a.servico_id AND a.preco_cobrado IS NULL`,
        { transaction }
      );
      await sequelize.query('ALTER TABLE agendamentos ALTER COLUMN preco_cobrado SET NOT NULL', { transaction });
    })
  },
  {
    // Apagar cliente/profissional/serviço NÃO pode mais apagar o histórico de agendamentos
    // (e o faturamento junto). Profissionais e serviços têm o campo "ativo" para serem desativados.
    nome: '004_fk_agendamentos_restrict',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const fks = [
        ['cliente_id', 'clientes'],
        ['profissional_id', 'profissionais'],
        ['servico_id', 'servicos']
      ];
      for (const [coluna, tabelaRef] of fks) {
        const [rows] = await sequelize.query(
          `SELECT c.conname FROM pg_constraint c
             JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
            WHERE c.contype = 'f' AND c.conrelid = 'agendamentos'::regclass AND a.attname = :coluna`,
          { replacements: { coluna }, transaction }
        );
        for (const { conname } of rows) {
          await sequelize.query(`ALTER TABLE agendamentos DROP CONSTRAINT "${conname}"`, { transaction });
        }
        await sequelize.query(
          `ALTER TABLE agendamentos ADD CONSTRAINT "agendamentos_${coluna}_fkey"
             FOREIGN KEY (${coluna}) REFERENCES ${tabelaRef}(id) ON UPDATE CASCADE ON DELETE RESTRICT`,
          { transaction }
        );
      }
    })
  },
  {
    // NOT VALID: vale para dados novos sem travar caso exista algum registro antigo fora da regra
    nome: '005_checks_valores',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const checks = [
        ['servicos', 'servicos_preco_check', 'preco >= 0'],
        ['servicos', 'servicos_duracao_check', 'duracao_minutos > 0'],
        ['agendamentos', 'agendamentos_preco_cobrado_check', 'preco_cobrado >= 0']
      ];
      for (const [tabela, nome, regra] of checks) {
        await sequelize.query(`ALTER TABLE ${tabela} DROP CONSTRAINT IF EXISTS ${nome}`, { transaction });
        await sequelize.query(`ALTER TABLE ${tabela} ADD CONSTRAINT ${nome} CHECK (${regra}) NOT VALID`, { transaction });
      }
    })
  },
  {
    nome: '006_indices',
    up: async (sequelize) => {
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_data ON agendamentos (profissional_id, data_hora)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos (cliente_id)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_lista_espera_busca ON lista_espera (profissional_id, servico_id, data_desejada, status)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_mensagens_cliente ON mensagens (cliente_id)');
    }
  },
  {
    // Imagens saem do base64 em TEXT e vão para a tabela "imagens" (BYTEA), referenciada por
    // foto_id (clientes, profissionais) e logo_id (barbearia). Também guarda as coordenadas
    // da barbearia e do cliente, usadas para calcular a barbearia mais próxima.
    nome: '007_imagens_e_localizacao',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const q = (sql, opcoes = {}) => sequelize.query(sql, { transaction, ...opcoes });

      // Em banco novo o sync() já criou tudo; os IF NOT EXISTS deixam a migração segura nos dois casos
      await q(`CREATE TABLE IF NOT EXISTS imagens (
                 id             UUID PRIMARY KEY,
                 mime_type      VARCHAR(30) NOT NULL,
                 dados          BYTEA NOT NULL,
                 tamanho_bytes  INTEGER NOT NULL,
                 criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
               )`);

      const fkImagem = 'UUID REFERENCES imagens(id) ON UPDATE CASCADE ON DELETE SET NULL';
      await q(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS foto_id ${fkImagem}`);
      await q('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6)');
      await q('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6)');
      await q(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS foto_id ${fkImagem}`);
      if (!(await tabelaExiste(sequelize, 'configuracoes_barbearia', transaction))) return; // banco novo
      await q(`ALTER TABLE configuracoes_barbearia ADD COLUMN IF NOT EXISTS logo_id ${fkImagem}`);
      await q('ALTER TABLE configuracoes_barbearia ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6)');
      await q('ALTER TABLE configuracoes_barbearia ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6)');

      // Move a logo antiga (data URL em base64) para a tabela imagens e apaga a coluna
      const [colunaLogo] = await q(
        `SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'configuracoes_barbearia' AND column_name = 'logo'`
      );
      if (colunaLogo.length > 0) {
        const [linhas] = await q('SELECT id, logo FROM configuracoes_barbearia WHERE logo IS NOT NULL');
        for (const { id, logo } of linhas) {
          const partes = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(logo);
          if (!partes) continue;
          const dados = Buffer.from(partes[2], 'base64');
          const imagemId = randomUUID();
          await q(
            `INSERT INTO imagens (id, mime_type, dados, tamanho_bytes, criado_em) VALUES (:imagemId, :mime, :dados, :tamanho, NOW())`,
            { replacements: { imagemId, mime: partes[1], dados, tamanho: dados.length } }
          );
          await q('UPDATE configuracoes_barbearia SET logo_id = :imagemId WHERE id = :id', { replacements: { imagemId, id } });
        }
        await q('ALTER TABLE configuracoes_barbearia DROP COLUMN logo');
      }
    })
  },
  {
    // Datas de criação/atualização: quando o cliente se cadastrou, quando o agendamento
    // foi marcado/alterado, quando entrou na lista de espera. Registros antigos ficam com a data da migração.
    nome: '008_datas_de_registro',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const tabelas = [
        ['clientes', true],
        ['profissionais', true],
        ['servicos', true],
        ['agendamentos', true],
        ['lista_espera', false]
      ];
      for (const [tabela, temAtualizacao] of tabelas) {
        await sequelize.query(
          `ALTER TABLE ${tabela} ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
          { transaction }
        );
        if (temAtualizacao) {
          await sequelize.query(
            `ALTER TABLE ${tabela} ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
            { transaction }
          );
        }
      }
      // Usado pelo job de lembretes (procura agendamentos nas próximas 2h)
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos (data_hora)', { transaction });
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_lista_espera_cliente ON lista_espera (cliente_id)', { transaction });
    })
  },
  {
    // Emails passam a ser gravados em minúsculo; normaliza os que já existiam
    // (se houver duplicata só por maiúscula/minúscula, mantém como está para não quebrar o UNIQUE)
    nome: '009_emails_minusculos',
    up: async (sequelize) => {
      for (const tabela of ['clientes', 'profissionais']) {
        await sequelize.query(
          `UPDATE ${tabela} t SET email = LOWER(TRIM(t.email))
            WHERE t.email <> LOWER(TRIM(t.email))
              AND NOT EXISTS (SELECT 1 FROM ${tabela} o WHERE o.id <> t.id AND o.email = LOWER(TRIM(t.email)))`
        );
      }
    }
  },
  {
    // Notificações de verdade (e-mail): status do envio nas mensagens dos clientes
    // e a tabela de notificações da barbearia (em banco novo o sync() já cria a tabela).
    nome: '010_notificacoes_email',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const q = (sql) => sequelize.query(sql, { transaction });
      await q(`DO $$ BEGIN
                 CREATE TYPE enum_mensagens_status_envio AS ENUM ('enviado', 'simulado', 'falhou');
               EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await q('ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS email_destino VARCHAR(150)');
      await q('ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS status_envio enum_mensagens_status_envio');
      await q('ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS erro_envio VARCHAR(500)');

      await q(`DO $$ BEGIN
                 CREATE TYPE enum_notificacoes_barbearia_tipo AS ENUM
                   ('novo_agendamento', 'cancelamento', 'reagendamento', 'lembrete', 'resumo_diario', 'teste');
               EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await q(`DO $$ BEGIN
                 CREATE TYPE enum_notificacoes_barbearia_status_envio AS ENUM ('enviado', 'simulado', 'falhou');
               EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await q(`CREATE TABLE IF NOT EXISTS notificacoes_barbearia (
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
               )`);
      await q('CREATE INDEX IF NOT EXISTS idx_notificacoes_barbearia_data ON notificacoes_barbearia (criado_em DESC)');

      // O resumo diário passa a existir de verdade: deixa ligado para quem já usava as notificações
      if (await tabelaExiste(sequelize, 'configuracoes_barbearia', transaction)) {
        await q(`UPDATE configuracoes_barbearia
                  SET notificacoes = notificacoes || '{"relatorios": true}'::jsonb
                WHERE NOT (notificacoes ? 'relatorios') OR notificacoes->>'relatorios' IS NULL`);
      }
    })
  },
  {
    nome: '011_mensagem_tipo_cancelamento',
    up: (sequelize) => adicionarValorNoEnum(sequelize, 'mensagens', 'tipo', 'cancelamento')
  },
  {
    // Segurança: contas do painel do barbeiro (login de verdade) e versão do token,
    // que invalida sessões antigas quando a senha muda.
    nome: '012_autenticacao',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const q = (sql) => sequelize.query(sql, { transaction });
      await q(`CREATE TABLE IF NOT EXISTS administradores (
                 id               SERIAL PRIMARY KEY,
                 nome             VARCHAR(100) NOT NULL,
                 email            VARCHAR(150) NOT NULL UNIQUE,
                 senha            VARCHAR(100) NOT NULL,
                 ativo            BOOLEAN NOT NULL DEFAULT TRUE,
                 token_versao     INTEGER NOT NULL DEFAULT 0,
                 ultimo_login_em  TIMESTAMPTZ,
                 criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                 atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
               )`);
      await q('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS token_versao INTEGER NOT NULL DEFAULT 0');
    })
  },
  {
    // Várias barbearias: cada plano comprado vira uma barbearia com os próprios dados.
    // A antiga "configuracoes_barbearia" (linha única) vira a barbearia 1, dona de tudo que já existia.
    nome: '013_multi_barbearia',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const q = (sql, opcoes = {}) => sequelize.query(sql, { transaction, ...opcoes });

      // O sync() cria as datas sem valor padrão; o padrão NOW() vale também para INSERTs feitos em SQL
      await q('ALTER TABLE barbearias ALTER COLUMN criado_em SET DEFAULT NOW()');
      await q('ALTER TABLE barbearias ALTER COLUMN atualizado_em SET DEFAULT NOW()');

      // Em banco já existente o sync() criou "barbearias" vazia: copia a configuração antiga para ela
      if (await tabelaExiste(sequelize, 'configuracoes_barbearia', transaction)) {
        await q(`INSERT INTO barbearias (id, nome, telefone, email, endereco, endereco_detalhado, dias_atendimento,
                   horario_inicio, horario_fim, logo_id, latitude, longitude, email_notificacoes, notificacoes,
                   plano, status, criado_em, atualizado_em)
                 SELECT id, nome, telefone, email, endereco, endereco_detalhado, dias_atendimento,
                   horario_inicio, horario_fim, logo_id, latitude, longitude, email_notificacoes, notificacoes,
                   'enterprise', 'ativa', NOW(), COALESCE(atualizado_em, NOW())
                   FROM configuracoes_barbearia
                 ON CONFLICT (id) DO NOTHING`);
        await q('DROP TABLE configuracoes_barbearia');
      }

      // Dados antigos sem barbearia (instalação de uma barbearia só) ficam com a barbearia 1
      const tabelas = ['profissionais', 'servicos', 'agendamentos', 'lista_espera', 'notificacoes_barbearia', 'administradores', 'mensagens'];
      let temDadosAntigos = false;
      for (const t of tabelas) {
        const [[{ total }]] = await q(`SELECT COUNT(*)::int AS total FROM ${t}`);
        if (total > 0) temDadosAntigos = true;
      }
      const [[{ barbearias }]] = await q('SELECT COUNT(*)::int AS barbearias FROM barbearias');
      if (temDadosAntigos && barbearias === 0) {
        // Ex.: banco zerado com "npm run reset-db" que só recebeu a conta do painel
        await q(`INSERT INTO barbearias (id, nome, plano, status, criado_em, atualizado_em)
                 VALUES (1, 'Barbearia', 'enterprise', 'ativa', NOW(), NOW())`);
      }

      for (const t of tabelas) {
        await q(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS barbearia_id INTEGER`);
        await q(`UPDATE ${t} SET barbearia_id = (SELECT MIN(id) FROM barbearias) WHERE barbearia_id IS NULL`);
        const [fks] = await q(
          `SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
            WHERE c.contype = 'f' AND c.conrelid = '${t}'::regclass AND a.attname = 'barbearia_id'`
        );
        if (fks.length === 0) {
          const aoApagar = t === 'mensagens' ? 'SET NULL' : 'CASCADE';
          await q(`ALTER TABLE ${t} ADD CONSTRAINT ${t}_barbearia_id_fkey FOREIGN KEY (barbearia_id)
                     REFERENCES barbearias(id) ON UPDATE CASCADE ON DELETE ${aoApagar}`);
        }
        if (t !== 'mensagens') {
          await q(`ALTER TABLE ${t} ALTER COLUMN barbearia_id SET NOT NULL`);
        }
        await q(`CREATE INDEX IF NOT EXISTS idx_${t}_barbearia ON ${t} (barbearia_id)`);
      }

      // O id da barbearia passa a ser sequencial (antes era sempre 1)
      await q(`CREATE SEQUENCE IF NOT EXISTS barbearias_id_seq OWNED BY barbearias.id`);
      await q(`ALTER TABLE barbearias ALTER COLUMN id SET DEFAULT nextval('barbearias_id_seq')`);
      await q(`SELECT setval('barbearias_id_seq', COALESCE((SELECT MAX(id) FROM barbearias), 0) + 1, false)`);

      // Email de profissional: único dentro da barbearia (não mais no sistema todo)
      const [unicos] = await q(
        `SELECT c.conname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
          WHERE c.contype = 'u' AND c.conrelid = 'profissionais'::regclass AND a.attname = 'email' AND array_length(c.conkey, 1) = 1`
      );
      for (const { conname } of unicos) await q(`ALTER TABLE profissionais DROP CONSTRAINT "${conname}"`);
      await q(`CREATE UNIQUE INDEX IF NOT EXISTS profissionais_barbearia_email_unico ON profissionais (barbearia_id, email)`);

      await q('ALTER TABLE administradores ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN NOT NULL DEFAULT FALSE');
      await q('CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos (email)');
    })
  },
  {
    // A tabela das contas do painel passa a se chamar "barbeiros" (antes "administradores").
    // O sync() roda antes das migrações e já criou uma "barbeiros" vazia: ela é descartada e a
    // tabela antiga é renomeada, mantendo as contas, senhas e ligações com as barbearias.
    nome: '014_tabela_barbeiros',
    up: (sequelize) => sequelize.transaction(async (transaction) => {
      const q = (sql) => sequelize.query(sql, { transaction });
      if (!(await tabelaExiste(sequelize, 'administradores', transaction))) return;

      const contar = async (t) => (await q(`SELECT COUNT(*)::int AS total FROM ${t}`))[0][0].total;
      if (await tabelaExiste(sequelize, 'barbeiros', transaction)) {
        if ((await contar('barbeiros')) > 0) {
          if ((await contar('administradores')) > 0) {
            throw new Error('As tabelas "administradores" e "barbeiros" têm dados. Junte as contas manualmente antes de continuar.');
          }
          await q('DROP TABLE administradores CASCADE');
          return;
        }
        await q('DROP TABLE barbeiros CASCADE');
      }

      await q('ALTER TABLE administradores RENAME TO barbeiros');
      await q('ALTER SEQUENCE IF EXISTS administradores_id_seq RENAME TO barbeiros_id_seq');
      // Nomes de chaves e índices acompanham o nome novo da tabela
      const [restricoes] = await q(
        `SELECT conname FROM pg_constraint WHERE conrelid = 'barbeiros'::regclass AND conname LIKE 'administradores%'`
      );
      for (const { conname } of restricoes) {
        await q(`ALTER TABLE barbeiros RENAME CONSTRAINT "${conname}" TO "${conname.replace(/^administradores/, 'barbeiros')}"`);
      }
      const [indices] = await q(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'barbeiros' AND indexname LIKE '%administradores%'`
      );
      for (const { indexname } of indices) {
        await q(`ALTER INDEX "${indexname}" RENAME TO "${indexname.replace('administradores', 'barbeiros')}"`);
      }
    })
  }
];

async function executarMigracoes(sequelize) {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       nome VARCHAR(100) PRIMARY KEY,
       executada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );
  const [feitas] = await sequelize.query('SELECT nome FROM schema_migrations');
  const jaExecutadas = new Set(feitas.map((m) => m.nome));

  for (const migracao of migracoes) {
    if (jaExecutadas.has(migracao.nome)) continue;
    console.log(`[migração] aplicando ${migracao.nome}...`);
    await migracao.up(sequelize);
    await sequelize.query('INSERT INTO schema_migrations (nome) VALUES (:nome)', { replacements: { nome: migracao.nome } });
  }
}

module.exports = { executarMigracoes };
