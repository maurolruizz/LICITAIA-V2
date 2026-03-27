"use strict";
/**
 * Validador de base legal para decisões do motor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLegalBasis = validateLegalBasis;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const LEGAL_BASIS_FIELD = 'legalBasis';
function validateLegalBasis(payload) {
    const items = [];
    const value = payload[LEGAL_BASIS_FIELD];
    if (value === undefined || value === null) {
        items.push((0, validation_result_factory_1.createValidationItem)('LEGAL_BASIS_MISSING', 'Base legal não informada', validation_severity_enum_1.ValidationSeverity.ERROR, { field: LEGAL_BASIS_FIELD }));
    }
    else if (typeof value !== 'string' || value.trim() === '') {
        items.push((0, validation_result_factory_1.createValidationItem)('LEGAL_BASIS_INVALID', 'Base legal deve ser um texto não vazio', validation_severity_enum_1.ValidationSeverity.ERROR, { field: LEGAL_BASIS_FIELD }));
    }
    return (0, validation_result_factory_1.createValidationResult)(items);
}
