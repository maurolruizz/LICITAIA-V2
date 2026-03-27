"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendCommonInvalidationEvents = appendCommonInvalidationEvents;
const event_builders_1 = require("../../shared/event-builders");
function appendCommonInvalidationEvents(params) {
    const { moduleId, validationItems, counts, documentConsistencyResult, processId, events } = params;
    const calculationMemoryCodes = validationItems
        .filter((i) => i.code.startsWith('CALCULATION_MEMORY_'))
        .map((i) => i.code);
    if (calculationMemoryCodes.length > 0) {
        events.push((0, event_builders_1.buildCalculationMemoryInvalidEvent)(moduleId, {
            invalidCodes: calculationMemoryCodes,
            calculationMemoryCount: counts.calculationMemoryCount,
        }, processId));
    }
    const administrativeJustificationCodes = validationItems
        .filter((i) => i.code.startsWith('ADMINISTRATIVE_JUSTIFICATION_'))
        .map((i) => i.code);
    if (administrativeJustificationCodes.length > 0) {
        events.push((0, event_builders_1.buildAdministrativeJustificationInvalidEvent)(moduleId, {
            invalidCodes: administrativeJustificationCodes,
            totalJustifications: counts.totalJustifications,
        }, processId));
    }
    const administrativeNeedCodes = validationItems
        .filter((i) => i.code.startsWith('ADMINISTRATIVE_NEED_'))
        .map((i) => i.code);
    if (administrativeNeedCodes.length > 0) {
        events.push((0, event_builders_1.buildAdministrativeNeedInvalidEvent)(moduleId, {
            invalidCodes: administrativeNeedCodes,
            totalNeeds: counts.totalNeeds,
            issueTypes: [...new Set(administrativeNeedCodes)],
        }, processId));
    }
    const procurementStrategyCodes = validationItems
        .filter((i) => i.code.startsWith('PROCUREMENT_STRATEGY_'))
        .map((i) => i.code);
    if (procurementStrategyCodes.length > 0) {
        events.push((0, event_builders_1.buildProcurementStrategyInvalidEvent)(moduleId, {
            totalStrategies: counts.totalStrategies,
            issueTypes: [...new Set(procurementStrategyCodes)],
        }, processId));
    }
    const documentConsistencyCodes = validationItems
        .filter((i) => i.code.startsWith('ADMIN_DOCUMENT_CONSISTENCY_'))
        .map((i) => i.code);
    if (documentConsistencyCodes.length > 0) {
        events.push((0, event_builders_1.buildAdministrativeDocumentConsistencyIssuesDetectedEvent)(moduleId, documentConsistencyResult, processId));
    }
}
