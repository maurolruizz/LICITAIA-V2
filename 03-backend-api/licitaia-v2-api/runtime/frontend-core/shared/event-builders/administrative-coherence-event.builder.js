"use strict";
/**
 * Builders de eventos do Motor de Coerência Administrativa.
 * Fase 25 — Integração entre justificativa, objeto e memória de cálculo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMINISTRATIVE_COHERENCE_EVENT_CODES = void 0;
exports.buildAdministrativeCoherenceIssuesDetectedEvent = buildAdministrativeCoherenceIssuesDetectedEvent;
exports.buildAdministrativeCoherenceValidEvent = buildAdministrativeCoherenceValidEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.ADMINISTRATIVE_COHERENCE_EVENT_CODES = {
    ISSUES_DETECTED: 'ADMINISTRATIVE_COHERENCE_ISSUES_DETECTED',
    VALID: 'ADMINISTRATIVE_COHERENCE_VALID',
};
function getIssueTypes(issues) {
    const set = new Set(issues.map((i) => i.type));
    return Array.from(set);
}
function buildAdministrativeCoherenceIssuesDetectedEvent(source, coherenceResult, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_COHERENCE_EVENT_CODES.ISSUES_DETECTED, 'Incoerências administrativas detectadas entre justificativa, objeto e memória de cálculo', {
        processId,
        payload: {
            totalIssues: coherenceResult.totalIssues,
            issueTypes: getIssueTypes(coherenceResult.issues),
            justificationWithoutTargetCount: coherenceResult.justificationWithoutTargetCount,
            objectWithoutJustificationCount: coherenceResult.objectWithoutJustificationCount,
            calculationWithoutJustificationCount: coherenceResult.calculationWithoutJustificationCount,
            justificationCalculationMismatchCount: coherenceResult.justificationCalculationMismatchCount,
        },
    });
}
function buildAdministrativeCoherenceValidEvent(source, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.ADMINISTRATIVE_COHERENCE_EVENT_CODES.VALID, 'Coerência administrativa verificada: justificativa, objeto e memória de cálculo consistentes', { processId, payload: { totalIssues: 0, issueTypes: [] } });
}
