"use strict";
/**
 * Utilitários de merge para resultados e contextos do motor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeModuleOutputs = mergeModuleOutputs;
exports.hasHaltInOutputs = hasHaltInOutputs;
exports.mergeOutputMetadata = mergeOutputMetadata;
/**
 * Agrega múltiplos outputs de módulos em uma lista, preservando ordem.
 */
function mergeModuleOutputs(outputs) {
    return [...outputs];
}
/**
 * Verifica se algum output indica parada do fluxo.
 */
function hasHaltInOutputs(outputs) {
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
function mergeOutputMetadata(outputs) {
    const aggregated = {};
    for (const out of outputs) {
        const raw = out.metadata;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            continue;
        const safe = raw;
        Object.assign(aggregated, safe);
    }
    return aggregated;
}
