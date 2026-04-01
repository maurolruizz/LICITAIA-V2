import type {
  ComplianceAutomaticReaction,
  ComplianceBlockingItem,
  ComplianceDocumentSupport,
  ComplianceScoreBreakdown,
  ComplianceTimelineItem,
  ComplianceValidationItem,
  ComplianceVerdict,
} from '../compliance-ui/compliance.types';

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
  evidenceReferences: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    sourceRefs: string[];
    createdAt: string;
  }>;
};
