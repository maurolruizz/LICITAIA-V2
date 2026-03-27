"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALCULATION_MEMORY_EVENT_CODES = void 0;
exports.buildCalculationMemoryDetectedEvent = buildCalculationMemoryDetectedEvent;
exports.buildCalculationMemoryInvalidEvent = buildCalculationMemoryInvalidEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.CALCULATION_MEMORY_EVENT_CODES = {
    DETECTED: 'CALCULATION_MEMORY_DETECTED',
    INVALID: 'CALCULATION_MEMORY_INVALID',
};
function buildCalculationMemoryDetectedEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.CALCULATION_MEMORY_EVENT_CODES.DETECTED, 'Memória de cálculo detectada no payload', { processId, payload: meta });
}
function buildCalculationMemoryInvalidEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.CALCULATION_MEMORY_EVENT_CODES.INVALID, 'Memória de cálculo inválida (bloqueio estrutural)', { processId, payload: meta });
}
