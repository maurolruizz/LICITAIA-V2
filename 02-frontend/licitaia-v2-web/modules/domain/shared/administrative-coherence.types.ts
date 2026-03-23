/**
 * Tipos do Motor de Coerência Administrativa.
 * Fase 25 — Integração entre justificativa, objeto e memória de cálculo.
 */

export const ADMINISTRATIVE_COHERENCE_ISSUE_TYPES = {
  JUSTIFICATION_TARGET_NOT_FOUND: 'JUSTIFICATION_TARGET_NOT_FOUND',
  OBJECT_WITHOUT_JUSTIFICATION: 'OBJECT_WITHOUT_JUSTIFICATION',
  CALCULATION_WITHOUT_JUSTIFICATION: 'CALCULATION_WITHOUT_JUSTIFICATION',
  JUSTIFICATION_CALCULATION_MISMATCH: 'JUSTIFICATION_CALCULATION_MISMATCH',
} as const;

export type AdministrativeCoherenceIssueType =
  (typeof ADMINISTRATIVE_COHERENCE_ISSUE_TYPES)[keyof typeof ADMINISTRATIVE_COHERENCE_ISSUE_TYPES];

export type AdministrativeCoherenceTargetType = 'item' | 'lot' | 'process';

export type AdministrativeCoherenceSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCK';

export interface AdministrativeCoherenceIssue {
  type: AdministrativeCoherenceIssueType;
  targetType: AdministrativeCoherenceTargetType;
  targetId: string;
  message: string;
  severity: AdministrativeCoherenceSeverity;
}

export interface AdministrativeCoherenceResult {
  hasCoherenceIssues: boolean;
  totalIssues: number;
  justificationWithoutTargetCount: number;
  objectWithoutJustificationCount: number;
  calculationWithoutJustificationCount: number;
  justificationCalculationMismatchCount: number;
  issues: AdministrativeCoherenceIssue[];
}
