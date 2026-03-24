-- ETAPA G — Fase Interna 2
-- Migration 004: process_executions
--
-- Persistência das execuções do motor DECYON.
-- Ampliação da entidade existente (Fase 40/42) para o modelo SaaS:
--   - tenant_id: isolamento multi-tenant (NOVO)
--   - executed_by: autoria de usuário (NOVO)
--   - todos os campos originais preservados integralmente
--
-- REGRA: nenhum campo da versão JSON é removido ou renomeado.
-- REGRA: o motor (orchestrator, módulos, validadores) não é alterado.
-- RLS ativo: execuções visíveis apenas dentro do tenant do executor.

CREATE TABLE process_executions (
    -- Identidade (preserva compatibilidade com IDs gerados por randomUUID() no Node.js)
    id               VARCHAR(255) PRIMARY KEY,

    -- Contexto SaaS — campos NOVOS desta fase
    tenant_id        UUID         NOT NULL,
    executed_by      UUID,

    -- Payload e resposta do motor — preservados integralmente da Fase 40
    request_payload  JSONB        NOT NULL DEFAULT '{}',
    response         JSONB        NOT NULL DEFAULT '{}',

    -- Metadados da execução — preservados integralmente da Fase 40
    final_status     VARCHAR(100) NOT NULL DEFAULT 'UNKNOWN',
    halted           BOOLEAN      NOT NULL DEFAULT false,
    halted_by        VARCHAR(255),
    http_status      INTEGER      NOT NULL DEFAULT 0,
    modules_executed TEXT[]       NOT NULL DEFAULT '{}',
    validation_codes TEXT[]       NOT NULL DEFAULT '{}',

    -- Temporal
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT process_executions_tenant_fk   FOREIGN KEY (tenant_id)   REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT process_executions_user_fk     FOREIGN KEY (executed_by) REFERENCES users(id)   ON DELETE SET NULL,
    CONSTRAINT process_executions_id_nonempty CHECK (length(trim(id)) > 0)
);

-- Índices para os padrões de acesso esperados (listagem por tenant, ordenação por data, filtros)
CREATE INDEX idx_process_exec_tenant_id    ON process_executions (tenant_id);
CREATE INDEX idx_process_exec_executed_by  ON process_executions (executed_by);
CREATE INDEX idx_process_exec_created_at   ON process_executions (created_at DESC);
CREATE INDEX idx_process_exec_final_status ON process_executions (final_status);
CREATE INDEX idx_process_exec_halted       ON process_executions (halted) WHERE halted = true;
-- Índice composto para o padrão mais frequente: listar execuções de um tenant ordenadas por data
CREATE INDEX idx_process_exec_tenant_date  ON process_executions (tenant_id, created_at DESC);

-- Row Level Security
ALTER TABLE process_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY process_executions_tenant_isolation ON process_executions
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

COMMENT ON TABLE  process_executions              IS 'Execuções do motor DECYON. RLS ativo. Campos originais da Fase 40 preservados.';
COMMENT ON COLUMN process_executions.tenant_id    IS 'Isolamento multi-tenant. Derivado do token JWT, nunca do payload cliente.';
COMMENT ON COLUMN process_executions.executed_by  IS 'UUID do usuário autor. NULL permitido para migração de dados históricos sem autoria.';
COMMENT ON COLUMN process_executions.request_payload IS 'Payload de entrada completo — permite re-execução forense.';
COMMENT ON COLUMN process_executions.response        IS 'Resposta completa do motor incluindo decisionTrace e validationCodes.';
