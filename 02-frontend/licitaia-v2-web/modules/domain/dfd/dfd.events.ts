/**
 * Eventos administrativos reais do módulo DFD.
 * DFD_STARTED, DFD_VALIDATED, DFD_BLOCKED, DFD_COMPLETED.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from '../../shared/event-builders/compliance-event.builder';

export const DFD_EVENT_CODES = {
  STARTED: 'DFD_STARTED',
  VALIDATED: 'DFD_VALIDATED',
  BLOCKED: 'DFD_BLOCKED',
  COMPLETED: 'DFD_COMPLETED',
} as const;

export function createDfdComplianceEvent(
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return buildComplianceEvent(ModuleId.DFD, code, message, options);
}

export function buildDfdStartedEvent(processId?: string): AdministrativeEventContract {
  return createDfdComplianceEvent(
    DFD_EVENT_CODES.STARTED,
    'Processamento do DFD iniciado',
    { processId }
  );
}

export function buildDfdValidatedEvent(processId?: string): AdministrativeEventContract {
  return createDfdComplianceEvent(
    DFD_EVENT_CODES.VALIDATED,
    'DFD validado com sucesso',
    { processId }
  );
}

export function buildDfdBlockedEvent(
  reason: string,
  options?: { processId?: string; payload?: Record<string, unknown> }
): AdministrativeEventContract {
  return createDfdComplianceEvent(
    DFD_EVENT_CODES.BLOCKED,
    reason,
    { processId: options?.processId, payload: options?.payload }
  );
}

export function buildDfdCompletedEvent(processId?: string): AdministrativeEventContract {
  return createDfdComplianceEvent(
    DFD_EVENT_CODES.COMPLETED,
    'DFD concluído',
    { processId }
  );
}
