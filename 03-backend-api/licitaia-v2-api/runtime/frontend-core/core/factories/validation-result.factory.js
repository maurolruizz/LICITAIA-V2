"use strict";
/**
 * Factory para resultados de validação padronizados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationItem = createValidationItem;
exports.createValidationResult = createValidationResult;
exports.createEmptyValidationResult = createEmptyValidationResult;
const validation_severity_enum_1 = require("../enums/validation-severity.enum");
function createValidationItem(code, message, severity, options) {
    return {
        code,
        message,
        severity,
        field: options?.field,
        details: options?.details,
    };
}
function createValidationResult(items) {
    const hasBlocking = items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const hasError = items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.ERROR);
    const valid = items.length === 0 || (!hasBlocking && !hasError);
    return {
        valid,
        items,
        hasBlocking,
    };
}
function createEmptyValidationResult() {
    return createValidationResult([]);
}
