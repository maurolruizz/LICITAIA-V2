"use strict";
/**
 * Builders de eventos do Motor de Explicabilidade Consolidada da Decisão Administrativa.
 * Fase 30 — Eventos de geração e incompletude (sem transportar explicações completas).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES = void 0;
exports.buildAdministrativeDecisionExplanationGeneratedEvent = buildAdministrativeDecisionExplanationGeneratedEvent;
exports.buildAdministrativeDecisionExplanationIncompleteEvent = buildAdministrativeDecisionExplanationIncompleteEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES = {
    GENERATED: 'ADMINISTRATIVE_DECISION_EXPLANATION_GENERATED',
    INCOMPLETE: 'ADMINISTRATIVE_DECISION_EXPLANATION_INCOMPLETE',
};
function buildAdministrativeDecisionExplanationGeneratedEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES.GENERATED, 'Explicabilidade consolidada da decisão administrativa gerada.', { processId, payload });
}
function buildAdministrativeDecisionExplanationIncompleteEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES.INCOMPLETE, 'Explicabilidade consolidada da decisão administrativa incompleta detectada.', { processId, payload });
}
