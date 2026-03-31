-- ONDA 3 CONTINUAÇÃO POR INCREMENTO B
-- Persistência operacional SaaS: processos e sessões de fluxo com histórico imutável.
-- Sem triggers/regras de negócio no banco: toda decisão permanece no motor/backend.

CREATE TABLE processes (
    id          VARCHAR(255) PRIMARY KEY,
    tenant_id   UUID        NOT NULL,
    created_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT processes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT processes_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT processes_id_nonempty CHECK (length(trim(id)) > 0)
);

CREATE INDEX idx_processes_tenant_id ON processes (tenant_id);
CREATE INDEX idx_processes_tenant_created_at ON processes (tenant_id, created_at DESC);

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY processes_tenant_isolation ON processes
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

CREATE TABLE flow_sessions (
    id           UUID        PRIMARY KEY,
    tenant_id    UUID        NOT NULL,
    process_id   VARCHAR(255) NOT NULL,
    snapshot     JSONB       NOT NULL,
    revision     INTEGER     NOT NULL,
    render_token VARCHAR(128) NOT NULL,
    created_by   UUID,
    updated_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT flow_sessions_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT flow_sessions_process_fk FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE RESTRICT,
    CONSTRAINT flow_sessions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT flow_sessions_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT flow_sessions_revision_positive CHECK (revision > 0),
    CONSTRAINT flow_sessions_process_tenant_unique UNIQUE (tenant_id, process_id)
);

CREATE INDEX idx_flow_sessions_tenant_process ON flow_sessions (tenant_id, process_id);

ALTER TABLE flow_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_sessions_tenant_isolation ON flow_sessions
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

CREATE TABLE flow_session_revisions (
    id              UUID         PRIMARY KEY,
    tenant_id       UUID         NOT NULL,
    flow_session_id UUID         NOT NULL,
    process_id      VARCHAR(255) NOT NULL,
    revision        INTEGER      NOT NULL,
    render_token    VARCHAR(128) NOT NULL,
    snapshot        JSONB        NOT NULL,
    action          VARCHAR(100) NOT NULL,
    actor_user_id   UUID,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT flow_session_revisions_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT flow_session_revisions_session_fk FOREIGN KEY (flow_session_id) REFERENCES flow_sessions(id) ON DELETE RESTRICT,
    CONSTRAINT flow_session_revisions_process_fk FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE RESTRICT,
    CONSTRAINT flow_session_revisions_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT flow_session_revisions_action_nonempty CHECK (length(trim(action)) > 0),
    CONSTRAINT flow_session_revisions_revision_positive CHECK (revision > 0)
);

CREATE INDEX idx_flow_session_revisions_tenant_process_rev
    ON flow_session_revisions (tenant_id, process_id, revision ASC);
CREATE INDEX idx_flow_session_revisions_tenant_created_at
    ON flow_session_revisions (tenant_id, created_at DESC);

ALTER TABLE flow_session_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY flow_session_revisions_tenant_isolation ON flow_session_revisions
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));
