/**
 * Validações do Motor de Coerência Administrativa.
 * Fase 25 — Aplica resultados do engine como itens de validação.
 */

import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type { AdministrativeCoherenceResult, AdministrativeCoherenceIssue } from './administrative-coherence.types';

const COHERENCE_CODE_PREFIX = 'ADMINISTRATIVE_COHERENCE_';

function mapSeverity(
  severity: AdministrativeCoherenceIssue['severity']
): ValidationSeverity {
  switch (severity) {
    case 'BLOCK':
      return ValidationSeverity.BLOCK;
    case 'ERROR':
      return ValidationSeverity.ERROR;
    case 'WARNING':
      return ValidationSeverity.WARNING;
    case 'INFO':
      return ValidationSeverity.INFO;
    default:
      return ValidationSeverity.WARNING;
  }
}

/**
 * Aplica os resultados do Motor de Coerência Administrativa como itens de validação.
 * Não altera documentos; apenas adiciona itens à lista existente.
 */
export function applyAdministrativeCoherenceValidations(
  coherenceResult: AdministrativeCoherenceResult,
  items: ValidationItemContract[]
): void {
  if (!coherenceResult.hasCoherenceIssues || coherenceResult.issues.length === 0) return;

  for (const issue of coherenceResult.issues) {
    const code = `${COHERENCE_CODE_PREFIX}${issue.type}`;
    items.push(
      createValidationItem(
        code,
        issue.message,
        mapSeverity(issue.severity),
        { details: { targetType: issue.targetType, targetId: issue.targetId, coherenceIssueType: issue.type } }
      )
    );
  }
}
