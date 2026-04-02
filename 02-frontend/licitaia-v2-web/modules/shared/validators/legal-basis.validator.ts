/**
 * Validador de base legal para decisões do motor.
 * Exige referência normativa estruturalmente verificável (não apenas termos genéricos).
 */

import type { ValidationItemContract, ValidationResultContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem, createValidationResult } from '../../core/factories/validation-result.factory';
import { hasVerifiableNormativeStructure } from './legal/legal-basis-structure.util';

const LEGAL_BASIS_FIELD = 'legalBasis';

export function validateLegalBasis(payload: Record<string, unknown>): ValidationResultContract {
  const items: ValidationItemContract[] = [];
  const value = payload[LEGAL_BASIS_FIELD];
  if (value === undefined || value === null) {
    items.push(
      createValidationItem(
        'MISSING_LEGAL_REFERENCE',
        'Base legal não informada (referência normativa obrigatória).',
        ValidationSeverity.ERROR,
        { field: LEGAL_BASIS_FIELD }
      )
    );
  } else if (typeof value !== 'string' || value.trim() === '') {
    items.push(
      createValidationItem(
        'INVALID_LEGAL_BASIS_STRUCTURE',
        'Base legal deve conter citação normativa verificável (artigo, lei ou ato numerado).',
        ValidationSeverity.ERROR,
        { field: LEGAL_BASIS_FIELD }
      )
    );
  } else if (!hasVerifiableNormativeStructure(value)) {
    items.push(
      createValidationItem(
        'INVALID_LEGAL_BASIS_STRUCTURE',
        'Base legal genérica ou sem referência normativa concreta (ex.: art., lei, decreto com numeração).',
        ValidationSeverity.ERROR,
        { field: LEGAL_BASIS_FIELD, details: { preview: value.slice(0, 120) } }
      )
    );
  }
  return createValidationResult(items);
}
