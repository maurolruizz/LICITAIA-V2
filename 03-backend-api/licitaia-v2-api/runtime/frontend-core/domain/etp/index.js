"use strict";
/**
 * Módulo ETP - ponto de entrada.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapEtpPayloadToContext = exports.normalizeEtpPayload = exports.ETP_EVENT_CODES = exports.buildEtpCompletedEvent = exports.buildEtpBlockedEvent = exports.buildEtpValidatedEvent = exports.buildEtpStartedEvent = exports.createEtpComplianceEvent = exports.validateEtpInput = exports.executeEtpModule = void 0;
var etp_module_1 = require("./etp.module");
Object.defineProperty(exports, "executeEtpModule", { enumerable: true, get: function () { return etp_module_1.executeEtpModule; } });
var etp_validators_1 = require("./etp.validators");
Object.defineProperty(exports, "validateEtpInput", { enumerable: true, get: function () { return etp_validators_1.validateEtpInput; } });
var etp_events_1 = require("./etp.events");
Object.defineProperty(exports, "createEtpComplianceEvent", { enumerable: true, get: function () { return etp_events_1.createEtpComplianceEvent; } });
Object.defineProperty(exports, "buildEtpStartedEvent", { enumerable: true, get: function () { return etp_events_1.buildEtpStartedEvent; } });
Object.defineProperty(exports, "buildEtpValidatedEvent", { enumerable: true, get: function () { return etp_events_1.buildEtpValidatedEvent; } });
Object.defineProperty(exports, "buildEtpBlockedEvent", { enumerable: true, get: function () { return etp_events_1.buildEtpBlockedEvent; } });
Object.defineProperty(exports, "buildEtpCompletedEvent", { enumerable: true, get: function () { return etp_events_1.buildEtpCompletedEvent; } });
Object.defineProperty(exports, "ETP_EVENT_CODES", { enumerable: true, get: function () { return etp_events_1.ETP_EVENT_CODES; } });
var etp_mappers_1 = require("./etp.mappers");
Object.defineProperty(exports, "normalizeEtpPayload", { enumerable: true, get: function () { return etp_mappers_1.normalizeEtpPayload; } });
Object.defineProperty(exports, "mapEtpPayloadToContext", { enumerable: true, get: function () { return etp_mappers_1.mapEtpPayloadToContext; } });
