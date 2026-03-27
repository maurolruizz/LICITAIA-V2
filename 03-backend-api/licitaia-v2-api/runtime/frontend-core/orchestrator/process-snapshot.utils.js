"use strict";
/**
 * ETAPA A — processSnapshot: clone determinístico e merge após módulo com sucesso.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepCloneProcessSnapshot = deepCloneProcessSnapshot;
exports.mergeModuleSuccessDataIntoSnapshot = mergeModuleSuccessDataIntoSnapshot;
const PROTECTED_SNAPSHOT_KEYS = new Set([
    'legalRegime',
    'objectType',
    'objectStructure',
    'executionForm',
]);
function deepCloneProcessSnapshot(payload) {
    return JSON.parse(JSON.stringify(payload));
}
/**
 * Incorpora result.data do módulo no snapshot sem sobrescrever classificadores normativos.
 */
function mergeModuleSuccessDataIntoSnapshot(snapshot, moduleData) {
    if (moduleData === null || moduleData === undefined)
        return;
    if (typeof moduleData !== 'object' || Array.isArray(moduleData))
        return;
    const d = moduleData;
    for (const [k, v] of Object.entries(d)) {
        if (PROTECTED_SNAPSHOT_KEYS.has(k))
            continue;
        if (k.startsWith('_'))
            continue;
        snapshot[k] = v;
    }
}
