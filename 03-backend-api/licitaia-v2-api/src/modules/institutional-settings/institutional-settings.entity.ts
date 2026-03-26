export interface InstitutionalSettings {
  tenantId: string;
  organizationName: string | null;
  organizationLegalName: string | null;
  documentNumber: string | null;
  defaultTimezone: string | null;
  defaultLocale: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdateInstitutionalSettingsInput {
  organizationName?: string | null;
  organizationLegalName?: string | null;
  documentNumber?: string | null;
  defaultTimezone?: string | null;
  defaultLocale?: string | null;
  updatedBy: string | null;
}
