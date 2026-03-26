-- ETAPA G — Fase Interna 6
-- Amplia organ_configs com campos canônicos mínimos da FI6.
-- Mantém compatibilidade com colunas legadas; não remove estrutura anterior.

ALTER TABLE organ_configs
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS organization_legal_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(32),
  ADD COLUMN IF NOT EXISTS default_timezone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS default_locale VARCHAR(16),
  ADD COLUMN IF NOT EXISTS updated_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organ_configs_updated_by_fk'
  ) THEN
    ALTER TABLE organ_configs
      ADD CONSTRAINT organ_configs_updated_by_fk
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organ_configs_updated_by ON organ_configs (updated_by);

COMMENT ON COLUMN organ_configs.organization_name IS 'Nome institucional de exibição por tenant.';
COMMENT ON COLUMN organ_configs.organization_legal_name IS 'Razão social / nome legal da organização.';
COMMENT ON COLUMN organ_configs.document_number IS 'Documento institucional (ex.: CNPJ), opcional.';
COMMENT ON COLUMN organ_configs.default_timezone IS 'Timezone padrão (IANA) da organização.';
COMMENT ON COLUMN organ_configs.default_locale IS 'Locale padrão (ex.: pt-BR).';
COMMENT ON COLUMN organ_configs.updated_by IS 'Usuário autenticado que realizou a última atualização.';
