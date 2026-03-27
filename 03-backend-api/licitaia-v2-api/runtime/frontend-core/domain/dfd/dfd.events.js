"use strict";
/**
 * Eventos administrativos reais do módulo DFD.
 * DFD_STARTED, DFD_VALIDATED, DFD_BLOCKED, DFD_COMPLETED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DFD_EVENT_CODES = void 0;
exports.createDfdComplianceEvent = createDfdComplianceEvent;
exports.buildDfdStartedEvent = buildDfdStartedEvent;
exports.buildDfdValidatedEvent = buildDfdValidatedEvent;
exports.buildDfdBlockedEvent = buildDfdBlockedEvent;
exports.buildDfdCompletedEvent = buildDfdCompletedEvent;
const module_id_enum_1 = require("../../core/enums/module-id.enum");
const compliance_event_builder_1 = require("../../shared/event-builders/compliance-event.builder");
exports.DFD_EVENT_CODES = {
    STARTED: 'DFD_STARTED',
    VALIDATED: 'DFD_VALIDATED',
    BLOCKED: 'DFD_BLOCKED',
    COMPLETED: 'DFD_COMPLETED',
};
function createDfdComplianceEvent(code, message, options) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(module_id_enum_1.ModuleId.DFD, code, message, options);
}
function buildDfdStartedEvent(processId) {
    return createDfdComplianceEvent(exports.DFD_EVENT_CODES.STARTED, 'Processamento do DFD iniciado', { processId });
}
function buildDfdValidatedEvent(processId) {
    return createDfdComplianceEvent(exports.DFD_EVENT_CODES.VALIDATED, 'DFD validado com sucesso', { processId });
}
function buildDfdBlockedEvent(reason, options) {
    return createDfdComplianceEvent(exports.DFD_EVENT_CODES.BLOCKED, reason, { processId: options?.processId, payload: options?.payload });
}
function buildDfdCompletedEvent(processId) {
    return createDfdComplianceEvent(exports.DFD_EVENT_CODES.COMPLETED, 'DFD concluído', { processId });
}
