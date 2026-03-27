"use strict";
/**
 * Módulo TR - ponto de entrada.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTrPayloadToContext = exports.normalizeTrPayload = exports.TR_EVENT_CODES = exports.buildTrCompletedEvent = exports.buildTrBlockedEvent = exports.buildTrValidatedEvent = exports.buildTrStartedEvent = exports.createTrComplianceEvent = exports.validateTrInput = exports.executeTrModule = void 0;
var tr_module_1 = require("./tr.module");
Object.defineProperty(exports, "executeTrModule", { enumerable: true, get: function () { return tr_module_1.executeTrModule; } });
var tr_validators_1 = require("./tr.validators");
Object.defineProperty(exports, "validateTrInput", { enumerable: true, get: function () { return tr_validators_1.validateTrInput; } });
var tr_events_1 = require("./tr.events");
Object.defineProperty(exports, "createTrComplianceEvent", { enumerable: true, get: function () { return tr_events_1.createTrComplianceEvent; } });
Object.defineProperty(exports, "buildTrStartedEvent", { enumerable: true, get: function () { return tr_events_1.buildTrStartedEvent; } });
Object.defineProperty(exports, "buildTrValidatedEvent", { enumerable: true, get: function () { return tr_events_1.buildTrValidatedEvent; } });
Object.defineProperty(exports, "buildTrBlockedEvent", { enumerable: true, get: function () { return tr_events_1.buildTrBlockedEvent; } });
Object.defineProperty(exports, "buildTrCompletedEvent", { enumerable: true, get: function () { return tr_events_1.buildTrCompletedEvent; } });
Object.defineProperty(exports, "TR_EVENT_CODES", { enumerable: true, get: function () { return tr_events_1.TR_EVENT_CODES; } });
var tr_mappers_1 = require("./tr.mappers");
Object.defineProperty(exports, "normalizeTrPayload", { enumerable: true, get: function () { return tr_mappers_1.normalizeTrPayload; } });
Object.defineProperty(exports, "mapTrPayloadToContext", { enumerable: true, get: function () { return tr_mappers_1.mapTrPayloadToContext; } });
