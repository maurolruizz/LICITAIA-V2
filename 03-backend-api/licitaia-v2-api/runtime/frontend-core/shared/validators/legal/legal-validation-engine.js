"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLegalStructure = validateLegalStructure;
const module_id_enum_1 = require("../../../core/enums/module-id.enum");
const event_type_enum_1 = require("../../../core/enums/event-type.enum");
const decision_origin_enum_1 = require("../../../core/enums/decision-origin.enum");
const validation_severity_enum_1 = require("../../../core/enums/validation-severity.enum");
const administrative_event_factory_1 = require("../../../core/factories/administrative-event.factory");
const decision_metadata_factory_1 = require("../../../core/factories/decision-metadata.factory");
const legal_validation_rules_1 = require("./legal-validation-rules");
function extractLegalEvaluationData(moduleId, output, processSnapshot) {
    const resultData = output?.result?.data;
    const safeResultData = resultData && typeof resultData === 'object' && !Array.isArray(resultData)
        ? resultData
        : {};
    const safeProcessSnapshot = processSnapshot && typeof processSnapshot === 'object' && !Array.isArray(processSnapshot)
        ? processSnapshot
        : {};
    const cfg = (0, legal_validation_rules_1.getModuleLegalConfig)(moduleId);
    if (!cfg) {
        return {
            rawData: safeResultData,
            objectTexts: [],
            justificationTexts: [],
            dataSourceUsed: Object.keys(safeResultData).length
                ? 'output.result.data'
                : Object.keys(safeProcessSnapshot).length
                    ? 'processSnapshot'
                    : 'none',
            fieldSources: {},
        };
    }
    const mergedData = { ...safeResultData };
    const fieldSources = {};
    const pickFieldValue = (field) => {
        const fromResultText = (0, legal_validation_rules_1.getLegalText)(safeResultData[field]);
        if (fromResultText) {
            mergedData[field] = fromResultText;
            fieldSources[field] = 'output.result.data';
            return fromResultText;
        }
        const fromSnapshotText = (0, legal_validation_rules_1.getLegalText)(safeProcessSnapshot[field]);
        if (fromSnapshotText) {
            mergedData[field] = fromSnapshotText;
            fieldSources[field] = 'processSnapshot';
            return fromSnapshotText;
        }
        fieldSources[field] = 'none';
        return '';
    };
    const objectTexts = [];
    for (const fieldCfg of cfg.objectFields) {
        const t = pickFieldValue(fieldCfg.field);
        if (t)
            objectTexts.push(t);
    }
    const justificationTexts = [];
    for (const fieldCfg of cfg.justificationFields) {
        const t = pickFieldValue(fieldCfg.field);
        if (t)
            justificationTexts.push(t);
    }
    const dataSourceUsed = Object.values(fieldSources).includes('output.result.data')
        ? 'output.result.data'
        : Object.values(fieldSources).includes('processSnapshot')
            ? 'processSnapshot'
            : 'none';
    return {
        rawData: mergedData,
        objectTexts,
        justificationTexts,
        dataSourceUsed,
        fieldSources,
    };
}
function buildLegalTracePayload(moduleId, items, evaluationData) {
    if (items.length === 0)
        return undefined;
    const hasBlocking = items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const primaryBlocking = items.find((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const primary = primaryBlocking ?? items[0];
    let result = 'INFO';
    if (hasBlocking) {
        result = 'BLOCK';
    }
    else if (items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.WARNING)) {
        result = 'WARNING';
    }
    const objectCombined = evaluationData.objectTexts.join(' ').trim();
    const justificationCombined = evaluationData.justificationTexts.join(' ').trim();
    const evidence = {
        objectTexts: evaluationData.objectTexts,
        justificationTexts: evaluationData.justificationTexts,
        objectLength: objectCombined.length,
        justificationLength: justificationCombined.length,
        validationItemCodes: items.map((i) => i.code),
        blockingCodes: items.filter((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK).map((i) => i.code),
        fieldSources: evaluationData.fieldSources,
    };
    return {
        ruleId: primary.code,
        moduleId,
        result,
        dataSourceUsed: evaluationData.dataSourceUsed,
        evidence,
    };
}
function validateLegalStructure(moduleId, output, processSnapshot, processId) {
    // Motor jurídico apenas para módulos do pipeline principal.
    if (!Object.values(module_id_enum_1.ModuleId).includes(moduleId)) {
        return {
            validationItems: [],
            events: [],
            decisionMetadata: [],
            hasBlocking: false,
        };
    }
    const evaluationData = extractLegalEvaluationData(moduleId, output, processSnapshot);
    const data = evaluationData.rawData;
    const items = [];
    items.push(...(0, legal_validation_rules_1.evaluateLegalObjectGenericity)(moduleId, data));
    items.push(...(0, legal_validation_rules_1.evaluateLegalJustificationStrength)(moduleId, data));
    items.push(...(0, legal_validation_rules_1.evaluateLegalObjectJustificationCoherence)(moduleId, data));
    items.push(...(0, legal_validation_rules_1.evaluateRegimeLegalBasisCompliance)(moduleId, processSnapshot, data));
    if (items.length === 0) {
        return {
            validationItems: [],
            events: [],
            decisionMetadata: [],
            hasBlocking: false,
        };
    }
    const hasBlocking = items.some((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const blockingItem = items.find((i) => i.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
    const severity = blockingItem?.severity ?? items[0].severity;
    const message = hasBlocking
        ? `Validação jurídica: inconsistência estrutural detectada no módulo ${moduleId}.`
        : `Validação jurídica: ${items.length} apontamento(s) estrutural(is) no módulo ${moduleId}.`;
    const events = [
        (0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.VALIDATION, moduleId, 'LEGAL_VALIDATION_CHECK', message, {
            processId,
            payload: {
                moduleId,
                itemCount: items.length,
                hasBlocking,
                itemCodes: items.map((i) => i.code),
            },
        }),
    ];
    const legalTrace = buildLegalTracePayload(moduleId, items, evaluationData);
    const decisionMetadata = [
        (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.RULE, {
            moduleId,
            ruleId: 'LEGAL_VALIDATION_STRUCTURAL',
            rationale: 'Aplicação de regras jurídicas estruturais mínimas sobre objeto e justificativas, sem uso de IA ou NLP.',
            payload: {
                moduleId,
                severity,
                hasBlocking,
                validationItemCodes: items.map((i) => i.code),
                legalTrace,
            },
        }),
    ];
    return {
        validationItems: items,
        events,
        decisionMetadata,
        hasBlocking,
    };
}
