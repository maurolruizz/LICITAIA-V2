/**
 * Contrato de eventos administrativos do motor LICITAIA V2.
 */

import type { EventType } from '../enums/event-type.enum';
import type { ModuleId } from '../enums/module-id.enum';

export interface AdministrativeEventContract {
  /** Tipo do evento */
  type: EventType;
  /** Módulo que emitiu o evento (ModuleId; string/number aceitos por compatibilidade de compilação cruzada) */
  source: ModuleId | string | number;
  /** Código do evento (ex: COMPLIANCE_CHECK, PHASE_ENTER) */
  code: string;
  /** Mensagem legível */
  message: string;
  /** Timestamp ISO */
  timestamp: string;
  /** Dados adicionais do evento */
  payload?: Record<string, unknown>;
  /** ID do processo/contexto quando aplicável */
  processId?: string;
}
