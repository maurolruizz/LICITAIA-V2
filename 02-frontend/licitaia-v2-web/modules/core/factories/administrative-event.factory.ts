/**
 * Factory para eventos administrativos padronizados.
 */

import type { AdministrativeEventContract } from '../contracts/event.contract';
import type { EventType } from '../enums/event-type.enum';
import type { ModuleId } from '../enums/module-id.enum';

export function createAdministrativeEvent(
  type: EventType,
  source: ModuleId | string | number,
  code: string,
  message: string,
  options?: { payload?: Record<string, unknown>; processId?: string }
): AdministrativeEventContract {
  return {
    type,
    source,
    code,
    message,
    timestamp: new Date().toISOString(),
    payload: options?.payload,
    processId: options?.processId,
  };
}
