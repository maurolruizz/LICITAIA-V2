"use strict";
/**
 * Builder de eventos de conformidade.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComplianceEvent = buildComplianceEvent;
const event_type_enum_1 = require("../../core/enums/event-type.enum");
const administrative_event_factory_1 = require("../../core/factories/administrative-event.factory");
function buildComplianceEvent(source, code, message, options) {
    return (0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.COMPLIANCE, source, code, message, options);
}
