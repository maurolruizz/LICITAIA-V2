"use strict";
/**
 * Validador de consistência cruzada entre módulos do processo administrativo.
 * Compara coerência entre DFD↔ETP, ETP↔TR e TR↔Pricing usando payload do contexto.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrossModuleConsistency = validateCrossModuleConsistency;
const module_id_enum_1 = require("../../../core/enums/module-id.enum");
const event_type_enum_1 = require("../../../core/enums/event-type.enum");
const decision_origin_enum_1 = require("../../../core/enums/decision-origin.enum");
const validation_severity_enum_1 = require("../../../core/enums/validation-severity.enum");
const administrative_event_factory_1 = require("../../../core/factories/administrative-event.factory");
const decision_metadata_factory_1 = require("../../../core/factories/decision-metadata.factory");
const cross_module_consistency_rules_1 = require("./cross-module-consistency-rules");
/** Par obrigatório: módulo atual → módulo anterior (para validação) */
const REQUIRED_PREVIOUS_MODULE = {
    [module_id_enum_1.ModuleId.ETP]: module_id_enum_1.ModuleId.DFD,
    [module_id_enum_1.ModuleId.TR]: module_id_enum_1.ModuleId.ETP,
    [module_id_enum_1.ModuleId.PRICING]: module_id_enum_1.ModuleId.TR,
};
function getPair(previousModuleId, currentModuleId) {
    if (previousModuleId === module_id_enum_1.ModuleId.DFD && currentModuleId === module_id_enum_1.ModuleId.ETP)
        return 'DFD_ETP';
    if (previousModuleId === module_id_enum_1.ModuleId.ETP && currentModuleId === module_id_enum_1.ModuleId.TR)
        return 'ETP_TR';
    if (previousModuleId === module_id_enum_1.ModuleId.TR && currentModuleId === module_id_enum_1.ModuleId.PRICING)
        return 'TR_PRICING';
    return null;
}
/**
 * Executa validação cruzada entre o módulo atual e o anterior.
 * ETAPA A — Usa exclusivamente processSnapshot (fonte única de domínio).
 * Se não houver módulo anterior (ex.: DFD), retorna resultado vazio.
 */
function validateCrossModuleConsistency(currentModuleId, currentOutput, previousOutput, processSnapshot, processId) {
    const validationItems = [];
    const events = [];
    const decisionMetadata = [];
    const previousModuleId = REQUIRED_PREVIOUS_MODULE[currentModuleId];
    if (!previousModuleId || !previousOutput) {
        return {
            validationItems: [],
            events: [],
            decisionMetadata: [],
            hasBlocking: false,
        };
    }
    const pair = getPair(previousModuleId, currentModuleId);
    if (!pair) {
        return {
            validationItems: [],
            events: [],
            decisionMetadata: [],
            hasBlocking: false,
        };
    }
    const previousDescription = (0, cross_module_consistency_rules_1.extractDescriptionFromPayload)(processSnapshot, previousModuleId);
    const currentDescription = (0, cross_module_consistency_rules_1.extractDescriptionFromPayload)(processSnapshot, currentModuleId);
    const items = (0, cross_module_consistency_rules_1.applyConsistencyRule)(pair, previousDescription, currentDescription, previousModuleId, currentModuleId);
    validationItems.push(...items);
    const hasBlocking = items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const ruleId = (0, cross_module_consistency_rules_1.getCrossValidationRuleId)(pair);
    if (items.length > 0) {
        const message = hasBlocking
            ? `Validação cruzada ${pair}: inconsistência estrutural detectada.`
            : `Validação cruzada ${pair}: ${items.length} item(ns) de consistência.`;
        const rationale = hasBlocking
            ? 'Inconsistência estrutural entre módulos do processo (objeto ausente ou incoerente).'
            : 'Verificação de coerência entre descrições dos módulos do pipeline.';
        const blockingItem = items.find((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
        const severity = blockingItem?.severity ?? items[0].severity;
        events.push((0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.VALIDATION, currentModuleId, 'CROSS_MODULE_CONSISTENCY_CHECK', message, {
            processId,
            payload: {
                pair,
                previousModuleId,
                currentModuleId,
                itemCount: items.length,
                hasBlocking,
            },
        }));
        decisionMetadata.push((0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.RULE, {
            moduleId: currentModuleId,
            ruleId,
            rationale,
            payload: {
                pair,
                previousModuleId,
                currentModuleId,
                ruleId,
                severity,
                message,
                validationItemCodes: items.map((i) => i.code),
                hasBlocking,
            },
        }));
    }
    return {
        validationItems,
        events,
        decisionMetadata,
        hasBlocking,
    };
}
