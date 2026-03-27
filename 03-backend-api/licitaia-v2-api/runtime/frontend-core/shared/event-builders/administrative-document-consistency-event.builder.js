"use strict";
/**
 * Builders de eventos do Motor de Consistência Documental Administrativa.
 * Fase 28 — Eventos VALID e ISSUES_DETECTED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES = void 0;
exports.buildAdministrativeDocumentConsistencyValidEvent = buildAdministrativeDocumentConsistencyValidEvent;
exports.buildAdministrativeDocumentConsistencyIssuesDetectedEvent = buildAdministrativeDocumentConsistencyIssuesDetectedEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES = {
    VALID: 'ADMIN_DOCUMENT_CONSISTENCY_VALID',
    ISSUES_DETECTED: 'ADMIN_DOCUMENT_CONSISTENCY_ISSUES_DETECTED',
};
function buildAdministrativeDocumentConsistencyValidEvent(source, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES.VALID, 'Consistência documental administrativa verificada: Need, Structure, Calculation, Justification e Strategy coerentes.', { processId, payload: { totalIssues: 0, issueTypes: [] } });
}
function buildAdministrativeDocumentConsistencyIssuesDetectedEvent(source, result, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMIN_DOCUMENT_CONSISTENCY_EVENT_CODES.ISSUES_DETECTED, 'Inconsistências documentais detectadas entre Need, Structure, Calculation, Justification e Strategy.', {
        processId,
        payload: {
            totalIssues: result.totalIssues,
            issueTypes: result.issueTypes,
            blockingIssues: result.blockingIssues,
            warningIssues: result.warningIssues,
        },
    });
}
