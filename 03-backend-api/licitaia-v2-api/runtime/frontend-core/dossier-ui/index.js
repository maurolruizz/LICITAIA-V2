"use strict";
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
exports.renderComplianceDossierHtml = exports.fetchComplianceDossier = void 0;
__exportStar(require("./dossier.types"), exports);
var dossier_api_1 = require("./dossier.api");
Object.defineProperty(exports, "fetchComplianceDossier", { enumerable: true, get: function () { return dossier_api_1.fetchComplianceDossier; } });
var dossier_renderer_1 = require("./dossier.renderer");
Object.defineProperty(exports, "renderComplianceDossierHtml", { enumerable: true, get: function () { return dossier_renderer_1.renderComplianceDossierHtml; } });
