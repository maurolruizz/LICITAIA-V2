"use strict";
/**
 * Builders de eventos do Motor de Necessidade Administrativa.
 * Fase 26 — Problema público, necessidade administrativa, resultado esperado.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_NEED_EVENT_CODES = void 0;
exports.buildAdministrativeNeedDetectedEvent = buildAdministrativeNeedDetectedEvent;
exports.buildAdministrativeNeedInvalidEvent = buildAdministrativeNeedInvalidEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_NEED_EVENT_CODES = {
    DETECTED: 'ADMINISTRATIVE_NEED_DETECTED',
    INVALID: 'ADMINISTRATIVE_NEED_INVALID',
};
function buildAdministrativeNeedDetectedEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_NEED_EVENT_CODES.DETECTED, 'Necessidade administrativa detectada no payload', { processId, payload: meta });
}
function buildAdministrativeNeedInvalidEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_NEED_EVENT_CODES.INVALID, 'Necessidade administrativa inválida (bloqueio estrutural)', { processId, payload: meta });
}
