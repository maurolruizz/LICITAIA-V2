"use strict";
/**
 * Eventos administrativos reais do módulo ETP.
 * ETP_STARTED, ETP_VALIDATED, ETP_BLOCKED, ETP_COMPLETED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETP_EVENT_CODES = void 0;
exports.createEtpComplianceEvent = createEtpComplianceEvent;
exports.buildEtpStartedEvent = buildEtpStartedEvent;
exports.buildEtpValidatedEvent = buildEtpValidatedEvent;
exports.buildEtpBlockedEvent = buildEtpBlockedEvent;
exports.buildEtpCompletedEvent = buildEtpCompletedEvent;
const module_id_enum_1 = require("../../core/enums/module-id.enum");
const compliance_event_builder_1 = require("../../shared/event-builders/compliance-event.builder");
exports.ETP_EVENT_CODES = {
    STARTED: 'ETP_STARTED',
    VALIDATED: 'ETP_VALIDATED',
    BLOCKED: 'ETP_BLOCKED',
    COMPLETED: 'ETP_COMPLETED',
};
function createEtpComplianceEvent(code, message, options) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(module_id_enum_1.ModuleId.ETP, code, message, options);
}
function buildEtpStartedEvent(processId) {
    return createEtpComplianceEvent(exports.ETP_EVENT_CODES.STARTED, 'Processamento do ETP iniciado', { processId });
}
function buildEtpValidatedEvent(processId) {
    return createEtpComplianceEvent(exports.ETP_EVENT_CODES.VALIDATED, 'ETP validado com sucesso', { processId });
}
function buildEtpBlockedEvent(reason, options) {
    return createEtpComplianceEvent(exports.ETP_EVENT_CODES.BLOCKED, reason, { processId: options?.processId, payload: options?.payload });
}
function buildEtpCompletedEvent(processId) {
    return createEtpComplianceEvent(exports.ETP_EVENT_CODES.COMPLETED, 'ETP concluído', { processId });
}
