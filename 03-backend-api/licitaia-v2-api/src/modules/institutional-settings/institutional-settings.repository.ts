import type { PoolClient } from 'pg';
import type {
  InstitutionalSettings,
  UpdateInstitutionalSettingsInput,
} from './institutional-settings.entity';

interface OrganConfigRow {
  tenant_id: string;
  organization_name: string | null;
  organization_legal_name: string | null;
  document_number: string | null;
  default_timezone: string | null;
  default_locale: string | null;
  updated_at: Date;
  updated_by: string | null;
}

function normalizeText(input: string | null | undefined): string | null {
  if (input === undefined || input === null) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

function mapRowToEntity(row: OrganConfigRow): InstitutionalSettings {
  return {
    tenantId: row.tenant_id,
    organizationName: row.organization_name,
    organizationLegalName: row.organization_legal_name ?? null,
    documentNumber: row.document_number ?? null,
    defaultTimezone: row.default_timezone ?? null,
    defaultLocale: row.default_locale ?? null,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by ?? null,
  };
}

export async function findInstitutionalSettingsByTenant(
  client: PoolClient,
): Promise<InstitutionalSettings | null> {
  const r = await client.query<OrganConfigRow>(
    `SELECT
       tenant_id,
       organization_name,
       organization_legal_name,
       document_number,
       default_timezone,
       default_locale,
       updated_at,
       updated_by
     FROM organ_configs
     LIMIT 1`,
  );
  const row = r.rows[0];
  return row ? mapRowToEntity(row) : null;
}

export async function upsertInstitutionalSettingsByTenant(
  client: PoolClient,
  tenantId: string,
  input: UpdateInstitutionalSettingsInput,
): Promise<InstitutionalSettings> {
  const organizationName = normalizeText(input.organizationName);
  const organizationLegalName = normalizeText(input.organizationLegalName);
  const documentNumber = normalizeText(input.documentNumber);
  const defaultTimezone = normalizeText(input.defaultTimezone);
  const defaultLocale = normalizeText(input.defaultLocale);

  const r = await client.query<OrganConfigRow>(
    `INSERT INTO organ_configs (
       tenant_id,
       organization_name,
       organization_legal_name,
       document_number,
       default_timezone,
       default_locale,
       updated_by,
       updated_at
     )
     VALUES ($1::uuid, $2, $3, $4, COALESCE($5, 'America/Sao_Paulo'), $6, $7::uuid, NOW())
     ON CONFLICT (tenant_id)
     DO UPDATE
     SET
       organization_name = EXCLUDED.organization_name,
       organization_legal_name = EXCLUDED.organization_legal_name,
       document_number = EXCLUDED.document_number,
       default_timezone = EXCLUDED.default_timezone,
       default_locale = EXCLUDED.default_locale,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING
       tenant_id,
       organization_name,
       organization_legal_name,
       document_number,
       default_timezone,
       default_locale,
       updated_at,
       updated_by`,
    [
      tenantId,
      organizationName,
      organizationLegalName,
      documentNumber,
      defaultTimezone,
      defaultLocale,
      input.updatedBy,
    ],
  );
  const row = r.rows[0];
  if (!row) throw new Error('Falha ao salvar configuração institucional.');
  return mapRowToEntity(row);
}
