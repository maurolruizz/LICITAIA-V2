/**
 * Eventos administrativos reais do módulo TR.
 * TR_STARTED, TR_VALIDATED, TR_BLOCKED, TR_COMPLETED.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from '../../shared/event-builders/compliance-event.builder';

export const TR_EVENT_CODES = {
  STARTED: 'TR_STARTED',
  VALIDATED: 'TR_VALIDATED',
  BLOCKED: 'TR_BLOCKED',
  COMPLETED: 'TR_COMPLETED',
} as const;

export function createTrComplianceEvent(
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return buildComplianceEvent(ModuleId.TR, code, message, options);
}

export function buildTrStartedEvent(processId?: string): AdministrativeEventContract {
  return createTrComplianceEvent(
    TR_EVENT_CODES.STARTED,
    'Processamento do TR iniciado',
    { processId }
  );
}

export function buildTrValidatedEvent(processId?: string): AdministrativeEventContract {
  return createTrComplianceEvent(
    TR_EVENT_CODES.VALIDATED,
    'TR validado com sucesso',
    { processId }
  );
}

export function buildTrBlockedEvent(
  reason: string,
  options?: { processId?: string; payload?: Record<string, unknown> }
): AdministrativeEventContract {
  return createTrComplianceEvent(
    TR_EVENT_CODES.BLOCKED,
    reason,
    { processId: options?.processId, payload: options?.payload }
  );
}

export function buildTrCompletedEvent(processId?: string): AdministrativeEventContract {
  return createTrComplianceEvent(
    TR_EVENT_CODES.COMPLETED,
    'TR concluído',
    { processId }
  );
}
