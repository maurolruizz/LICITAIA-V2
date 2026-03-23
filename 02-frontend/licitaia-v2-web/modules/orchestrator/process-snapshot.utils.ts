/**
 * ETAPA A — processSnapshot: clone determinístico e merge após módulo com sucesso.
 */

const PROTECTED_SNAPSHOT_KEYS = new Set([
  'legalRegime',
  'objectType',
  'objectStructure',
  'executionForm',
]);

export function deepCloneProcessSnapshot(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
}

/**
 * Incorpora result.data do módulo no snapshot sem sobrescrever classificadores normativos.
 */
export function mergeModuleSuccessDataIntoSnapshot(
  snapshot: Record<string, unknown>,
  moduleData: unknown
): void {
  if (moduleData === null || moduleData === undefined) return;
  if (typeof moduleData !== 'object' || Array.isArray(moduleData)) return;
  const d = moduleData as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) {
    if (PROTECTED_SNAPSHOT_KEYS.has(k)) continue;
    if (k.startsWith('_')) continue;
    snapshot[k] = v;
  }
}
