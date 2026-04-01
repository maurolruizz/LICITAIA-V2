export type ComplianceSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ComplianceEvidenceStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'INFO';

export type ComplianceEvidence = {
  id: string;
  type: string;
  category: string;
  severity: ComplianceSeverity;
  status: ComplianceEvidenceStatus;
  title: string;
  summary: string;
  processId: string;
  flowSessionId?: string;
  revisionRef?: number;
  step?: string;
  module?: string;
  sourceRefs: string[];
  createdAt: string;
};

export type ComplianceTimelineItem = {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  userId?: string;
  module?: string;
  step?: string;
  revisionBefore?: number;
  revisionAfter?: number;
  evidenceRefs: string[];
};

export type ComplianceValidationItem = {
  id: string;
  name: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  severity: ComplianceSeverity;
  evidenceRefs: string[];
};

export type ComplianceBlockingItem = {
  id: string;
  name: string;
  description: string;
  blockType: string;
  preventedAction: string;
  evidenceRefs: string[];
};

export type ComplianceScoreFactor = {
  name: string;
  impact: number;
  description: string;
};

export type ComplianceScoreBreakdown = {
  overallScore: number;
  flowIntegrity: number;
  structuralConsistency: number;
  interModuleCoherence: number;
  traceability: number;
  criticalIssues: number;
  warnings: number;
  explanation: string;
  factors: ComplianceScoreFactor[];
};

export type ComplianceDocumentSupport = {
  documentType: string;
  documentId: string;
  generatedAt: string;
  basedOnRevision: number;
  supportingEvidenceRefs: string[];
};

export type ComplianceAutomaticReaction = {
  id: string;
  reactionType: 'DOWNSTREAM_INVALIDATION' | 'AUTOMATED_BLOCK_RESPONSE';
  title: string;
  summary: string;
  evidenceRefs: string[];
  createdAt: string;
};

export type ComplianceVerdict = 'APPROVED' | 'APPROVED_WITH_WARNINGS' | 'NOT_APPROVED' | 'UNDER_REVIEW';

export type ComplianceReport = {
  processId: string;
  tenantId: string;
  generatedAt: string;
  verdict: ComplianceVerdict;
  summary: string;
  score: ComplianceScoreBreakdown;
  validations: ComplianceValidationItem[];
  blockings: ComplianceBlockingItem[];
  timeline: ComplianceTimelineItem[];
  evidences: ComplianceEvidence[];
  documents: ComplianceDocumentSupport[];
  automaticReactions: ComplianceAutomaticReaction[];
};
