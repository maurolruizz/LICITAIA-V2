/**
 * Eventos administrativos reais do módulo ETP.
 * ETP_STARTED, ETP_VALIDATED, ETP_BLOCKED, ETP_COMPLETED.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from '../../shared/event-builders/compliance-event.builder';

export const ETP_EVENT_CODES = {
  STARTED: 'ETP_STARTED',
  VALIDATED: 'ETP_VALIDATED',
  BLOCKED: 'ETP_BLOCKED',
  COMPLETED: 'ETP_COMPLETED',
} as const;

export function createEtpComplianceEvent(
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return buildComplianceEvent(ModuleId.ETP, code, message, options);
}

export function buildEtpStartedEvent(processId?: string): AdministrativeEventContract {
  return createEtpComplianceEvent(
    ETP_EVENT_CODES.STARTED,
    'Processamento do ETP iniciado',
    { processId }
  );
}

export function buildEtpValidatedEvent(processId?: string): AdministrativeEventContract {
  return createEtpComplianceEvent(
    ETP_EVENT_CODES.VALIDATED,
    'ETP validado com sucesso',
    { processId }
  );
}

export function buildEtpBlockedEvent(
  reason: string,
  options?: { processId?: string; payload?: Record<string, unknown> }
): AdministrativeEventContract {
  return createEtpComplianceEvent(
    ETP_EVENT_CODES.BLOCKED,
    reason,
    { processId: options?.processId, payload: options?.payload }
  );
}

export function buildEtpCompletedEvent(processId?: string): AdministrativeEventContract {
  return createEtpComplianceEvent(
    ETP_EVENT_CODES.COMPLETED,
    'ETP concluído',
    { processId }
  );
}
