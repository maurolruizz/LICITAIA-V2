/**
 * Builders de eventos do Motor de Coerência Administrativa.
 * Fase 25 — Integração entre justificativa, objeto e memória de cálculo.
 */

import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildComplianceEvent } from './compliance-event.builder';
import type { AdministrativeCoherenceResult } from '../../domain/shared/administrative-coherence.types';

export const ADMINISTRATIVE_COHERENCE_EVENT_CODES = {
  ISSUES_DETECTED: 'ADMINISTRATIVE_COHERENCE_ISSUES_DETECTED',
  VALID: 'ADMINISTRATIVE_COHERENCE_VALID',
} as const;

function getIssueTypes(issues: AdministrativeCoherenceResult['issues']): string[] {
  const set = new Set(issues.map((i) => i.type));
  return Array.from(set);
}

export function buildAdministrativeCoherenceIssuesDetectedEvent(
  source: ModuleId | string | number,
  coherenceResult: AdministrativeCoherenceResult,
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_COHERENCE_EVENT_CODES.ISSUES_DETECTED,
    'Incoerências administrativas detectadas entre justificativa, objeto e memória de cálculo',
    {
      processId,
      payload: {
        totalIssues: coherenceResult.totalIssues,
        issueTypes: getIssueTypes(coherenceResult.issues),
        justificationWithoutTargetCount: coherenceResult.justificationWithoutTargetCount,
        objectWithoutJustificationCount: coherenceResult.objectWithoutJustificationCount,
        calculationWithoutJustificationCount: coherenceResult.calculationWithoutJustificationCount,
        justificationCalculationMismatchCount: coherenceResult.justificationCalculationMismatchCount,
      },
    }
  );
}

export function buildAdministrativeCoherenceValidEvent(
  source: ModuleId | string | number,
  processId?: string
): AdministrativeEventContract {
  return buildComplianceEvent(
    source,
    ADMINISTRATIVE_COHERENCE_EVENT_CODES.VALID,
    'Coerência administrativa verificada: justificativa, objeto e memória de cálculo consistentes',
    { processId, payload: { totalIssues: 0, issueTypes: [] } }
  );
}
