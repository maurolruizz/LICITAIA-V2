-- ETAPA G — Fase Interna 2
-- Migration 002: users
--
-- Usuários do sistema, segregados por tenant.
-- Papéis: SYSTEM_ADMIN (global), TENANT_ADMIN, OPERATOR, AUDITOR.
-- SYSTEM_ADMIN é o único papel fora de escopo de tenant (tenant_id pode ser NULL para ele).
-- RLS ativo: cada sessão autenticada só enxerga usuários do próprio tenant.

CREATE TABLE users (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID,
    email          VARCHAR(255) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    role           VARCHAR(30)  NOT NULL DEFAULT 'OPERATOR',
    status         VARCHAR(20)  NOT NULL DEFAULT 'active',
    password_hash  VARCHAR(255) NOT NULL,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by     UUID,

    CONSTRAINT users_tenant_fk        FOREIGN KEY (tenant_id)  REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT users_tenant_email_uq  UNIQUE (tenant_id, email),
    CONSTRAINT users_role_check       CHECK (role   IN ('SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'AUDITOR')),
    CONSTRAINT users_status_check     CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT users_name_nonempty    CHECK (length(trim(name)) > 0),
    CONSTRAINT users_email_nonempty   CHECK (length(trim(email)) > 0),
    -- SYSTEM_ADMIN é o único papel que pode ter tenant_id NULL
    CONSTRAINT users_tenant_required  CHECK (
        (role = 'SYSTEM_ADMIN') OR (tenant_id IS NOT NULL)
    )
);

-- Chave auto-referente adicionada após criação para evitar dependência circular
ALTER TABLE users
    ADD CONSTRAINT users_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_email     ON users (email);
CREATE INDEX idx_users_role      ON users (role);
CREATE INDEX idx_users_status    ON users (status);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por tenant.
-- Quando app.current_tenant_id não estiver definido ou for vazio,
-- nullif retorna NULL e a comparação é FALSE → zero linhas retornadas (seguro por padrão).
CREATE POLICY users_tenant_isolation ON users
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

COMMENT ON TABLE  users               IS 'Usuários do sistema por tenant. RLS ativo.';
COMMENT ON COLUMN users.tenant_id     IS 'NULL apenas para SYSTEM_ADMIN.';
COMMENT ON COLUMN users.role          IS 'SYSTEM_ADMIN | TENANT_ADMIN | OPERATOR | AUDITOR';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha. Nunca armazenar senha em texto claro.';
COMMENT ON COLUMN users.created_by    IS 'UUID do usuário que criou este registro. NULL para usuários de sistema.';
