"use strict";
/**
 * Dispatcher: executa um único módulo e retorna o output.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchModule = dispatchModule;
const flow_registry_1 = require("./flow-registry");
const module_normalizers_1 = require("../core/utils/module-normalizers");
async function dispatchModule(moduleId, input) {
    const definition = (0, flow_registry_1.getModuleDefinition)(moduleId);
    if (!definition) {
        return {
            moduleId,
            result: { status: 'failure', message: `Módulo não registrado: ${moduleId}` },
            shouldHalt: true,
        };
    }
    const normalizedInput = (0, module_normalizers_1.normalizeModuleInput)({ ...input, moduleId });
    return definition.execute(normalizedInput);
}
