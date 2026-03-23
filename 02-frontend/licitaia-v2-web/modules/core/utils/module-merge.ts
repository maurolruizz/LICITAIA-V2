/**
 * Utilitários de merge para resultados e contextos do motor.
 */

import type { ModuleOutputContract } from '../contracts/module-output.contract';

/**
 * Agrega múltiplos outputs de módulos em uma lista, preservando ordem.
 */
export function mergeModuleOutputs(
  outputs: ModuleOutputContract[]
): ModuleOutputContract[] {
  return [...outputs];
}

/**
 * Verifica se algum output indica parada do fluxo.
 */
export function hasHaltInOutputs(outputs: ModuleOutputContract[]): boolean {
  return outputs.some((o) => o.shouldHalt);
}

/**
 * Consolida metadados de vários outputs em estrutura simples e compatível.
 *
 * Política adotada (helper genérico de core):
 * - apenas objetos simples são considerados;
 * - chaves posteriores sobrescrevem anteriores em caso de conflito;
 * - nenhum acoplamento a políticas específicas de orchestrators.
 */
export function mergeOutputMetadata(
  outputs: ModuleOutputContract[]
): Record<string, unknown> {
  const aggregated: Record<string, unknown> = {};

  for (const out of outputs) {
    const raw = out.metadata;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

    const safe = raw as Record<string, unknown>;
    Object.assign(aggregated, safe);
  }

  return aggregated;
}
