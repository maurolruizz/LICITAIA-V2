"use strict";
/**
 * Validador de campos obrigatórios para payloads do motor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredFields = validateRequiredFields;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
function validateRequiredFields(payload, requiredFields) {
    const items = [];
    for (const field of requiredFields) {
        const value = payload[field];
        if (value === undefined || value === null || value === '') {
            items.push((0, validation_result_factory_1.createValidationItem)('REQUIRED_FIELD_MISSING', `Campo obrigatório ausente: ${field}`, validation_severity_enum_1.ValidationSeverity.ERROR, { field }));
        }
    }
    return (0, validation_result_factory_1.createValidationResult)(items);
}
