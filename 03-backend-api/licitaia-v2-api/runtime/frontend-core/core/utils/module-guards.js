"use strict";
/**
 * Guards e type guards para o motor modular.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isModuleInputContract = isModuleInputContract;
exports.isModuleOutputContract = isModuleOutputContract;
exports.shouldHaltFlow = shouldHaltFlow;
function isModuleInputContract(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const o = value;
    return (typeof o.moduleId === 'string' &&
        typeof o.phase === 'string' &&
        typeof o.payload === 'object' &&
        o.payload !== null);
}
function isModuleOutputContract(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const o = value;
    return (typeof o.moduleId === 'string' &&
        typeof o.result === 'object' &&
        o.result !== null &&
        typeof o.result.status === 'string' &&
        typeof o.shouldHalt === 'boolean');
}
function shouldHaltFlow(output) {
    return output.shouldHalt === true;
}
