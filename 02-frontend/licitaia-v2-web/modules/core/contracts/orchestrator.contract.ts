/**
 * Contrato do orquestrador de fluxo do motor LICITAIA V2.
 */

import type { ModuleInputContract } from './module-input.contract';
import type { ModuleOutputContract } from './module-output.contract';

export interface OrchestratorContextContract {
  /** ID do processo em execução */
  processId: string;
  /** Fase atual */
  phase: string;
  /** Resultados já agregados dos módulos executados */
  aggregatedOutputs: ModuleOutputContract[];
  /** Indica se o fluxo foi interrompido */
  halted: boolean;
}

export interface FlowOrchestratorContract {
  /** Registra e executa o fluxo para um input dado */
  execute(input: ModuleInputContract): Promise<OrchestratorContextContract>;
  /** Retorna os módulos registrados para uma fase */
  getModulesForPhase(phase: string): string[];
}
