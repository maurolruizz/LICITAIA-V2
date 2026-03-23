/**
 * Eventos administrativos reais do módulo Pricing.
 * PRICING_STARTED, PRICING_VALIDATED, PRICING_BLOCKED, PRICING_COMPLETED.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from '../../shared/event-builders/compliance-event.builder';

export const PRICING_EVENT_CODES = {
  STARTED: 'PRICING_STARTED',
  VALIDATED: 'PRICING_VALIDATED',
  BLOCKED: 'PRICING_BLOCKED',
  COMPLETED: 'PRICING_COMPLETED',
} as const;

export function createPricingComplianceEvent(
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return buildComplianceEvent(ModuleId.PRICING, code, message, options);
}

export function buildPricingStartedEvent(processId?: string): AdministrativeEventContract {
  return createPricingComplianceEvent(
    PRICING_EVENT_CODES.STARTED,
    'Processamento do Pricing iniciado',
    { processId }
  );
}

export function buildPricingValidatedEvent(processId?: string): AdministrativeEventContract {
  return createPricingComplianceEvent(
    PRICING_EVENT_CODES.VALIDATED,
    'Pricing validado com sucesso',
    { processId }
  );
}

export function buildPricingBlockedEvent(
  reason: string,
  options?: { processId?: string; payload?: Record<string, unknown> }
): AdministrativeEventContract {
  return createPricingComplianceEvent(
    PRICING_EVENT_CODES.BLOCKED,
    reason,
    { processId: options?.processId, payload: options?.payload }
  );
}

export function buildPricingCompletedEvent(processId?: string): AdministrativeEventContract {
  return createPricingComplianceEvent(
    PRICING_EVENT_CODES.COMPLETED,
    'Pricing concluído',
    { processId }
  );
}
