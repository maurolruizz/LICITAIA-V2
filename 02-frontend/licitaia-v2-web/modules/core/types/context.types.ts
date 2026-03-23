/**
 * Tipos de contexto de execução do motor.
 */

import type { ProcessPhase } from '../enums/process-phase.enum';

export interface ExecutionContext {
  processId: string;
  phase: ProcessPhase | string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
