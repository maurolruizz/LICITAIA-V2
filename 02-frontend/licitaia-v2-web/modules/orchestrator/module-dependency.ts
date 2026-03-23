/**
 * Verificação de dependência entre módulos do pipeline.
 * ETP depende de DFD; TR depende de ETP; PRICING depende de TR.
 */

import type { ModuleOutputContract } from '../core/contracts/module-output.contract';
import { ModuleId } from '../core/enums/module-id.enum';

export const MODULE_DEPENDENCY_EVENT_CODES = {
  DEPENDENCY_MISSING: 'MODULE_DEPENDENCY_MISSING',
  DEPENDENCY_BLOCKED: 'MODULE_DEPENDENCY_BLOCKED',
} as const;

/** Módulo que deve ter sido executado com sucesso antes de executar o módulo chave. */
const REQUIRED_PREVIOUS_MODULE: Partial<Record<ModuleId, ModuleId>> = {
  [ModuleId.ETP]: ModuleId.DFD,
  [ModuleId.TR]: ModuleId.ETP,
  [ModuleId.PRICING]: ModuleId.TR,
};

export interface DependencyCheckOk {
  satisfied: true;
}

export interface DependencyCheckFail {
  satisfied: false;
  code: typeof MODULE_DEPENDENCY_EVENT_CODES[keyof typeof MODULE_DEPENDENCY_EVENT_CODES];
  dependentModule: ModuleId;
  message: string;
}

export type DependencyCheckResult = DependencyCheckOk | DependencyCheckFail;

/**
 * Verifica se o módulo pode ser executado com base nos outputs já produzidos.
 * DFD não tem dependência; ETP exige DFD; TR exige ETP; PRICING exige TR.
 */
export function checkModuleDependency(
  moduleId: ModuleId,
  previousOutputs: ModuleOutputContract[]
): DependencyCheckResult {
  const requiredPrevious = REQUIRED_PREVIOUS_MODULE[moduleId];
  if (requiredPrevious === undefined) {
    return { satisfied: true };
  }

  const previousOutput = previousOutputs.find((o) => o.moduleId === requiredPrevious);
  if (!previousOutput) {
    return {
      satisfied: false,
      code: MODULE_DEPENDENCY_EVENT_CODES.DEPENDENCY_MISSING,
      dependentModule: requiredPrevious,
      message: `Módulo ${moduleId} requer output do módulo ${requiredPrevious}, que não foi executado.`,
    };
  }

  const isBlocked = previousOutput.shouldHalt || previousOutput.result.status !== 'success';
  if (isBlocked) {
    return {
      satisfied: false,
      code: MODULE_DEPENDENCY_EVENT_CODES.DEPENDENCY_BLOCKED,
      dependentModule: requiredPrevious,
      message: `Módulo ${moduleId} não pode executar: módulo dependente ${requiredPrevious} está bloqueado ou falhou.`,
    };
  }

  return { satisfied: true };
}
