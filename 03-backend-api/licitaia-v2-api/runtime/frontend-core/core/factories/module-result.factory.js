"use strict";
/**
 * Factory para resultados padronizados de módulos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModuleResult = createModuleResult;
exports.createSuccessResult = createSuccessResult;
exports.createFailureResult = createFailureResult;
exports.createBlockedResult = createBlockedResult;
function createModuleResult(status, options) {
    return {
        status,
        message: options?.message,
        data: options?.data,
        codes: options?.codes,
    };
}
function createSuccessResult(data, message) {
    return createModuleResult('success', { message: message ?? 'OK', data });
}
function createFailureResult(message, codes) {
    return createModuleResult('failure', { message, codes });
}
function createBlockedResult(message, codes) {
    return createModuleResult('blocked', { message, codes });
}
