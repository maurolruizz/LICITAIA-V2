/**
 * Builders de eventos do Motor de Consolidação de Documentos Administrativos.
 * Fase 31 — Eventos DOCUMENT_GENERATED e DOCUMENT_INCOMPLETE.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const ADMINISTRATIVE_DOCUMENT_EVENT_CODES = {
  GENERATED: 'ADMINISTRATIVE_DOCUMENT_GENERATED',
  INCOMPLETE: 'ADMINISTRATIVE_DOCUMENT_INCOMPLETE',
} as const;

export function buildAdministrativeDocumentGeneratedEvent(
  source: ModuleId | string | number,
  payload: { totalDocuments: number; hasInconsistency: boolean; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DOCUMENT_EVENT_CODES.GENERATED,
    'Documentos administrativos consolidados gerados.',
    { processId, payload }
  );
}

export function buildAdministrativeDocumentIncompleteEvent(
  source: ModuleId | string | number,
  payload: { totalDocuments: number; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DOCUMENT_EVENT_CODES.INCOMPLETE,
    'Documentos administrativos com incompletude detectada.',
    { processId, payload }
  );
}
