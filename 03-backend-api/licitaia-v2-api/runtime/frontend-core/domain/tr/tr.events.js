"use strict";
/**
 * Eventos administrativos reais do módulo TR.
 * TR_STARTED, TR_VALIDATED, TR_BLOCKED, TR_COMPLETED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TR_EVENT_CODES = void 0;
exports.createTrComplianceEvent = createTrComplianceEvent;
exports.buildTrStartedEvent = buildTrStartedEvent;
exports.buildTrValidatedEvent = buildTrValidatedEvent;
exports.buildTrBlockedEvent = buildTrBlockedEvent;
exports.buildTrCompletedEvent = buildTrCompletedEvent;
const module_id_enum_1 = require("../../core/enums/module-id.enum");
const compliance_event_builder_1 = require("../../shared/event-builders/compliance-event.builder");
exports.TR_EVENT_CODES = {
    STARTED: 'TR_STARTED',
    VALIDATED: 'TR_VALIDATED',
    BLOCKED: 'TR_BLOCKED',
    COMPLETED: 'TR_COMPLETED',
};
function createTrComplianceEvent(code, message, options) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(module_id_enum_1.ModuleId.TR, code, message, options);
}
function buildTrStartedEvent(processId) {
    return createTrComplianceEvent(exports.TR_EVENT_CODES.STARTED, 'Processamento do TR iniciado', { processId });
}
function buildTrValidatedEvent(processId) {
    return createTrComplianceEvent(exports.TR_EVENT_CODES.VALIDATED, 'TR validado com sucesso', { processId });
}
function buildTrBlockedEvent(reason, options) {
    return createTrComplianceEvent(exports.TR_EVENT_CODES.BLOCKED, reason, { processId: options?.processId, payload: options?.payload });
}
function buildTrCompletedEvent(processId) {
    return createTrComplianceEvent(exports.TR_EVENT_CODES.COMPLETED, 'TR concluído', { processId });
}
