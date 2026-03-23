/**
 * Validador de base legal para decisões do motor.
 */

import type { ValidationItemContract, ValidationResultContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem, createValidationResult } from '../../core/factories/validation-result.factory';

const LEGAL_BASIS_FIELD = 'legalBasis';

export function validateLegalBasis(payload: Record<string, unknown>): ValidationResultContract {
  const items: ValidationItemContract[] = [];
  const value = payload[LEGAL_BASIS_FIELD];
  if (value === undefined || value === null) {
    items.push(
      createValidationItem(
        'LEGAL_BASIS_MISSING',
        'Base legal não informada',
        ValidationSeverity.ERROR,
        { field: LEGAL_BASIS_FIELD }
      )
    );
  } else if (typeof value !== 'string' || value.trim() === '') {
    items.push(
      createValidationItem(
        'LEGAL_BASIS_INVALID',
        'Base legal deve ser um texto não vazio',
        ValidationSeverity.ERROR,
        { field: LEGAL_BASIS_FIELD }
      )
    );
  }
  return createValidationResult(items);
}
