"use strict";
/**
 * Eventos administrativos reais do módulo Pricing.
 * PRICING_STARTED, PRICING_VALIDATED, PRICING_BLOCKED, PRICING_COMPLETED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICING_EVENT_CODES = void 0;
exports.createPricingComplianceEvent = createPricingComplianceEvent;
exports.buildPricingStartedEvent = buildPricingStartedEvent;
exports.buildPricingValidatedEvent = buildPricingValidatedEvent;
exports.buildPricingBlockedEvent = buildPricingBlockedEvent;
exports.buildPricingCompletedEvent = buildPricingCompletedEvent;
const module_id_enum_1 = require("../../core/enums/module-id.enum");
const compliance_event_builder_1 = require("../../shared/event-builders/compliance-event.builder");
exports.PRICING_EVENT_CODES = {
    STARTED: 'PRICING_STARTED',
    VALIDATED: 'PRICING_VALIDATED',
    BLOCKED: 'PRICING_BLOCKED',
    COMPLETED: 'PRICING_COMPLETED',
};
function createPricingComplianceEvent(code, message, options) {
    return (0, compliance_event_builder_1.buildComplianceEvent)(module_id_enum_1.ModuleId.PRICING, code, message, options);
}
function buildPricingStartedEvent(processId) {
    return createPricingComplianceEvent(exports.PRICING_EVENT_CODES.STARTED, 'Processamento do Pricing iniciado', { processId });
}
function buildPricingValidatedEvent(processId) {
    return createPricingComplianceEvent(exports.PRICING_EVENT_CODES.VALIDATED, 'Pricing validado com sucesso', { processId });
}
function buildPricingBlockedEvent(reason, options) {
    return createPricingComplianceEvent(exports.PRICING_EVENT_CODES.BLOCKED, reason, { processId: options?.processId, payload: options?.payload });
}
function buildPricingCompletedEvent(processId) {
    return createPricingComplianceEvent(exports.PRICING_EVENT_CODES.COMPLETED, 'Pricing concluído', { processId });
}
