"use strict";
/**
 * Módulo TR (Termo de Referência).
 * Implementação real inicial: payload tipado, validações, eventos e metadados de decisão.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTrModule = executeTrModule;
const module_id_enum_1 = require("../../core/enums/module-id.enum");
const decision_origin_enum_1 = require("../../core/enums/decision-origin.enum");
const module_result_factory_1 = require("../../core/factories/module-result.factory");
const decision_metadata_factory_1 = require("../../core/factories/decision-metadata.factory");
const tr_mappers_1 = require("./tr.mappers");
const tr_validators_1 = require("./tr.validators");
const tr_events_1 = require("./tr.events");
const object_structure_extractor_1 = require("../shared/object-structure.extractor");
const calculation_memory_extractor_1 = require("../shared/calculation-memory.extractor");
const administrative_justification_extractor_1 = require("../shared/administrative-justification.extractor");
const metadata_composer_1 = require("../../shared/metadata/metadata-composer");
const event_builders_1 = require("../../shared/event-builders");
const administrative_coherence_engine_1 = require("../shared/administrative-coherence.engine");
const administrative_document_consistency_engine_1 = require("../shared/administrative-document-consistency.engine");
const administrative_decision_trace_engine_1 = require("../shared/administrative-decision-trace.engine");
const administrative_decision_explanation_engine_1 = require("../shared/administrative-decision-explanation.engine");
const administrative_document_engine_1 = require("../shared/administrative-document.engine");
const administrative_document_premium_engine_1 = require("../shared/administrative-document-premium.engine");
const administrative_need_extractor_1 = require("../shared/administrative-need.extractor");
const procurement_strategy_extractor_1 = require("../shared/procurement-strategy.extractor");
const module_validation_events_helper_1 = require("../shared/module-validation-events.helper");
async function executeTrModule(input) {
    const processId = input.context?.processId;
    const normalizedPayload = (0, tr_mappers_1.normalizeTrPayload)(input.payload ?? {});
    const extractedStructure = (0, object_structure_extractor_1.extractProcurementStructure)(normalizedPayload);
    const objectStructureMeta = (0, metadata_composer_1.buildObjectStructureMetadata)(extractedStructure);
    const extractedCalculationMemory = (0, calculation_memory_extractor_1.extractCalculationMemory)(normalizedPayload);
    const extractedAdministrativeJustification = (0, administrative_justification_extractor_1.extractAdministrativeJustification)(normalizedPayload);
    const extractedAdministrativeNeed = (0, administrative_need_extractor_1.extractAdministrativeNeed)(normalizedPayload);
    const extractedProcurementStrategy = (0, procurement_strategy_extractor_1.extractProcurementStrategy)(normalizedPayload);
    const validation = (0, tr_validators_1.validateTrInput)(normalizedPayload);
    const events = [
        (0, tr_events_1.buildTrStartedEvent)(processId),
    ];
    if (extractedStructure.structureType === 'lot') {
        events.push((0, event_builders_1.buildObjectStructureLotDetectedEvent)(module_id_enum_1.ModuleId.TR, objectStructureMeta, processId));
    }
    if (extractedCalculationMemory.count > 0) {
        events.push((0, event_builders_1.buildCalculationMemoryDetectedEvent)(module_id_enum_1.ModuleId.TR, {
            calculationMemoryCount: extractedCalculationMemory.count,
            calculationTypes: extractedCalculationMemory.calculationTypes,
            calculationTargets: extractedCalculationMemory.calculationTargets,
        }, processId));
    }
    if (extractedAdministrativeJustification.count > 0) {
        events.push((0, event_builders_1.buildAdministrativeJustificationDetectedEvent)(module_id_enum_1.ModuleId.TR, {
            totalJustifications: extractedAdministrativeJustification.count,
            processJustificationCount: extractedAdministrativeJustification.processJustificationCount,
            itemJustificationCount: extractedAdministrativeJustification.itemJustificationCount,
            lotJustificationCount: extractedAdministrativeJustification.lotJustificationCount,
            withLegalBasisCount: extractedAdministrativeJustification.withLegalBasisCount,
        }, processId));
    }
    const coherenceResult = (0, administrative_coherence_engine_1.executeAdministrativeCoherenceEngine)(extractedStructure, extractedCalculationMemory, extractedAdministrativeJustification);
    if (coherenceResult.hasCoherenceIssues) {
        events.push((0, event_builders_1.buildAdministrativeCoherenceIssuesDetectedEvent)(module_id_enum_1.ModuleId.TR, coherenceResult, processId));
    }
    else {
        events.push((0, event_builders_1.buildAdministrativeCoherenceValidEvent)(module_id_enum_1.ModuleId.TR, processId));
    }
    if (extractedAdministrativeNeed.count > 0) {
        events.push((0, event_builders_1.buildAdministrativeNeedDetectedEvent)(module_id_enum_1.ModuleId.TR, {
            totalNeeds: extractedAdministrativeNeed.count,
            processNeedCount: extractedAdministrativeNeed.processNeedCount,
            itemNeedCount: extractedAdministrativeNeed.itemNeedCount,
            lotNeedCount: extractedAdministrativeNeed.lotNeedCount,
        }, processId));
    }
    if (extractedProcurementStrategy.count > 0) {
        events.push((0, event_builders_1.buildProcurementStrategyDetectedEvent)(module_id_enum_1.ModuleId.TR, {
            totalStrategies: extractedProcurementStrategy.count,
            processStrategyCount: extractedProcurementStrategy.processStrategyCount,
            itemStrategyCount: extractedProcurementStrategy.itemStrategyCount,
            lotStrategyCount: extractedProcurementStrategy.lotStrategyCount,
        }, processId));
    }
    const documentConsistencyResult = (0, administrative_document_consistency_engine_1.executeAdministrativeDocumentConsistencyEngine)(extractedStructure, extractedCalculationMemory, extractedAdministrativeNeed, extractedAdministrativeJustification, extractedProcurementStrategy);
    if (documentConsistencyResult.hasIssues) {
        events.push((0, event_builders_1.buildAdministrativeDocumentConsistencyIssuesDetectedEvent)(module_id_enum_1.ModuleId.TR, documentConsistencyResult, processId));
    }
    else {
        events.push((0, event_builders_1.buildAdministrativeDocumentConsistencyValidEvent)(module_id_enum_1.ModuleId.TR, processId));
    }
    const decisionTraces = (0, administrative_decision_trace_engine_1.executeAdministrativeDecisionTraceEngine)({
        structure: { ...extractedStructure, moduleId: module_id_enum_1.ModuleId.TR },
        calculationMemory: extractedCalculationMemory,
        administrativeNeed: extractedAdministrativeNeed,
        administrativeJustification: extractedAdministrativeJustification,
        procurementStrategy: extractedProcurementStrategy,
        documentConsistency: documentConsistencyResult,
    });
    const decisionTraceMeta = (0, metadata_composer_1.buildDecisionTraceMetadata)(decisionTraces);
    events.push((0, event_builders_1.buildAdministrativeDecisionTraceGeneratedEvent)(module_id_enum_1.ModuleId.TR, {
        totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
        hasInconsistency: decisionTraceMeta.decisionTrace.hasInconsistency,
        hasIncomplete: decisionTraceMeta.decisionTrace.hasIncomplete,
    }, processId));
    if (decisionTraceMeta.decisionTrace.hasIncomplete) {
        events.push((0, event_builders_1.buildAdministrativeDecisionTraceIncompleteEvent)(module_id_enum_1.ModuleId.TR, {
            totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
            hasIncomplete: true,
        }, processId));
    }
    const decisionExplanations = (0, administrative_decision_explanation_engine_1.executeAdministrativeDecisionExplanationEngine)(decisionTraces);
    const decisionExplanationMeta = (0, metadata_composer_1.buildDecisionExplanationMetadata)(decisionExplanations);
    events.push((0, event_builders_1.buildAdministrativeDecisionExplanationGeneratedEvent)(module_id_enum_1.ModuleId.TR, {
        totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
        hasInconsistency: decisionExplanationMeta.decisionExplanation.hasInconsistency,
        hasIncomplete: decisionExplanationMeta.decisionExplanation.hasIncomplete,
    }, processId));
    if (decisionExplanationMeta.decisionExplanation.hasIncomplete) {
        events.push((0, event_builders_1.buildAdministrativeDecisionExplanationIncompleteEvent)(module_id_enum_1.ModuleId.TR, {
            totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
            hasIncomplete: true,
        }, processId));
    }
    const administrativeDocuments = (0, administrative_document_engine_1.executeAdministrativeDocumentEngine)(decisionTraces, decisionExplanations, normalizedPayload);
    const documentMeta = (0, metadata_composer_1.buildAdministrativeDocumentMetadata)(administrativeDocuments);
    const premiumDocuments = (0, administrative_document_premium_engine_1.executeAdministrativeDocumentPremiumEngine)(administrativeDocuments);
    const premiumDocumentMeta = (0, metadata_composer_1.buildAdministrativePremiumDocumentMetadata)(premiumDocuments);
    events.push((0, event_builders_1.buildAdministrativeDocumentGeneratedEvent)(module_id_enum_1.ModuleId.TR, {
        totalDocuments: documentMeta.document.totalDocuments,
        hasInconsistency: documentMeta.document.hasInconsistency,
        hasIncomplete: documentMeta.document.hasIncomplete,
    }, processId));
    if (documentMeta.document.hasIncomplete) {
        events.push((0, event_builders_1.buildAdministrativeDocumentIncompleteEvent)(module_id_enum_1.ModuleId.TR, {
            totalDocuments: documentMeta.document.totalDocuments,
            hasIncomplete: true,
        }, processId));
    }
    let decisionMetadata;
    let result;
    let shouldHalt;
    if (validation.hasBlocking) {
        events.push((0, tr_events_1.buildTrBlockedEvent)(validation.items.map((i) => i.message).join('; ') ?? 'Campos obrigatórios ausentes ou inválidos', { processId, payload: { validationCodes: validation.items.map((i) => i.code) } }));
        (0, module_validation_events_helper_1.appendCommonInvalidationEvents)({
            moduleId: module_id_enum_1.ModuleId.TR,
            validationItems: validation.items,
            counts: {
                calculationMemoryCount: extractedCalculationMemory.count,
                totalJustifications: extractedAdministrativeJustification.count,
                totalNeeds: extractedAdministrativeNeed.count,
                totalStrategies: extractedProcurementStrategy.count,
            },
            documentConsistencyResult,
            processId,
            events,
        });
        decisionMetadata = (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.MODULE, {
            moduleId: module_id_enum_1.ModuleId.TR,
            ruleId: 'TR_REQUIRED_FIELDS',
            rationale: 'Bloqueio por campos estruturais obrigatórios ausentes ou vazios.',
            payload: {
                blocked: true,
                approved: false,
                fieldsConsidered: Object.keys(normalizedPayload),
                validationItems: validation.items.map((i) => ({ code: i.code, field: i.field })),
            },
        });
        result = (0, module_result_factory_1.createBlockedResult)(validation.items.map((i) => i.message).join('; ') ?? 'Validação TR bloqueou', validation.items.map((i) => i.code));
        shouldHalt = true;
    }
    else if (!validation.valid) {
        events.push((0, tr_events_1.buildTrBlockedEvent)(validation.items.map((i) => i.message).join('; '), { processId }));
        decisionMetadata = (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.MODULE, {
            moduleId: module_id_enum_1.ModuleId.TR,
            ruleId: 'TR_VALIDATION',
            rationale: 'Validação do TR identificou erros.',
            payload: {
                blocked: true,
                approved: false,
                fieldsConsidered: Object.keys(normalizedPayload),
            },
        });
        result = (0, module_result_factory_1.createFailureResult)(validation.items.map((i) => i.message).join('; '), validation.items.map((i) => i.code));
        shouldHalt = true;
    }
    else {
        events.push((0, tr_events_1.buildTrValidatedEvent)(processId), (0, tr_events_1.buildTrCompletedEvent)(processId));
        decisionMetadata = (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.MODULE, {
            moduleId: module_id_enum_1.ModuleId.TR,
            ruleId: 'TR_APPROVED',
            rationale: 'Payload mínimo válido: todos os campos obrigatórios preenchidos.',
            payload: {
                blocked: false,
                approved: true,
                fieldsConsidered: Object.keys(normalizedPayload),
            },
        });
        result = (0, module_result_factory_1.createSuccessResult)({ ...normalizedPayload, _validatedByModule: 'TR' }, 'TR validado');
        shouldHalt = false;
    }
    return {
        moduleId: module_id_enum_1.ModuleId.TR,
        result,
        shouldHalt,
        events,
        metadata: {
            decisionMetadata,
            validations: validation.items,
            ...objectStructureMeta,
            ...(0, metadata_composer_1.buildCalculationMemoryMetadata)(extractedCalculationMemory),
            ...(0, metadata_composer_1.buildAdministrativeJustificationMetadata)(extractedAdministrativeJustification),
            ...(0, metadata_composer_1.buildAdministrativeCoherenceMetadata)(coherenceResult),
            ...(0, metadata_composer_1.buildAdministrativeNeedMetadata)(extractedAdministrativeNeed, extractedStructure),
            ...(0, metadata_composer_1.buildProcurementStrategyMetadata)(extractedProcurementStrategy, extractedStructure),
            ...(0, metadata_composer_1.buildDocumentConsistencyMetadata)(documentConsistencyResult),
            ...decisionTraceMeta,
            ...decisionExplanationMeta,
            ...documentMeta,
            ...premiumDocumentMeta,
            premiumDocuments,
        },
    };
}
