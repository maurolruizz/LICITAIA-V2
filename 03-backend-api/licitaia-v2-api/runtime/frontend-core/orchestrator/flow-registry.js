"use strict";
/**
 * Registro de módulos por fase do fluxo.
 * Mantém o mapeamento fase -> módulos a executar.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModule = registerModule;
exports.getModulesForPhase = getModulesForPhase;
exports.getModuleDefinition = getModuleDefinition;
exports.getAllRegisteredModuleIds = getAllRegisteredModuleIds;
const phaseToModules = new Map();
const moduleDefinitions = new Map();
function registerModule(definition) {
    moduleDefinitions.set(definition.id, definition);
    for (const phase of definition.phases) {
        const existing = phaseToModules.get(phase) ?? [];
        if (!existing.includes(definition.id)) {
            phaseToModules.set(phase, [...existing, definition.id]);
        }
    }
}
function getModulesForPhase(phase) {
    return phaseToModules.get(phase) ?? [];
}
function getModuleDefinition(id) {
    return moduleDefinitions.get(id);
}
function getAllRegisteredModuleIds() {
    return Array.from(moduleDefinitions.keys());
}
