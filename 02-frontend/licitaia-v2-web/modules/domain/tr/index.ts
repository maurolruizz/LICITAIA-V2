/**
 * Módulo TR - ponto de entrada.
 */

export { executeTrModule } from './tr.module';
export { validateTrInput } from './tr.validators';
export {
  createTrComplianceEvent,
  buildTrStartedEvent,
  buildTrValidatedEvent,
  buildTrBlockedEvent,
  buildTrCompletedEvent,
  TR_EVENT_CODES,
} from './tr.events';
export { normalizeTrPayload, mapTrPayloadToContext } from './tr.mappers';
export type { TrPayload } from './tr.types';
