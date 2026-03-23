/**
 * Validações do Motor de Consistência Documental Administrativa.
 * Fase 28 — Aplica resultado do engine como itens de validação (BLOCK/WARNING).
 */

import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type {
  AdministrativeDocumentConsistencyResult,
  AdministrativeDocumentConsistencyIssue,
  DocumentConsistencySeverity,
} from './administrative-document-consistency.types';

const CONSISTENCY_CODE_PREFIX = 'ADMIN_DOCUMENT_CONSISTENCY_';

function mapSeverity(severity: DocumentConsistencySeverity): ValidationSeverity {
  return severity === 'BLOCK' ? ValidationSeverity.BLOCK : ValidationSeverity.WARNING;
}

/**
 * Aplica as inconsistências documentais como itens de validação.
 * Inconsistências críticas (BLOCK) bloqueiam; menores (WARNING) apenas registram.
 */
export function applyAdministrativeDocumentConsistencyValidations(
  result: AdministrativeDocumentConsistencyResult,
  items: ValidationItemContract[]
): void {
  if (!result.hasIssues || result.issues.length === 0) return;

  for (const issue of result.issues as AdministrativeDocumentConsistencyIssue[]) {
    const code = `${CONSISTENCY_CODE_PREFIX}${issue.issueType}`;
    items.push(
      createValidationItem(
        code,
        issue.message,
        mapSeverity(issue.severity),
        {
          field: 'documentConsistency',
          details: {
            issueType: issue.issueType,
            relatedNeed: issue.relatedNeed,
            relatedStructure: issue.relatedStructure,
            relatedCalculation: issue.relatedCalculation,
            relatedJustification: issue.relatedJustification,
            relatedStrategy: issue.relatedStrategy,
          },
        }
      )
    );
  }
}
