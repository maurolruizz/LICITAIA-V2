"use strict";
/**
 * Factory para metadados de decisão padronizados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDecisionMetadata = createDecisionMetadata;
function createDecisionMetadata(origin, options) {
    return {
        origin,
        moduleId: options?.moduleId,
        ruleId: options?.ruleId,
        rationale: options?.rationale,
        timestamp: new Date().toISOString(),
        payload: options?.payload,
    };
}
