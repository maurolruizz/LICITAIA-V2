import type {
  ComplianceAutomaticReaction,
  ComplianceBlockingItem,
  ComplianceDocumentSupport,
  ComplianceEvidence,
  ComplianceScoreBreakdown,
  ComplianceTimelineItem,
  ComplianceValidationItem,
  ComplianceVerdict,
} from './compliance-report.types';

/**
 * Item de referência de evidência para leitura externa de dossiê.
 */
export type ComplianceDossierEvidenceRef = {
  id: string;
  type: ComplianceEvidence['type'];
  title: string;
  summary: string;
  sourceRefs: string[];
  createdAt: string;
};

/**
 * Dossiê institucional exportável derivado do relatório de conformidade.
 */
export type ComplianceDossier = {
  processId: string;
  tenantId: string;
  generatedAt: string;
  verdict: ComplianceVerdict;
  summary: string;
  score: {
    overallScore: number;
    breakdown: ComplianceScoreBreakdown;
  };
  keyValidations: ComplianceValidationItem[];
  keyBlockings: ComplianceBlockingItem[];
  keyAutomaticReactions: ComplianceAutomaticReaction[];
  timelineHighlights: ComplianceTimelineItem[];
  documents: ComplianceDocumentSupport[];
  hasDocumentSupport: boolean;
  documentSupportNote?: string;
  evidenceReferences: ComplianceDossierEvidenceRef[];
};
