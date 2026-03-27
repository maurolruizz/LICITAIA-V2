"use strict";
/**
 * Validações reais do módulo ETP (Estudo Técnico Preliminar).
 * Campos obrigatórios, textos não vazios, bloqueio quando faltar campo estrutural.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEtpInput = validateEtpInput;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const object_structure_extractor_1 = require("../shared/object-structure.extractor");
const object_structure_validator_1 = require("../shared/object-structure.validator");
const calculation_memory_extractor_1 = require("../shared/calculation-memory.extractor");
const calculation_memory_validator_1 = require("../shared/calculation-memory.validator");
const administrative_justification_extractor_1 = require("../shared/administrative-justification.extractor");
const administrative_justification_validator_1 = require("../shared/administrative-justification.validator");
const administrative_coherence_engine_1 = require("../shared/administrative-coherence.engine");
const administrative_coherence_validator_1 = require("../shared/administrative-coherence.validator");
const administrative_need_extractor_1 = require("../shared/administrative-need.extractor");
const administrative_need_validator_1 = require("../shared/administrative-need.validator");
const procurement_strategy_extractor_1 = require("../shared/procurement-strategy.extractor");
const procurement_strategy_validator_1 = require("../shared/procurement-strategy.validator");
const administrative_document_consistency_engine_1 = require("../shared/administrative-document-consistency.engine");
const administrative_document_consistency_validator_1 = require("../shared/administrative-document-consistency.validator");
const BLOCK_ON_MISSING = true;
function isEmptyText(value) {
    if (value === undefined || value === null)
        return true;
    if (typeof value !== 'string')
        return true;
    return value.trim().length === 0;
}
function validateRequiredTextField(payload, field, label, items, useBlock) {
    const value = payload[field];
    if (value === undefined || value === null) {
        items.push((0, validation_result_factory_1.createValidationItem)('ETP_FIELD_MISSING', `${label} é obrigatório`, useBlock ? validation_severity_enum_1.ValidationSeverity.BLOCK : validation_severity_enum_1.ValidationSeverity.ERROR, { field }));
        return;
    }
    if (isEmptyText(value)) {
        items.push((0, validation_result_factory_1.createValidationItem)('ETP_FIELD_EMPTY', `${label} não pode ser vazio`, useBlock ? validation_severity_enum_1.ValidationSeverity.BLOCK : validation_severity_enum_1.ValidationSeverity.ERROR, { field }));
    }
}
/**
 * Validações reais mínimas do ETP.
 * Bloqueia quando faltar campo estrutural obrigatório.
 */
function validateEtpInput(payload) {
    const items = [];
    validateRequiredTextField(payload, 'needDescription', 'Descrição da necessidade', items, BLOCK_ON_MISSING);
    validateRequiredTextField(payload, 'expectedResults', 'Resultados esperados', items, BLOCK_ON_MISSING);
    validateRequiredTextField(payload, 'solutionSummary', 'Resumo da solução', items, BLOCK_ON_MISSING);
    validateRequiredTextField(payload, 'technicalJustification', 'Justificativa técnica', items, BLOCK_ON_MISSING);
    validateRequiredTextField(payload, 'requestingDepartment', 'Área solicitante', items, BLOCK_ON_MISSING);
    validateRequiredTextField(payload, 'responsibleAnalyst', 'Responsável pela análise', items, BLOCK_ON_MISSING);
    if (payload.analysisDate === undefined || payload.analysisDate === null) {
        items.push((0, validation_result_factory_1.createValidationItem)('ETP_FIELD_MISSING', 'Data da análise é obrigatória', validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'analysisDate' }));
    }
    else if (typeof payload.analysisDate !== 'string' || payload.analysisDate.trim() === '') {
        items.push((0, validation_result_factory_1.createValidationItem)('ETP_FIELD_EMPTY', 'Data da análise não pode ser vazia', validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'analysisDate' }));
    }
    const extracted = (0, object_structure_extractor_1.extractProcurementStructure)(payload);
    (0, object_structure_validator_1.applyObjectStructureValidations)(extracted, payload, items);
    const calculationMemory = (0, calculation_memory_extractor_1.extractCalculationMemory)(payload);
    (0, calculation_memory_validator_1.applyCalculationMemoryValidations)(extracted, calculationMemory.entries, items);
    const administrativeJustification = (0, administrative_justification_extractor_1.extractAdministrativeJustification)(payload);
    const rawJustificationEntries = Array.isArray(payload.administrativeJustifications)
        ? payload.administrativeJustifications
        : payload.administrativeJustification != null
            ? [payload.administrativeJustification]
            : [];
    (0, administrative_justification_validator_1.applyAdministrativeJustificationValidations)(extracted, administrativeJustification.entries, items, rawJustificationEntries);
    const coherenceResult = (0, administrative_coherence_engine_1.executeAdministrativeCoherenceEngine)(extracted, calculationMemory, administrativeJustification);
    (0, administrative_coherence_validator_1.applyAdministrativeCoherenceValidations)(coherenceResult, items);
    const administrativeNeed = (0, administrative_need_extractor_1.extractAdministrativeNeed)(payload);
    const rawNeedEntries = Array.isArray(payload.administrativeNeeds)
        ? payload.administrativeNeeds
        : payload.administrativeNeed != null
            ? [payload.administrativeNeed]
            : [];
    (0, administrative_need_validator_1.applyAdministrativeNeedValidations)(extracted, administrativeNeed.entries, items, rawNeedEntries);
    const procurementStrategy = (0, procurement_strategy_extractor_1.extractProcurementStrategy)(payload);
    const rawStrategyEntries = Array.isArray(payload.procurementStrategies)
        ? payload.procurementStrategies
        : payload.procurementStrategy != null
            ? [payload.procurementStrategy]
            : [];
    (0, procurement_strategy_validator_1.applyProcurementStrategyValidations)(extracted, procurementStrategy.entries, items, rawStrategyEntries);
    const documentConsistencyResult = (0, administrative_document_consistency_engine_1.executeAdministrativeDocumentConsistencyEngine)(extracted, calculationMemory, administrativeNeed, administrativeJustification, procurementStrategy);
    (0, administrative_document_consistency_validator_1.applyAdministrativeDocumentConsistencyValidations)(documentConsistencyResult, items);
    return (0, validation_result_factory_1.createValidationResult)(items);
}
