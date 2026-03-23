/**
 * Validador de consistência de fase do processo.
 */

import type { ValidationItemContract, ValidationResultContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { ProcessPhase } from '../../core/enums/process-phase.enum';
import { createValidationItem, createValidationResult } from '../../core/factories/validation-result.factory';

const VALID_PHASES = Object.values(ProcessPhase);

export function validatePhaseConsistency(phase: string): ValidationResultContract {
  const items: ValidationItemContract[] = [];
  if (!phase || typeof phase !== 'string') {
    items.push(
      createValidationItem(
        'PHASE_MISSING',
        'Fase do processo não informada',
        ValidationSeverity.ERROR
      )
    );
  } else if (!VALID_PHASES.includes(phase as ProcessPhase)) {
    items.push(
      createValidationItem(
        'PHASE_INVALID',
        `Fase inválida: ${phase}. Valores esperados: ${VALID_PHASES.join(', ')}`,
        ValidationSeverity.ERROR
      )
    );
  }
  return createValidationResult(items);
}
