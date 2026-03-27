"use strict";
/**
 * Factory para eventos administrativos padronizados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdministrativeEvent = createAdministrativeEvent;
function createAdministrativeEvent(type, source, code, message, options) {
    return {
        type,
        source,
        code,
        message,
        timestamp: new Date().toISOString(),
        payload: options?.payload,
        processId: options?.processId,
    };
}
