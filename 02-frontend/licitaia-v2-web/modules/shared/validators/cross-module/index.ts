/**
 * Validação cruzada entre módulos do processo administrativo.
 */

export {
  validateCrossModuleConsistency,
  type CrossModuleValidationResult,
} from './cross-module-consistency-validator';

export {
  type CrossModulePair,
  MODULE_DESCRIPTION_KEYS,
  extractDescriptionFromPayload,
  normalizeTokenForComparison,
  tokenizeForComparison,
  hasMinimumTermOverlap,
  getCrossValidationRuleId,
  applyConsistencyRule,
} from './cross-module-consistency-rules';
