"use strict";
/**
 * Validação cruzada entre módulos do processo administrativo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyConsistencyRule = exports.getCrossValidationRuleId = exports.hasMinimumTermOverlap = exports.tokenizeForComparison = exports.normalizeTokenForComparison = exports.extractDescriptionFromPayload = exports.MODULE_DESCRIPTION_KEYS = exports.validateCrossModuleConsistency = void 0;
var cross_module_consistency_validator_1 = require("./cross-module-consistency-validator");
Object.defineProperty(exports, "validateCrossModuleConsistency", { enumerable: true, get: function () { return cross_module_consistency_validator_1.validateCrossModuleConsistency; } });
var cross_module_consistency_rules_1 = require("./cross-module-consistency-rules");
Object.defineProperty(exports, "MODULE_DESCRIPTION_KEYS", { enumerable: true, get: function () { return cross_module_consistency_rules_1.MODULE_DESCRIPTION_KEYS; } });
Object.defineProperty(exports, "extractDescriptionFromPayload", { enumerable: true, get: function () { return cross_module_consistency_rules_1.extractDescriptionFromPayload; } });
Object.defineProperty(exports, "normalizeTokenForComparison", { enumerable: true, get: function () { return cross_module_consistency_rules_1.normalizeTokenForComparison; } });
Object.defineProperty(exports, "tokenizeForComparison", { enumerable: true, get: function () { return cross_module_consistency_rules_1.tokenizeForComparison; } });
Object.defineProperty(exports, "hasMinimumTermOverlap", { enumerable: true, get: function () { return cross_module_consistency_rules_1.hasMinimumTermOverlap; } });
Object.defineProperty(exports, "getCrossValidationRuleId", { enumerable: true, get: function () { return cross_module_consistency_rules_1.getCrossValidationRuleId; } });
Object.defineProperty(exports, "applyConsistencyRule", { enumerable: true, get: function () { return cross_module_consistency_rules_1.applyConsistencyRule; } });
