"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OBJECT_STRUCTURE_EVENT_CODES = void 0;
exports.buildObjectStructureLotDetectedEvent = buildObjectStructureLotDetectedEvent;
const compliance_event_builder_1 = require("./compliance-event.builder");
exports.OBJECT_STRUCTURE_EVENT_CODES = {
    LOT_DETECTED: 'OBJECT_STRUCTURE_LOT_DETECTED',
};
function buildObjectStructureLotDetectedEvent(source, meta, processId) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(source, exports.OBJECT_STRUCTURE_EVENT_CODES.LOT_DETECTED, 'Estrutura do objeto em lote detectada', { processId, payload: meta });
}
