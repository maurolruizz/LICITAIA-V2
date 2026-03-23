/**
 * Builders de eventos do Motor de Rastreabilidade da Decisão Administrativa.
 * Fase 29 — Eventos de geração e incompletude (sem transportar traces completos).
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES = {
  GENERATED: 'ADMINISTRATIVE_DECISION_TRACE_GENERATED',
  INCOMPLETE: 'ADMINISTRATIVE_DECISION_TRACE_INCOMPLETE',
} as const;

export function buildAdministrativeDecisionTraceGeneratedEvent(
  source: ModuleId | string | number,
  payload: { totalTraces: number; hasInconsistency: boolean; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES.GENERATED,
    'Rastreabilidade da decisão administrativa gerada.',
    { processId, payload }
  );
}

export function buildAdministrativeDecisionTraceIncompleteEvent(
  source: ModuleId | string | number,
  payload: { totalTraces: number; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES.INCOMPLETE,
    'Rastreabilidade da decisão administrativa incompleta detectada.',
    { processId, payload }
  );
}

