/**
 * Builders de eventos de justificativa administrativa.
 * Fase 24 — Consolidação da justificativa administrativa no núcleo.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES = {
  DETECTED: 'ADMINISTRATIVE_JUSTIFICATION_DETECTED',
  INVALID: 'ADMINISTRATIVE_JUSTIFICATION_INVALID',
} as const;

export function buildAdministrativeJustificationDetectedEvent(
  source: ModuleId | string | number,
  meta: {
    totalJustifications: number;
    processJustificationCount: number;
    itemJustificationCount: number;
    lotJustificationCount: number;
    withLegalBasisCount: number;
  },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES.DETECTED,
    'Justificativa administrativa detectada no payload',
    { processId, payload: meta }
  );
}

export function buildAdministrativeJustificationInvalidEvent(
  source: ModuleId | string | number,
  meta: { invalidCodes: string[]; totalJustifications?: number },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES.INVALID,
    'Justificativa administrativa inválida (bloqueio estrutural)',
    { processId, payload: meta }
  );
}
