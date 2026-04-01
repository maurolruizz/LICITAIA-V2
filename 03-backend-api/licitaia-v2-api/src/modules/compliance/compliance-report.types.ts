/**
 * Tipos de severidade usados para qualificar o impacto da evidência ou validação.
 */
export type ComplianceSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Estados possíveis de uma evidência individual no contexto de conformidade.
 */
export type ComplianceEvidenceStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'INFO';

/**
 * Evidência atômica rastreável gerada a partir de fatos reais do processo e auditoria.
 */
export type ComplianceEvidence = {
  id: string;
  type:
    | 'FLOW_ENFORCEMENT'
    | 'TRANSITION_BLOCK'
    | 'DOWNSTREAM_INVALIDATION'
    | 'RULE_VALIDATION'
    | 'CROSS_MODULE_VALIDATION'
    | 'REVIEW_EXECUTION'
    | 'AUDIT_EVENT'
    | 'DOCUMENT_OUTPUT'
    | 'SECURITY_ENFORCEMENT'
    | 'TENANT_ISOLATION_PROOF';
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
  legalBasis?: string[];
  technicalBasis?: string[];
  createdAt: string;
};

/**
 * Evento estruturado de linha do tempo para reconstituir a evolução da conformidade.
 */
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

/**
 * Item de validação consolidada, com status final e vínculo para evidências de suporte.
 */
export type ComplianceValidationItem = {
  id: string;
  name: string;
  description: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  severity: ComplianceSeverity;
  evidenceRefs: string[];
};

/**
 * Item que representa um bloqueio efetivo e a ação que foi impedida no fluxo.
 */
export type ComplianceBlockingItem = {
  id: string;
  name: string;
  description: string;
  blockType: string;
  preventedAction: string;
  evidenceRefs: string[];
};

/**
 * Fator explicável que impacta o score agregado de conformidade.
 */
export type ComplianceScoreFactor = {
  name: string;
  impact: number;
  description: string;
};

/**
 * Quebra de score com dimensões explícitas e explicação auditável.
 */
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

/**
 * Metadados de suporte documental vinculando saída gerada às evidências rastreáveis.
 */
export type ComplianceDocumentSupport = {
  documentType: 'DFD' | 'ETP' | 'TR' | 'PRICING' | string;
  documentId: string;
  generatedAt: string;
  basedOnRevision: number;
  supportingEvidenceRefs: string[];
};

/**
 * Reação automática do motor explicitada para consumo de UI sem inferência local.
 */
export type ComplianceAutomaticReaction = {
  id: string;
  reactionType: 'DOWNSTREAM_INVALIDATION' | 'AUTOMATED_BLOCK_RESPONSE';
  title: string;
  summary: string;
  evidenceRefs: string[];
  createdAt: string;
};

/**
 * Veredito final consolidado da prova de conformidade para um processo.
 */
export type ComplianceVerdict =
  | 'APPROVED'
  | 'APPROVED_WITH_WARNINGS'
  | 'NOT_APPROVED'
  | 'UNDER_REVIEW';

/**
 * Relatório principal de conformidade contendo score, validações, bloqueios,
 * timeline, evidências e suporte documental.
 */
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
