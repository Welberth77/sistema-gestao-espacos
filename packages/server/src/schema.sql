-- schema.sql — estrutura do banco (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS setores (
  id                 SERIAL PRIMARY KEY,
  nome               TEXT NOT NULL,
  coordenador        TEXT NOT NULL,
  total_funcionarios INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS salas (
  id                      TEXT PRIMARY KEY,
  andar                   INTEGER NOT NULL,
  capacidade              INTEGER NOT NULL,
  tipo                    TEXT NOT NULL,
  recursos                JSONB NOT NULL DEFAULT '[]'::jsonb,
  acessivel               BOOLEAN NOT NULL DEFAULT false,
  disponivel              BOOLEAN NOT NULL DEFAULT true,
  reservada_para_setor_id INTEGER REFERENCES setores(id)
);

CREATE TABLE IF NOT EXISTS equipes (
  id                    TEXT PRIMARY KEY,
  setor_id              INTEGER NOT NULL REFERENCES setores(id),
  nome                  TEXT NOT NULL,
  pessoas               INTEGER NOT NULL,
  horario               TEXT,
  requisitos            JSONB NOT NULL DEFAULT '[]'::jsonb,
  prioridade            INTEGER NOT NULL DEFAULT 3,
  precisa_acessibilidade BOOLEAN NOT NULL DEFAULT false,
  andar_preferido       INTEGER
);

CREATE TABLE IF NOT EXISTS proximidades (
  equipe_a_id TEXT NOT NULL REFERENCES equipes(id),
  equipe_b_id TEXT NOT NULL REFERENCES equipes(id),
  PRIMARY KEY (equipe_a_id, equipe_b_id)
);

CREATE TABLE IF NOT EXISTS separacoes (
  setor_a_id INTEGER NOT NULL REFERENCES setores(id),
  setor_b_id INTEGER NOT NULL REFERENCES setores(id),
  PRIMARY KEY (setor_a_id, setor_b_id)
);

-- GOVERNANÇA (seção 12): registro de cada execução do motor.
CREATE TABLE IF NOT EXISTS execucoes (
  id                 SERIAL PRIMARY KEY,
  datahora           TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario            TEXT NOT NULL,
  versao_motor       TEXT NOT NULL,
  equipes_analisadas INTEGER NOT NULL,
  salas_analisadas   INTEGER NOT NULL,
  alocadas           INTEGER NOT NULL,
  nao_alocadas       INTEGER NOT NULL,
  violacoes          INTEGER NOT NULL,
  ocupacao_prevista  REAL NOT NULL,
  tempo_ms           REAL NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pendente' -- pendente | aprovada | rejeitada
);

CREATE TABLE IF NOT EXISTS alocacoes (
  id            SERIAL PRIMARY KEY,
  execucao_id   INTEGER NOT NULL REFERENCES execucoes(id) ON DELETE CASCADE,
  equipe_id     TEXT NOT NULL,
  sala_id       TEXT NOT NULL,
  ocupacao      REAL NOT NULL,
  alternativas  INTEGER NOT NULL DEFAULT 0,
  justificativa JSONB NOT NULL,
  manual        BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS nao_alocadas (
  id            SERIAL PRIMARY KEY,
  execucao_id   INTEGER NOT NULL REFERENCES execucoes(id) ON DELETE CASCADE,
  equipe_id     TEXT NOT NULL,
  restricao     TEXT NOT NULL,
  causa         TEXT NOT NULL,
  encaminhamento TEXT NOT NULL
);

-- INTERVENÇÃO HUMANA (seção 10): auditoria das ações do coordenador.
CREATE TABLE IF NOT EXISTS intervencoes (
  id          SERIAL PRIMARY KEY,
  execucao_id INTEGER REFERENCES execucoes(id) ON DELETE CASCADE,
  usuario     TEXT NOT NULL,
  tipo        TEXT NOT NULL, -- aprovar | rejeitar | editar
  detalhe     TEXT,
  datahora    TIMESTAMPTZ NOT NULL DEFAULT now()
);
