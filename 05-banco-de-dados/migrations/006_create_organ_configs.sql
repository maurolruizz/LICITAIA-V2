-- ETAPA G — Fase Interna 2
-- Migration 006: organ_configs
--
-- Configurações institucionais parametrizáveis por órgão/tenant.
-- Um registro por tenant (UNIQUE tenant_id).
-- Contém apenas metadados de apresentação e contexto:
--   NUNCA parâmetros de decisão administrativa ou regras do motor.
-- RLS ativo: cada tenant enxerga e altera apenas sua própria configuração.

CREATE TABLE organ_configs (
    id                            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                     UUID         NOT NULL,

    -- Dados institucionais de contexto
    orgao_nome_oficial            VARCHAR(255),
    orgao_cnpj                    VARCHAR(20),
    orgao_uf                      CHAR(2),
    orgao_esfera                  VARCHAR(20),
    orgao_regime_compras_padrao   VARCHAR(50),

    -- Apresentação
    logo_url                      VARCHAR(500),
    timezone                      VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo',

    -- Operacional
    notificacoes_email_ativo      BOOLEAN      NOT NULL DEFAULT false,
    retencao_historico_anos       INTEGER      NOT NULL DEFAULT 5,

    -- Temporal
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT organ_configs_tenant_fk      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT organ_configs_tenant_unique  UNIQUE (tenant_id),
    CONSTRAINT organ_configs_esfera_check   CHECK (
        orgao_esfera IS NULL OR orgao_esfera IN ('federal', 'estadual', 'municipal')
    ),
    CONSTRAINT organ_configs_retencao_check CHECK (retencao_historico_anos BETWEEN 1 AND 20),
    CONSTRAINT organ_configs_uf_check       CHECK (
        orgao_uf IS NULL OR (length(trim(orgao_uf)) = 2)
    )
);

CREATE INDEX idx_organ_configs_tenant_id ON organ_configs (tenant_id);

-- Row Level Security
ALTER TABLE organ_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY organ_configs_tenant_isolation ON organ_configs
    AS PERMISSIVE
    FOR ALL
    USING     (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))
    WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''));

COMMENT ON TABLE  organ_configs                          IS 'Configurações institucionais por órgão. RLS ativo. Um registro por tenant.';
COMMENT ON COLUMN organ_configs.orgao_esfera             IS 'federal | estadual | municipal';
COMMENT ON COLUMN organ_configs.orgao_regime_compras_padrao IS 'Sugestão de default no formulário. Não vincula o motor.';
COMMENT ON COLUMN organ_configs.timezone                 IS 'Timezone IANA. Padrão: America/Sao_Paulo.';
COMMENT ON COLUMN organ_configs.retencao_historico_anos  IS 'Política de retenção de histórico em anos (1–20).';
