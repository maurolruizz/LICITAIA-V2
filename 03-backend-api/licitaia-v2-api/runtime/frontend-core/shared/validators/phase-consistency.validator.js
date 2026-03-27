"use strict";
/**
 * Validador de consistência de fase do processo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePhaseConsistency = validatePhaseConsistency;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const process_phase_enum_1 = require("../../core/enums/process-phase.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const VALID_PHASES = Object.values(process_phase_enum_1.ProcessPhase);
function validatePhaseConsistency(phase) {
    const items = [];
    if (!phase || typeof phase !== 'string') {
        items.push((0, validation_result_factory_1.createValidationItem)('PHASE_MISSING', 'Fase do processo não informada', validation_severity_enum_1.ValidationSeverity.ERROR));
    }
    else if (!VALID_PHASES.includes(phase)) {
        items.push((0, validation_result_factory_1.createValidationItem)('PHASE_INVALID', `Fase inválida: ${phase}. Valores esperados: ${VALID_PHASES.join(', ')}`, validation_severity_enum_1.ValidationSeverity.ERROR));
    }
    return (0, validation_result_factory_1.createValidationResult)(items);
}
