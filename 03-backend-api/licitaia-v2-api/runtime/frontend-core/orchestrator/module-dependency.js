"use strict";
/**
 * Verificação de dependência entre módulos do pipeline.
 * ETP depende de DFD; TR depende de ETP; PRICING depende de TR.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_DEPENDENCY_EVENT_CODES = void 0;
exports.checkModuleDependency = checkModuleDependency;
const module_id_enum_1 = require("../core/enums/module-id.enum");
exports.MODULE_DEPENDENCY_EVENT_CODES = {
    DEPENDENCY_MISSING: 'MODULE_DEPENDENCY_MISSING',
    DEPENDENCY_BLOCKED: 'MODULE_DEPENDENCY_BLOCKED',
};
/** Módulo que deve ter sido executado com sucesso antes de executar o módulo chave. */
const REQUIRED_PREVIOUS_MODULE = {
    [module_id_enum_1.ModuleId.ETP]: module_id_enum_1.ModuleId.DFD,
    [module_id_enum_1.ModuleId.TR]: module_id_enum_1.ModuleId.ETP,
    [module_id_enum_1.ModuleId.PRICING]: module_id_enum_1.ModuleId.TR,
};
/**
 * Verifica se o módulo pode ser executado com base nos outputs já produzidos.
 * DFD não tem dependência; ETP exige DFD; TR exige ETP; PRICING exige TR.
 */
function checkModuleDependency(moduleId, previousOutputs) {
    const requiredPrevious = REQUIRED_PREVIOUS_MODULE[moduleId];
    if (requiredPrevious === undefined) {
        return { satisfied: true };
    }
    const previousOutput = previousOutputs.find((o) => o.moduleId === requiredPrevious);
    if (!previousOutput) {
        return {
            satisfied: false,
            code: exports.MODULE_DEPENDENCY_EVENT_CODES.DEPENDENCY_MISSING,
            dependentModule: requiredPrevious,
            message: `Módulo ${moduleId} requer output do módulo ${requiredPrevious}, que não foi executado.`,
        };
    }
    const isBlocked = previousOutput.shouldHalt || previousOutput.result.status !== 'success';
    if (isBlocked) {
        return {
            satisfied: false,
            code: exports.MODULE_DEPENDENCY_EVENT_CODES.DEPENDENCY_BLOCKED,
            dependentModule: requiredPrevious,
            message: `Módulo ${moduleId} não pode executar: módulo dependente ${requiredPrevious} está bloqueado ou falhou.`,
        };
    }
    return { satisfied: true };
}
