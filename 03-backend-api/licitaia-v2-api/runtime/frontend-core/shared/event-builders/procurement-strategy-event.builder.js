"use strict";
/**
 * Builders de eventos do Motor de Estratégia de Contratação.
 * Fase 27 — Decisão sobre como a contratação será conduzida.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCUREMENT_STRATEGY_EVENT_CODES = void 0;
exports.buildProcurementStrategyDetectedEvent = buildProcurementStrategyDetectedEvent;
exports.buildProcurementStrategyInvalidEvent = buildProcurementStrategyInvalidEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.PROCUREMENT_STRATEGY_EVENT_CODES = {
    DETECTED: 'PROCUREMENT_STRATEGY_DETECTED',
    INVALID: 'PROCUREMENT_STRATEGY_INVALID',
};
function buildProcurementStrategyDetectedEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.PROCUREMENT_STRATEGY_EVENT_CODES.DETECTED, 'Estratégia de contratação detectada no payload', { processId, payload: meta });
}
function buildProcurementStrategyInvalidEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.PROCUREMENT_STRATEGY_EVENT_CODES.INVALID, 'Estratégia de contratação inválida (bloqueio estrutural)', { processId, payload: meta });
}
