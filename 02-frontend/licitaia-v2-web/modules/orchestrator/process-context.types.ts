/**
 * Tipo de contexto administrativo do processo.
 * Compatível com os contratos centrais (ModuleInputContract).
 */

import type { ProcessPhase } from '../core/enums/process-phase.enum';

/** Origem da execução no host (API). Ausente => execução padrão completa. */
export type ProcessExecutionSource = 'standard_execution' | 'preflight';

export interface AdministrativeProcessContext {
  processId: string;
  tenantId?: string;
  userId?: string;
  phase: ProcessPhase | string;
  payload: Record<string, unknown>;
  timestamp?: string;
  correlationId?: string;
  /**
   * Metadado de borda: modo normativo do motor.
   * `preflight` => regime-behavior-engine em modo basic; caso contrário full.
   */
  execution?: { source: ProcessExecutionSource };
}
