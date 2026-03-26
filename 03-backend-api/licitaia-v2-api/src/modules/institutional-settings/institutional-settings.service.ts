import { withTenantContext } from '../../lib/db';
import { insertAuditLog } from '../auth/auth.repository';
import type {
  InstitutionalSettings,
  UpdateInstitutionalSettingsInput,
} from './institutional-settings.entity';
import {
  findInstitutionalSettingsByTenant,
  upsertInstitutionalSettingsByTenant,
} from './institutional-settings.repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCALE_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const TIMEZONE_RE = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/;

export class InstitutionalSettingsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'InstitutionalSettingsError';
  }
}

export type UpdateInstitutionalSettingsBody = {
  organizationName?: unknown;
  organizationLegalName?: unknown;
  documentNumber?: unknown;
  defaultTimezone?: unknown;
  defaultLocale?: unknown;
};

function asOptionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new InstitutionalSettingsError(`${field} deve ser string ou null.`, 'VALIDATION_ERROR', 400);
  }
  return value;
}

function assertLimits(value: string | null | undefined, field: string, max: number): void {
  if (value === undefined || value === null) return;
  if (value.trim().length > max) {
    throw new InstitutionalSettingsError(
      `${field} excede o limite de ${max} caracteres.`,
      'VALIDATION_ERROR',
      400,
    );
  }
}

function validatePatchBody(body: UpdateInstitutionalSettingsBody): UpdateInstitutionalSettingsInput {
  const organizationName = asOptionalString(body.organizationName, 'organizationName');
  const organizationLegalName = asOptionalString(body.organizationLegalName, 'organizationLegalName');
  const documentNumber = asOptionalString(body.documentNumber, 'documentNumber');
  const defaultTimezone = asOptionalString(body.defaultTimezone, 'defaultTimezone');
  const defaultLocale = asOptionalString(body.defaultLocale, 'defaultLocale');

  const hasAnyField =
    organizationName !== undefined ||
    organizationLegalName !== undefined ||
    documentNumber !== undefined ||
    defaultTimezone !== undefined ||
    defaultLocale !== undefined;
  if (!hasAnyField) {
    throw new InstitutionalSettingsError(
      'Informe ao menos um campo para atualização.',
      'VALIDATION_ERROR',
      400,
    );
  }

  assertLimits(organizationName, 'organizationName', 255);
  assertLimits(organizationLegalName, 'organizationLegalName', 255);
  assertLimits(documentNumber, 'documentNumber', 32);
  assertLimits(defaultTimezone, 'defaultTimezone', 64);
  assertLimits(defaultLocale, 'defaultLocale', 16);

  if (defaultTimezone && defaultTimezone.trim() !== '' && !TIMEZONE_RE.test(defaultTimezone.trim())) {
    throw new InstitutionalSettingsError(
      'defaultTimezone inválido. Use formato IANA, ex.: America/Sao_Paulo.',
      'VALIDATION_ERROR',
      400,
    );
  }
  if (defaultLocale && defaultLocale.trim() !== '' && !LOCALE_RE.test(defaultLocale.trim())) {
    throw new InstitutionalSettingsError(
      'defaultLocale inválido. Use formato ll ou ll-CC, ex.: pt-BR.',
      'VALIDATION_ERROR',
      400,
    );
  }

  return {
    ...(organizationName !== undefined ? { organizationName } : {}),
    ...(organizationLegalName !== undefined ? { organizationLegalName } : {}),
    ...(documentNumber !== undefined ? { documentNumber } : {}),
    ...(defaultTimezone !== undefined ? { defaultTimezone } : {}),
    ...(defaultLocale !== undefined ? { defaultLocale } : {}),
    updatedBy: '',
  };
}

export async function getInstitutionalSettings(tenantId: string): Promise<InstitutionalSettings> {
  if (!UUID_RE.test(tenantId)) {
    throw new InstitutionalSettingsError('Tenant inválido.', 'VALIDATION_ERROR', 400);
  }
  return await withTenantContext(tenantId, async (client) => {
    const current = await findInstitutionalSettingsByTenant(client);
    if (!current) {
      const bootstrap = await upsertInstitutionalSettingsByTenant(client, tenantId, {
        updatedBy: null,
      });
      return bootstrap;
    }
    return current;
  });
}

export async function updateInstitutionalSettings(params: {
  tenantId: string;
  actorUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
  body: UpdateInstitutionalSettingsBody;
}): Promise<InstitutionalSettings> {
  if (!UUID_RE.test(params.tenantId) || !UUID_RE.test(params.actorUserId)) {
    throw new InstitutionalSettingsError('Contexto autenticado inválido.', 'VALIDATION_ERROR', 400);
  }
  const payload = validatePatchBody(params.body);
  payload.updatedBy = params.actorUserId;

  return await withTenantContext(params.tenantId, async (client) => {
    const updated = await upsertInstitutionalSettingsByTenant(client, params.tenantId, payload);
    await insertAuditLog(client, {
      tenantId: params.tenantId,
      userId: params.actorUserId,
      action: 'INSTITUTIONAL_SETTINGS_UPDATED',
      resourceType: 'organ_config',
      resourceId: params.tenantId,
      metadata: {
        tenantId: params.tenantId,
        updatedFields: Object.keys(payload).filter((k) => k !== 'updatedBy'),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
    return updated;
  });
}
