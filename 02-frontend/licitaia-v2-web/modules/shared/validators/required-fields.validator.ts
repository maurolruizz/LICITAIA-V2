/**
 * Validador de campos obrigatórios para payloads do motor.
 */

import type { ValidationItemContract, ValidationResultContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem, createValidationResult } from '../../core/factories/validation-result.factory';

export function validateRequiredFields(
  payload: Record<string, unknown>,
  requiredFields: string[]
): ValidationResultContract {
  const items: ValidationItemContract[] = [];
  for (const field of requiredFields) {
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      items.push(
        createValidationItem(
          'REQUIRED_FIELD_MISSING',
          `Campo obrigatório ausente: ${field}`,
          ValidationSeverity.ERROR,
          { field }
        )
      );
    }
  }
  return createValidationResult(items);
}
