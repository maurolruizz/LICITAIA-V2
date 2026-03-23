/**
 * Builders de eventos do Motor de Necessidade Administrativa.
 * Fase 26 — Problema público, necessidade administrativa, resultado esperado.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const ADMINISTRATIVE_NEED_EVENT_CODES = {
  DETECTED: 'ADMINISTRATIVE_NEED_DETECTED',
  INVALID: 'ADMINISTRATIVE_NEED_INVALID',
} as const;

export function buildAdministrativeNeedDetectedEvent(
  source: ModuleId | string | number,
  meta: {
    totalNeeds: number;
    processNeedCount: number;
    itemNeedCount: number;
    lotNeedCount: number;
  },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_NEED_EVENT_CODES.DETECTED,
    'Necessidade administrativa detectada no payload',
    { processId, payload: meta }
  );
}

export function buildAdministrativeNeedInvalidEvent(
  source: ModuleId | string | number,
  meta: { invalidCodes: string[]; totalNeeds?: number; issueTypes?: string[] },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_NEED_EVENT_CODES.INVALID,
    'Necessidade administrativa inválida (bloqueio estrutural)',
    { processId, payload: meta }
  );
}
