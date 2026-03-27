"use strict";
/**
 * Builders de eventos do Motor de Consolidação de Documentos Administrativos.
 * Fase 31 — Eventos DOCUMENT_GENERATED e DOCUMENT_INCOMPLETE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_DOCUMENT_EVENT_CODES = void 0;
exports.buildAdministrativeDocumentGeneratedEvent = buildAdministrativeDocumentGeneratedEvent;
exports.buildAdministrativeDocumentIncompleteEvent = buildAdministrativeDocumentIncompleteEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_DOCUMENT_EVENT_CODES = {
    GENERATED: 'ADMINISTRATIVE_DOCUMENT_GENERATED',
    INCOMPLETE: 'ADMINISTRATIVE_DOCUMENT_INCOMPLETE',
};
function buildAdministrativeDocumentGeneratedEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DOCUMENT_EVENT_CODES.GENERATED, 'Documentos administrativos consolidados gerados.', { processId, payload });
}
function buildAdministrativeDocumentIncompleteEvent(source, payload, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_DOCUMENT_EVENT_CODES.INCOMPLETE, 'Documentos administrativos com incompletude detectada.', { processId, payload });
}
