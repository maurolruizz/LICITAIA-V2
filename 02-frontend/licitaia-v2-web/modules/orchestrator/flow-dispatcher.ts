/**
 * Dispatcher: executa um único módulo e retorna o output.
 */

import type { ModuleInputContract } from '../core/contracts/module-input.contract';
import type { ModuleOutputContract } from '../core/contracts/module-output.contract';
import { getModuleDefinition } from './flow-registry';
import type { ModuleId } from '../core/enums/module-id.enum';
import { normalizeModuleInput } from '../core/utils/module-normalizers';

export async function dispatchModule(
  moduleId: ModuleId,
  input: ModuleInputContract
): Promise<ModuleOutputContract> {
  const definition = getModuleDefinition(moduleId);
  if (!definition) {
    return {
      moduleId,
      result: { status: 'failure', message: `Módulo não registrado: ${moduleId}` },
      shouldHalt: true,
    };
  }
  const normalizedInput = normalizeModuleInput({ ...input, moduleId });
  return definition.execute(normalizedInput);
}
