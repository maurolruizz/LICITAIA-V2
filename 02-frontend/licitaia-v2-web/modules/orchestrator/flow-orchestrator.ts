/**
 * Orquestrador do fluxo: registra módulos, executa por fase e agrega resultados.
 * Interrompe o fluxo quando um módulo retorna shouldHalt.
 */

import type { ModuleInputContract } from '../core/contracts/module-input.contract';
import type { ModuleOutputContract } from '../core/contracts/module-output.contract';
import type { OrchestratorContextContract } from '../core/contracts/orchestrator.contract';
import { getModulesForPhase } from './flow-registry';
import { dispatchModule } from './flow-dispatcher';
import { hasHaltInOutputs, mergeModuleOutputs } from '../core/utils/module-merge';

export async function executeFlow(input: ModuleInputContract): Promise<OrchestratorContextContract> {
  const phase = input.phase as string;
  const processId = (input.context?.processId as string) ?? 'unknown';
  const moduleIds = getModulesForPhase(phase);
  const aggregatedOutputs: ModuleOutputContract[] = [];

  for (const moduleId of moduleIds) {
    const output = await dispatchModule(moduleId, input);
    aggregatedOutputs.push(output);
    if (output.shouldHalt) {
      break;
    }
  }

  const halted = hasHaltInOutputs(aggregatedOutputs);

  return {
    processId,
    phase,
    aggregatedOutputs: mergeModuleOutputs(aggregatedOutputs),
    halted,
  };
}

export function getModulesForPhaseFromOrchestrator(phase: string): string[] {
  return getModulesForPhase(phase) as unknown as string[];
}
