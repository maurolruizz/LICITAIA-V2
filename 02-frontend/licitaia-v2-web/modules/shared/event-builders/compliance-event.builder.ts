/**
 * Builder de eventos de conformidade.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { EventType } from '../../core/enums/event-type.enum';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { createAdministrativeEvent } from '../../core/factories/administrative-event.factory';

export function buildComplianceEvent(
  source: ModuleId | string | number,
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return createAdministrativeEvent(EventType.COMPLIANCE, source, code, message, options);
}
