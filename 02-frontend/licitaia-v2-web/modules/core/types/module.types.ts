/**
 * Tipos estruturais dos módulos do motor LICITAIA V2.
 */

import type { ModuleInputContract } from '../contracts/module-input.contract';
import type { ModuleOutputContract } from '../contracts/module-output.contract';
import type { ModuleId } from '../enums/module-id.enum';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  /** Fases em que o módulo pode ser executado */
  phases: string[];
  /** Função de execução do módulo */
  execute: (input: ModuleInputContract) => Promise<ModuleOutputContract>;
}

export type ModuleExecutor = ModuleDefinition['execute'];
