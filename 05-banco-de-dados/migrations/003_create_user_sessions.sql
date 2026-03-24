-- ETAPA G — Fase Interna 2
-- Migration 003: user_sessions
--
-- Sessões persistentes para controle de refresh token.
-- Permite revogação explícita de sessão (logout, suspeita de comprometimento).
-- RLS ativo: sessões visíveis apenas dentro do tenant correspondente.

CREATE TABLE user_sessions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL,
    tenant_id           UUID         NOT NULL,
    refresh_token_hash  VARCHAR(255) NOT NULL,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(500),
    expires_at          TIMESTAMPTZ  NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT user_sessions_user_fk   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT user_sessions_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT user_sessions_token_uq  UNIQUE (refresh_token_hash),
    CONSTRAINT user_sessions_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_user_sessions_user_id       ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_tenant_id     ON user_sessions (tenant_id);
CREATE INDEX idx_user_sessions_token_hash    ON user_sessions (refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at    ON user_sessions (expires_at);
-- Índice para limpeza eficiente de sessões expiradas e revogadas
CREATE INDEX idx_user_sessions_revoked_at    ON user_sessions (revoked_at) WHERE revoked_at IS NOT NULL;

-- Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_sessions_tenant_isolation ON user_sessions
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

COMMENT ON TABLE  user_sessions                    IS 'Sessões persistentes para refresh token. RLS ativo.';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'Hash do refresh token. Nunca armazenar o token em texto claro.';
COMMENT ON COLUMN user_sessions.revoked_at         IS 'Preenchido no logout ou revogação explícita. NULL = sessão ativa.';
COMMENT ON COLUMN user_sessions.expires_at         IS 'Expiração natural da sessão.';
