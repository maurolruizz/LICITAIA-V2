"use strict";
/**
 * Validador de base legal para decisões do motor.
 * Exige referência normativa estruturalmente verificável (não apenas termos genéricos).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLegalBasis = validateLegalBasis;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const legal_basis_structure_util_1 = require("./legal/legal-basis-structure.util");
const LEGAL_BASIS_FIELD = 'legalBasis';
function validateLegalBasis(payload) {
    const items = [];
    const value = payload[LEGAL_BASIS_FIELD];
    if (value === undefined || value === null) {
        items.push((0, validation_result_factory_1.createValidationItem)('MISSING_LEGAL_REFERENCE', 'Base legal não informada (referência normativa obrigatória).', validation_severity_enum_1.ValidationSeverity.ERROR, { field: LEGAL_BASIS_FIELD }));
    }
    else if (typeof value !== 'string' || value.trim() === '') {
        items.push((0, validation_result_factory_1.createValidationItem)('INVALID_LEGAL_BASIS_STRUCTURE', 'Base legal deve conter citação normativa verificável (artigo, lei ou ato numerado).', validation_severity_enum_1.ValidationSeverity.ERROR, { field: LEGAL_BASIS_FIELD }));
    }
    else if (!(0, legal_basis_structure_util_1.hasVerifiableNormativeStructure)(value)) {
        items.push((0, validation_result_factory_1.createValidationItem)('INVALID_LEGAL_BASIS_STRUCTURE', 'Base legal genérica ou sem referência normativa concreta (ex.: art., lei, decreto com numeração).', validation_severity_enum_1.ValidationSeverity.ERROR, { field: LEGAL_BASIS_FIELD, details: { preview: value.slice(0, 120) } }));
    }
    return (0, validation_result_factory_1.createValidationResult)(items);
}
