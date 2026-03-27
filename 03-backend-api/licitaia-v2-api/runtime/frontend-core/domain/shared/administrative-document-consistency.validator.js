"use strict";
/**
 * Validações do Motor de Consistência Documental Administrativa.
 * Fase 28 — Aplica resultado do engine como itens de validação (BLOCK/WARNING).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAdministrativeDocumentConsistencyValidations = applyAdministrativeDocumentConsistencyValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const CONSISTENCY_CODE_PREFIX = 'ADMIN_DOCUMENT_CONSISTENCY_';
function mapSeverity(severity) {
    return severity === 'BLOCK' ? validation_severity_enum_1.ValidationSeverity.BLOCK : validation_severity_enum_1.ValidationSeverity.WARNING;
}
/**
 * Aplica as inconsistências documentais como itens de validação.
 * Inconsistências críticas (BLOCK) bloqueiam; menores (WARNING) apenas registram.
 */
function applyAdministrativeDocumentConsistencyValidations(result, items) {
    if (!result.hasIssues || result.issues.length === 0)
        return;
    for (const issue of result.issues) {
        const code = `${CONSISTENCY_CODE_PREFIX}${issue.issueType}`;
        items.push((0, validation_result_factory_1.createValidationItem)(code, issue.message, mapSeverity(issue.severity), {
            field: 'documentConsistency',
            details: {
                issueType: issue.issueType,
                relatedNeed: issue.relatedNeed,
                relatedStructure: issue.relatedStructure,
                relatedCalculation: issue.relatedCalculation,
                relatedJustification: issue.relatedJustification,
                relatedStrategy: issue.relatedStrategy,
            },
        }));
    }
}
