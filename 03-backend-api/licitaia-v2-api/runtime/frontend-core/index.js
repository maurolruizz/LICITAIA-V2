"use strict";
/**
 * Núcleo modular LICITAIA V2 — ponto de entrada público.
 * Infraestrutura do motor de conformidade administrativa.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePricingModule = exports.executeTrModule = exports.executeEtpModule = exports.executeDfdModule = exports.initializeModuleRegistry = exports.runAdministrativeProcess = exports.dispatchModule = exports.getAllRegisteredModuleIds = exports.getModuleDefinition = exports.getModulesForPhase = exports.registerModule = void 0;
__exportStar(require("./core"), exports);
var orchestrator_1 = require("./orchestrator");
Object.defineProperty(exports, "registerModule", { enumerable: true, get: function () { return orchestrator_1.registerModule; } });
Object.defineProperty(exports, "getModulesForPhase", { enumerable: true, get: function () { return orchestrator_1.getModulesForPhase; } });
Object.defineProperty(exports, "getModuleDefinition", { enumerable: true, get: function () { return orchestrator_1.getModuleDefinition; } });
Object.defineProperty(exports, "getAllRegisteredModuleIds", { enumerable: true, get: function () { return orchestrator_1.getAllRegisteredModuleIds; } });
Object.defineProperty(exports, "dispatchModule", { enumerable: true, get: function () { return orchestrator_1.dispatchModule; } });
Object.defineProperty(exports, "runAdministrativeProcess", { enumerable: true, get: function () { return orchestrator_1.runAdministrativeProcess; } });
var registry_1 = require("./registry");
Object.defineProperty(exports, "initializeModuleRegistry", { enumerable: true, get: function () { return registry_1.initializeModuleRegistry; } });
var dfd_1 = require("./domain/dfd");
Object.defineProperty(exports, "executeDfdModule", { enumerable: true, get: function () { return dfd_1.executeDfdModule; } });
var etp_1 = require("./domain/etp");
Object.defineProperty(exports, "executeEtpModule", { enumerable: true, get: function () { return etp_1.executeEtpModule; } });
var tr_1 = require("./domain/tr");
Object.defineProperty(exports, "executeTrModule", { enumerable: true, get: function () { return tr_1.executeTrModule; } });
var pricing_1 = require("./domain/pricing");
Object.defineProperty(exports, "executePricingModule", { enumerable: true, get: function () { return pricing_1.executePricingModule; } });
__exportStar(require("./ai-assistive"), exports);
__exportStar(require("./compliance-ui"), exports);
__exportStar(require("./dossier-ui"), exports);
