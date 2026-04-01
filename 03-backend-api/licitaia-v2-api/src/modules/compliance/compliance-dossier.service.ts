import { buildComplianceReport } from './compliance-report.service';
import type { ComplianceDossier, ComplianceDossierEvidenceRef } from './compliance-dossier.types';
import type { ComplianceEvidence, ComplianceTimelineItem } from './compliance-report.types';

export type BuildComplianceDossierParams = {
  tenantId: string;
  processId: string;
};

function summarizeTimeline(timeline: ComplianceTimelineItem[]): ComplianceTimelineItem[] {
  const maxItems = 12;
  if (timeline.length <= maxItems) return timeline;
  const head = timeline.slice(0, 6);
  const tail = timeline.slice(-6);
  return [...head, ...tail];
}

function toEvidenceReference(evidence: ComplianceEvidence): ComplianceDossierEvidenceRef {
  return {
    id: evidence.id,
    type: evidence.type,
    title: evidence.title,
    summary: evidence.summary,
    sourceRefs: evidence.sourceRefs,
    createdAt: evidence.createdAt,
  };
}

/**
 * Constrói dossiê institucional exportável a partir de ComplianceReport canônico.
 * Não recalcula lógica de conformidade; apenas organiza a leitura externa.
 */
export async function buildComplianceDossier(
  params: BuildComplianceDossierParams,
): Promise<ComplianceDossier> {
  const report = await buildComplianceReport(params);
  const documents = report.documents;
  const hasDocumentSupport = documents.length > 0;

  return {
    processId: report.processId,
    tenantId: report.tenantId,
    generatedAt: report.generatedAt,
    verdict: report.verdict,
    summary: report.summary,
    score: {
      overallScore: report.score.overallScore,
      breakdown: report.score,
    },
    keyValidations: report.validations.slice(0, 20),
    keyBlockings: report.blockings.slice(0, 20),
    keyAutomaticReactions: report.automaticReactions.slice(0, 20),
    timelineHighlights: summarizeTimeline(report.timeline),
    documents,
    hasDocumentSupport,
    documentSupportNote: hasDocumentSupport
      ? undefined
      : 'Vínculos documentais ainda não integrados nesta etapa do dossiê.',
    evidenceReferences: report.evidences.map(toEvidenceReference),
  };
}
