-- ETAPA G — Fase Interna 2
-- Migration 005: audit_logs
--
-- Trilha de auditoria imutável por evento de usuário.
-- REGRA ABSOLUTA: apenas INSERT é permitido. UPDATE e DELETE são bloqueados por trigger.
-- RLS ativo: somente SELECT e INSERT dentro do tenant.
-- Nenhum registro pode ser removido ou modificado após gravação.

CREATE TABLE audit_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL,
    user_id       UUID,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id   VARCHAR(255),
    metadata      JSONB,
    ip_address    VARCHAR(45),
    user_agent    VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT audit_logs_tenant_fk  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT audit_logs_user_fk    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL,
    CONSTRAINT audit_logs_action_nonempty CHECK (length(trim(action)) > 0)
);

CREATE INDEX idx_audit_logs_tenant_id     ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action        ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs (resource_type);
-- Índice composto para consultas de auditoria mais comuns
CREATE INDEX idx_audit_logs_tenant_date   ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_tenant_user   ON audit_logs (tenant_id, user_id);

-- Imutabilidade: trigger bloqueia UPDATE e DELETE em qualquer circunstância
CREATE OR REPLACE FUNCTION audit_logs_enforce_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'audit_logs é append-only: UPDATE e DELETE são proibidos. '
        'Ação bloqueada: %. Tabela: audit_logs.',
        TG_OP;
END;
$$;

CREATE TRIGGER audit_logs_block_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_logs_enforce_immutability();

CREATE TRIGGER audit_logs_block_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_logs_enforce_immutability();

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: leitura isolada por tenant
CREATE POLICY audit_logs_tenant_select ON audit_logs
    AS PERMISSIVE
    FOR SELECT
    USING (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

-- Política de INSERT: gravação isolada por tenant
CREATE POLICY audit_logs_tenant_insert ON audit_logs
    AS PERMISSIVE
    FOR INSERT
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

-- Sem políticas de UPDATE/DELETE = operações bloqueadas via RLS além do trigger

COMMENT ON TABLE  audit_logs             IS 'Trilha de auditoria imutável. Apenas INSERT permitido. UPDATE/DELETE bloqueados por trigger.';
COMMENT ON COLUMN audit_logs.action      IS 'Ex: USER_LOGIN, PROCESS_EXECUTED, CONFIG_CHANGED, USER_CREATED, USER_DEACTIVATED';
COMMENT ON COLUMN audit_logs.resource_type IS 'Ex: process_execution, user, organ_config, tenant';
COMMENT ON COLUMN audit_logs.resource_id   IS 'UUID ou ID do recurso afetado.';
COMMENT ON COLUMN audit_logs.metadata      IS 'Detalhes da ação — payload sanitizado sem dados sensíveis (sem senha, sem token).';
