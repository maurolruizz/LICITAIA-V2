/**
 * Builders de eventos do Motor de Explicabilidade Consolidada da Decisão Administrativa.
 * Fase 30 — Eventos de geração e incompletude (sem transportar explicações completas).
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES = {
  GENERATED: 'ADMINISTRATIVE_DECISION_EXPLANATION_GENERATED',
  INCOMPLETE: 'ADMINISTRATIVE_DECISION_EXPLANATION_INCOMPLETE',
} as const;

export function buildAdministrativeDecisionExplanationGeneratedEvent(
  source: ModuleId | string | number,
  payload: { totalExplanations: number; hasInconsistency: boolean; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES.GENERATED,
    'Explicabilidade consolidada da decisão administrativa gerada.',
    { processId, payload }
  );
}

export function buildAdministrativeDecisionExplanationIncompleteEvent(
  source: ModuleId | string | number,
  payload: { totalExplanations: number; hasIncomplete: boolean },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES.INCOMPLETE,
    'Explicabilidade consolidada da decisão administrativa incompleta detectada.',
    { processId, payload }
  );
}

