import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';

export const OBJECT_STRUCTURE_EVENT_CODES = {
  LOT_DETECTED: 'OBJECT_STRUCTURE_LOT_DETECTED',
} as const;

export function buildObjectStructureLotDetectedEvent(
  source: ModuleId | string | number,
  meta: { objectStructureType: string; lotCount: number; itemCount: number },
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    OBJECT_STRUCTURE_EVENT_CODES.LOT_DETECTED,
    'Estrutura do objeto em lote detectada',
    { processId, payload: meta }
  );
}

