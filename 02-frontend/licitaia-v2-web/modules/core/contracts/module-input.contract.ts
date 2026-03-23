/**
 * Contrato de entrada para módulos do motor LICITAIA V2.
 * Define a estrutura mínima que todo módulo deve receber.
 */

import type { ProcessPhase } from '../enums/process-phase.enum';
import type { ModuleId } from '../enums/module-id.enum';

export interface ModuleInputContract {
  /** Identificador do módulo que está processando */
  moduleId: ModuleId;
  /** Fase do processo administrativo no momento da execução */
  phase: ProcessPhase;
  /** Dados do processo/contrato em análise */
  payload: Record<string, unknown>;
  /** Contexto opcional (ID do processo, usuário, etc.) */
  context?: Record<string, unknown>;
  /** Timestamp da requisição */
  timestamp?: string;
}
