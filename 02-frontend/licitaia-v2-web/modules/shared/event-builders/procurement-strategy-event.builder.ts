/**
 * Builders de eventos do Motor de Estratégia de Contratação.
 * Fase 27 — Decisão sobre como a contratação será conduzida.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const PROCUREMENT_STRATEGY_EVENT_CODES = {
  DETECTED: 'PROCUREMENT_STRATEGY_DETECTED',
  INVALID: 'PROCUREMENT_STRATEGY_INVALID',
} as const;

export function buildProcurementStrategyDetectedEvent(
  source: ModuleId | string | number,
  meta: {
    totalStrategies: number;
    processStrategyCount?: number;
    itemStrategyCount?: number;
    lotStrategyCount?: number;
  },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    PROCUREMENT_STRATEGY_EVENT_CODES.DETECTED,
    'Estratégia de contratação detectada no payload',
    { processId, payload: meta }
  );
}

export function buildProcurementStrategyInvalidEvent(
  source: ModuleId | string | number,
  meta: { totalStrategies?: number; issueTypes?: string[] },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    PROCUREMENT_STRATEGY_EVENT_CODES.INVALID,
    'Estratégia de contratação inválida (bloqueio estrutural)',
    { processId, payload: meta }
  );
}
