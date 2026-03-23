/**
 * Factory para resultados de validação padronizados.
 */

import type { ValidationItemContract, ValidationResultContract } from '../contracts/validation.contract';
import { ValidationSeverity } from '../enums/validation-severity.enum';

export function createValidationItem(
  code: string,
  message: string,
  severity: ValidationSeverity,
  options?: { field?: string; details?: Record<string, unknown> }
): ValidationItemContract {
  return {
    code,
    message,
    severity,
    field: options?.field,
    details: options?.details,
  };
}

export function createValidationResult(
  items: ValidationItemContract[]
): ValidationResultContract {
  const hasBlocking = items.some((i) => i.severity === ValidationSeverity.BLOCK);
  const hasError = items.some((i) => i.severity === ValidationSeverity.ERROR);
  const valid = items.length === 0 || (!hasBlocking && !hasError);
  return {
    valid,
    items,
    hasBlocking,
  };
}

export function createEmptyValidationResult(): ValidationResultContract {
  return createValidationResult([]);
}
