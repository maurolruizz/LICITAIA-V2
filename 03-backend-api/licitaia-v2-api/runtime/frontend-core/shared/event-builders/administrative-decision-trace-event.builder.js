"use strict";
/**
 * Builders de eventos do Motor de Rastreabilidade da Decisão Administrativa.
 * Fase 29 — Eventos de geração e incompletude (sem transportar traces completos).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES = void 0;
exports.buildAdministrativeDecisionTraceGeneratedEvent = buildAdministrativeDecisionTraceGeneratedEvent;
exports.buildAdministrativeDecisionTraceIncompleteEvent = buildAdministrativeDecisionTraceIncompleteEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES = {
    GENERATED: 'ADMINISTRATIVE_DECISION_TRACE_GENERATED',
    INCOMPLETE: 'ADMINISTRATIVE_DECISION_TRACE_INCOMPLETE',
};
function buildAdministrativeDecisionTraceGeneratedEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES.GENERATED, 'Rastreabilidade da decisão administrativa gerada.', { processId, payload });
}
function buildAdministrativeDecisionTraceIncompleteEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DECISION_TRACE_EVENT_CODES.INCOMPLETE, 'Rastreabilidade da decisão administrativa incompleta detectada.', { processId, payload });
}
