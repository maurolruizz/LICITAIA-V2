/**
 * Tipo de contexto administrativo do processo.
 * Compatível com os contratos centrais (ModuleInputContract).
 */

import type { ProcessPhase } from '../core/enums/process-phase.enum';

export interface AdministrativeProcessContext {
  processId: string;
  tenantId?: string;
  userId?: string;
  phase: ProcessPhase | string;
  payload: Record<string, unknown>;
  timestamp?: string;
  correlationId?: string;
}
