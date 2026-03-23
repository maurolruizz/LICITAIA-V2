/**
 * ETAPA A — Classificadores normativos obrigatórios no payload (Frentes 1–2).
 * Validação na camada API: erros 400 com códigos oficiais fechados.
 */

import { COVERAGE_DIMENSIONS } from '../phase35/coverage-matrix';
import { ETAPA_A_CLASSIFICATION_ERROR_CODES } from '../dto/process-run-request.types';

export { ETAPA_A_CLASSIFICATION_ERROR_CODES };

const CLASSIFIER_KEYS = [
  'legalRegime',
  'objectType',
  'objectStructure',
  'executionForm',
] as const;

type ClassifierKey = (typeof CLASSIFIER_KEYS)[number];

const ENUM_SET: Record<ClassifierKey, ReadonlySet<string>> = {
  legalRegime: new Set(COVERAGE_DIMENSIONS.legalRegime as readonly string[]),
  objectType: new Set(COVERAGE_DIMENSIONS.objectType as readonly string[]),
  objectStructure: new Set(COVERAGE_DIMENSIONS.objectStructure as readonly string[]),
  executionForm: new Set(COVERAGE_DIMENSIONS.executionForm as readonly string[]),
};

export type ClassificationValidationFailure = {
  ok: false;
  code:
    (typeof ETAPA_A_CLASSIFICATION_ERROR_CODES)[keyof typeof ETAPA_A_CLASSIFICATION_ERROR_CODES];
  field: string;
  reason: string;
};

export type ClassificationValidationOk = { ok: true };

export type ClassificationValidationResult =
  | ClassificationValidationOk
  | ClassificationValidationFailure;

/**
 * Garante que o payload contém os quatro classificadores com valores do enum oficial.
 */
export function validatePayloadClassification(
  payload: Record<string, unknown>
): ClassificationValidationResult {
  for (const key of CLASSIFIER_KEYS) {
    if (!(key in payload) || payload[key] === undefined || payload[key] === null) {
      return {
        ok: false,
        code: ETAPA_A_CLASSIFICATION_ERROR_CODES.INPUT_CLASSIFICATION_REQUIRED,
        field: key,
        reason: `${key} is required in payload.`,
      };
    }
    const raw = payload[key];
    if (typeof raw !== 'string') {
      return {
        ok: false,
        code: ETAPA_A_CLASSIFICATION_ERROR_CODES.INPUT_CLASSIFICATION_ENUM_INVALID,
        field: key,
        reason: `${key} must be a string matching the official enum.`,
      };
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return {
        ok: false,
        code: ETAPA_A_CLASSIFICATION_ERROR_CODES.INPUT_CLASSIFICATION_EMPTY,
        field: key,
        reason: `${key} must be a non-empty string.`,
      };
    }
    if (!ENUM_SET[key].has(trimmed)) {
      return {
        ok: false,
        code: ETAPA_A_CLASSIFICATION_ERROR_CODES.INPUT_CLASSIFICATION_ENUM_INVALID,
        field: key,
        reason: `${key} value is not in the official enumeration.`,
      };
    }
    if (trimmed !== raw) {
      return {
        ok: false,
        code: ETAPA_A_CLASSIFICATION_ERROR_CODES.INPUT_CLASSIFICATION_ENUM_INVALID,
        field: key,
        reason: `${key} must not have leading or trailing whitespace.`,
      };
    }
  }
  return { ok: true };
}
