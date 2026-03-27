"use strict";
/**
 * Validações do Motor de Coerência Administrativa.
 * Fase 25 — Aplica resultados do engine como itens de validação.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAdministrativeCoherenceValidations = applyAdministrativeCoherenceValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const COHERENCE_CODE_PREFIX = 'ADMINISTRATIVE_COHERENCE_';
function mapSeverity(severity) {
    switch (severity) {
        case 'BLOCK':
            return validation_severity_enum_1.ValidationSeverity.BLOCK;
        case 'ERROR':
            return validation_severity_enum_1.ValidationSeverity.ERROR;
        case 'WARNING':
            return validation_severity_enum_1.ValidationSeverity.WARNING;
        case 'INFO':
            return validation_severity_enum_1.ValidationSeverity.INFO;
        default:
            return validation_severity_enum_1.ValidationSeverity.WARNING;
    }
}
/**
 * Aplica os resultados do Motor de Coerência Administrativa como itens de validação.
 * Não altera documentos; apenas adiciona itens à lista existente.
 */
function applyAdministrativeCoherenceValidations(coherenceResult, items) {
    if (!coherenceResult.hasCoherenceIssues || coherenceResult.issues.length === 0)
        return;
    for (const issue of coherenceResult.issues) {
        const code = `${COHERENCE_CODE_PREFIX}${issue.type}`;
        items.push((0, validation_result_factory_1.createValidationItem)(code, issue.message, mapSeverity(issue.severity), { details: { targetType: issue.targetType, targetId: issue.targetId, coherenceIssueType: issue.type } }));
    }
}
