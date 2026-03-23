/**
 * Registro de módulos por fase do fluxo.
 * Mantém o mapeamento fase -> módulos a executar.
 */

import type { ModuleDefinition } from '../core/types/module.types';
import type { ModuleId } from '../core/enums/module-id.enum';

const phaseToModules: Map<string, ModuleId[]> = new Map();
const moduleDefinitions: Map<ModuleId, ModuleDefinition> = new Map();

export function registerModule(definition: ModuleDefinition): void {
  moduleDefinitions.set(definition.id, definition);
  for (const phase of definition.phases) {
    const existing = phaseToModules.get(phase) ?? [];
    if (!existing.includes(definition.id)) {
      phaseToModules.set(phase, [...existing, definition.id]);
    }
  }
}

export function getModulesForPhase(phase: string): ModuleId[] {
  return phaseToModules.get(phase) ?? [];
}

export function getModuleDefinition(id: ModuleId): ModuleDefinition | undefined {
  return moduleDefinitions.get(id);
}

export function getAllRegisteredModuleIds(): ModuleId[] {
  return Array.from(moduleDefinitions.keys());
}
