-- ETAPA G — Fase Interna 2
-- Migration 001: tenants
--
-- Tabela raiz de isolamento multi-tenant.
-- Cada registro representa um órgão público ou cliente do produto.
-- Não possui RLS: é a autoridade de identidade do sistema.
-- Acessada diretamente apenas por SYSTEM_ADMIN e pelo middleware de resolução de tenant.

CREATE TABLE tenants (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    cnpj        VARCHAR(20),
    status      VARCHAR(20)  NOT NULL DEFAULT 'trial',
    plan_type   VARCHAR(20)  NOT NULL DEFAULT 'trial',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT tenants_slug_unique   UNIQUE (slug),
    CONSTRAINT tenants_cnpj_unique   UNIQUE (cnpj),
    CONSTRAINT tenants_status_check  CHECK  (status   IN ('active', 'suspended', 'trial')),
    CONSTRAINT tenants_plan_check    CHECK  (plan_type IN ('trial', 'standard', 'premium')),
    CONSTRAINT tenants_slug_nonempty CHECK  (length(trim(slug)) > 0),
    CONSTRAINT tenants_name_nonempty CHECK  (length(trim(name)) > 0)
);

CREATE INDEX idx_tenants_status ON tenants (status);
CREATE INDEX idx_tenants_slug   ON tenants (slug);

COMMENT ON TABLE  tenants            IS 'Órgãos/clientes do produto. Tabela raiz de isolamento multi-tenant.';
COMMENT ON COLUMN tenants.slug       IS 'Identificador estável URL-safe. Ex: prefeitura-campinas.';
COMMENT ON COLUMN tenants.cnpj       IS 'CNPJ do órgão. Opcional; único quando informado.';
COMMENT ON COLUMN tenants.status     IS 'active | suspended | trial';
COMMENT ON COLUMN tenants.plan_type  IS 'trial | standard | premium';
