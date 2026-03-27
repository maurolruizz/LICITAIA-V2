"use strict";
/**
 * Builders de eventos de justificativa administrativa.
 * Fase 24 — Consolidação da justificativa administrativa no núcleo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES = void 0;
exports.buildAdministrativeJustificationDetectedEvent = buildAdministrativeJustificationDetectedEvent;
exports.buildAdministrativeJustificationInvalidEvent = buildAdministrativeJustificationInvalidEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES = {
    DETECTED: 'ADMINISTRATIVE_JUSTIFICATION_DETECTED',
    INVALID: 'ADMINISTRATIVE_JUSTIFICATION_INVALID',
};
function buildAdministrativeJustificationDetectedEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES.DETECTED, 'Justificativa administrativa detectada no payload', { processId, payload: meta });
}
function buildAdministrativeJustificationInvalidEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_JUSTIFICATION_EVENT_CODES.INVALID, 'Justificativa administrativa inválida (bloqueio estrutural)', { processId, payload: meta });
}
