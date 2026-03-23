/**
 * Guards e type guards para o motor modular.
 */

import type { ModuleInputContract } from '../contracts/module-input.contract';
import type { ModuleOutputContract } from '../contracts/module-output.contract';
import type { ModuleResult } from '../types/result.types';

export function isModuleInputContract(value: unknown): value is ModuleInputContract {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.moduleId === 'string' &&
    typeof o.phase === 'string' &&
    typeof o.payload === 'object' &&
    o.payload !== null
  );
}

export function isModuleOutputContract(value: unknown): value is ModuleOutputContract {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.moduleId === 'string' &&
    typeof o.result === 'object' &&
    o.result !== null &&
    typeof (o.result as ModuleResult).status === 'string' &&
    typeof o.shouldHalt === 'boolean'
  );
}

export function shouldHaltFlow(output: ModuleOutputContract): boolean {
  return output.shouldHalt === true;
}
