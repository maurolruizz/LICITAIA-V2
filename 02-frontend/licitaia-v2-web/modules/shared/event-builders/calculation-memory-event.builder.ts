import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const CALCULATION_MEMORY_EVENT_CODES = {
  DETECTED: 'CALCULATION_MEMORY_DETECTED',
  INVALID: 'CALCULATION_MEMORY_INVALID',
} as const;

export function buildCalculationMemoryDetectedEvent(
  source: ModuleId | string | number,
  meta: {
    calculationMemoryCount: number;
    calculationTypes: string[];
    calculationTargets: { targetType: string; targetId: string }[];
  },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    CALCULATION_MEMORY_EVENT_CODES.DETECTED,
    'Memória de cálculo detectada no payload',
    { processId, payload: meta }
  );
}

export function buildCalculationMemoryInvalidEvent(
  source: ModuleId | string | number,
  meta: { invalidCodes: string[]; calculationMemoryCount?: number },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    CALCULATION_MEMORY_EVENT_CODES.INVALID,
    'Memória de cálculo inválida (bloqueio estrutural)',
    { processId, payload: meta }
  );
}

