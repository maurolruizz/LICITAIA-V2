/**
 * Builders de eventos do Motor de Consistência Documental Administrativa.
 * Fase 28 — Eventos VALID e ISSUES_DETECTED.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';
import type { AdministrativeDocumentConsistencyResult } from '../../domain/shared/administrative-document-consistency.types';

export const ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES = {
  VALID: 'ADMIN_DOCUMENT_CONSISTENCY_VALID',
  ISSUES_DETECTED: 'ADMIN_DOCUMENT_CONSISTENCY_ISSUES_DETECTED',
} as const;

export function buildAdministrativeDocumentConsistencyValidEvent(
  source: ModuleId | string | number,
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES.VALID,
    'Consistência documental administrativa verificada: Need, Structure, Calculation, Justification e Strategy coerentes.',
    { processId, payload: { totalIssues: 0, issueTypes: [] } }
  );
}

export function buildAdministrativeDocumentConsistencyIssuesDetectedEvent(
  source: ModuleId | string | number,
  result: AdministrativeDocumentConsistencyResult,
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES.ISSUES_DETECTED,
    'Inconsistências documentais detectadas entre Need, Structure, Calculation, Justification e Strategy.',
    {
      processId,
      payload: {
        totalIssues: result.totalIssues,
        issueTypes: result.issueTypes,
        blockingIssues: result.blockingIssues,
        warningIssues: result.warningIssues,
      },
    }
  );
}
