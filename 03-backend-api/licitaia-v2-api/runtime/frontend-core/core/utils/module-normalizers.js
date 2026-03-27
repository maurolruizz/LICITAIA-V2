"use strict";
/**
 * Normalizadores para inputs e payloads do motor modular.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePayload = normalizePayload;
exports.normalizeInputTimestamp = normalizeInputTimestamp;
exports.normalizeModuleInput = normalizeModuleInput;
/**
 * Garante que payload seja um objeto (nunca null/undefined).
 */
function normalizePayload(input) {
    return {
        ...input,
        payload: input.payload && typeof input.payload === 'object' ? input.payload : {},
    };
}
/**
 * Garante timestamp presente no input.
 */
function normalizeInputTimestamp(input) {
    return {
        ...input,
        timestamp: input.timestamp ?? new Date().toISOString(),
    };
}
/**
 * Aplica todas as normalizações de input.
 */
function normalizeModuleInput(input) {
    return normalizeInputTimestamp(normalizePayload(input));
}
