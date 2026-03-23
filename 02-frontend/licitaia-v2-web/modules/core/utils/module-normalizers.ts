/**
 * Normalizadores para inputs e payloads do motor modular.
 */

import type { ModuleInputContract } from '../contracts/module-input.contract';

/**
 * Garante que payload seja um objeto (nunca null/undefined).
 */
export function normalizePayload(
  input: ModuleInputContract
): ModuleInputContract {
  return {
    ...input,
    payload: input.payload && typeof input.payload === 'object' ? input.payload : {},
  };
}

/**
 * Garante timestamp presente no input.
 */
export function normalizeInputTimestamp(
  input: ModuleInputContract
): ModuleInputContract {
  return {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Aplica todas as normalizações de input.
 */
export function normalizeModuleInput(input: ModuleInputContract): ModuleInputContract {
  return normalizeInputTimestamp(normalizePayload(input));
}
