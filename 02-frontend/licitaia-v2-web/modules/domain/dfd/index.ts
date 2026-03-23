/**
 * Módulo DFD - ponto de entrada.
 */

export { executeDfdModule } from './dfd.module';
export { validateDfdInput } from './dfd.validators';
export {
  createDfdComplianceEvent,
  buildDfdStartedEvent,
  buildDfdValidatedEvent,
  buildDfdBlockedEvent,
  buildDfdCompletedEvent,
  DFD_EVENT_CODES,
} from './dfd.events';
export { normalizeDfdPayload, mapDfdPayloadToContext } from './dfd.mappers';
export type { DfdPayload } from './dfd.types';
