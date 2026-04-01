import type {
  ComplianceBlockingItem,
  ComplianceEvidence,
  ComplianceReport,
  ComplianceScoreBreakdown,
  ComplianceTimelineItem,
  ComplianceAutomaticReaction,
  ComplianceValidationItem,
  ComplianceVerdict,
} from './compliance-report.types';

type GroupedEvidence = {
  key: string;
  evidences: ComplianceEvidence[];
};

export type ComplianceFlowConclusionContext = {
  currentRevision: number;
  currentStep?: string;
  hasTerminalSignal: boolean;
};

type ScoreFactor = ComplianceScoreBreakdown['factors'][number];

function normalizeTextToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function groupEvidencesByType(evidences: ComplianceEvidence[], types: ComplianceEvidence['type'][]): GroupedEvidence[] {
  const map = new Map<string, ComplianceEvidence[]>();
  for (const evidence of evidences) {
    if (!types.includes(evidence.type)) continue;
    const key = [
      evidence.type,
      evidence.module ?? 'UNKNOWN',
      evidence.step ?? 'NO_STEP',
      evidence.category,
      evidence.status,
      evidence.title,
    ].join('|');
    const current = map.get(key) ?? [];
    current.push(evidence);
    map.set(key, current);
  }
  return [...map.entries()].map(([key, items]) => ({ key, evidences: items }));
}

function toValidationStatus(evidences: ComplianceEvidence[]): ComplianceValidationItem['status'] {
  if (evidences.some((item) => item.status === 'FAILED' || item.status === 'BLOCKED')) return 'FAILED';
  if (evidences.some((item) => item.severity === 'WARNING')) return 'WARNING';
  return 'PASSED';
}

function toValidationName(type: ComplianceEvidence['type']): string {
  if (type === 'FLOW_ENFORCEMENT') return 'Enforcement de fluxo';
  if (type === 'RULE_VALIDATION') return 'Validação de regra';
  if (type === 'REVIEW_EXECUTION') return 'Execução de review';
  if (type === 'CROSS_MODULE_VALIDATION') return 'Validação entre módulos';
  return 'Validação de conformidade';
}

function toBlockingName(type: ComplianceEvidence['type']): string {
  if (type === 'TRANSITION_BLOCK') return 'Bloqueio de transição';
  if (type === 'SECURITY_ENFORCEMENT') return 'Bloqueio de segurança';
  if (type === 'DOWNSTREAM_INVALIDATION') return 'Invalidação downstream';
  return 'Bloqueio de conformidade';
}

function toBlockingType(type: ComplianceEvidence['type']): string {
  if (type === 'TRANSITION_BLOCK') return 'FLOW_TRANSITION_BLOCK';
  if (type === 'SECURITY_ENFORCEMENT') return 'SECURITY_GUARD_BLOCK';
  if (type === 'DOWNSTREAM_INVALIDATION') return 'DOWNSTREAM_INVALIDATION';
  return 'COMPLIANCE_BLOCK';
}

function toPreventedAction(evidences: ComplianceEvidence[]): string {
  const module = evidences.find((item) => item.module)?.module;
  if (module) return `Operação em ${module}`;
  return 'Operação de fluxo não permitida';
}

/**
 * Constrói bloco de validações a partir de evidências com lastro explícito.
 */
export function mapValidations(evidences: ComplianceEvidence[]): ComplianceValidationItem[] {
  const groups = groupEvidencesByType(evidences, [
    'RULE_VALIDATION',
    'REVIEW_EXECUTION',
    'FLOW_ENFORCEMENT',
    'CROSS_MODULE_VALIDATION',
  ]);

  return groups.map((group, idx) => {
    const first = group.evidences[0] as ComplianceEvidence;
    const evidenceRefs = group.evidences.map((item) => item.id);
    const status = toValidationStatus(group.evidences);
    const severity =
      status === 'FAILED'
        ? 'CRITICAL'
        : group.evidences.some((item) => item.severity === 'WARNING')
          ? 'WARNING'
          : 'INFO';

    return {
      id: `validation-${idx + 1}-${normalizeTextToken(group.key)}`,
      name: toValidationName(first.type),
      description: `${group.evidences.length} evidência(s) vinculadas a ${first.type}.`,
      status,
      severity,
      evidenceRefs,
    };
  });
}

/**
 * Constrói bloco de bloqueios a partir de evidências impeditivas.
 */
export function mapBlockings(evidences: ComplianceEvidence[]): ComplianceBlockingItem[] {
  const groups = groupEvidencesByType(evidences, [
    'TRANSITION_BLOCK',
    'SECURITY_ENFORCEMENT',
    'DOWNSTREAM_INVALIDATION',
  ]);

  return groups.map((group, idx) => {
    const first = group.evidences[0] as ComplianceEvidence;
    const isDownstreamInvalidation = first.type === 'DOWNSTREAM_INVALIDATION';
    return {
      id: `blocking-${idx + 1}-${normalizeTextToken(group.key)}`,
      name: toBlockingName(first.type),
      description: isDownstreamInvalidation
        ? `${group.evidences.length} evidência(s) de invalidação downstream por reação automática do motor, com impacto em continuidade do fluxo.`
        : `${group.evidences.length} evidência(s) impeditivas associadas ao tipo ${first.type}.`,
      blockType: toBlockingType(first.type),
      preventedAction: toPreventedAction(group.evidences),
      evidenceRefs: group.evidences.map((item) => item.id),
    };
  });
}

/**
 * Constrói timeline cronológica priorizando eventos institucionais relevantes.
 */
export function mapTimeline(evidences: ComplianceEvidence[]): ComplianceTimelineItem[] {
  const relevantTypes: ComplianceEvidence['type'][] = [
    'AUDIT_EVENT',
    'FLOW_ENFORCEMENT',
    'RULE_VALIDATION',
    'REVIEW_EXECUTION',
    'TRANSITION_BLOCK',
    'SECURITY_ENFORCEMENT',
    'DOWNSTREAM_INVALIDATION',
  ];
  const filtered = evidences.filter((item) => relevantTypes.includes(item.type));
  const deduplicated = new Map<string, ComplianceEvidence>();
  for (const evidence of filtered) {
    const key = [
      evidence.type,
      evidence.createdAt,
      evidence.revisionRef ?? 'NO_REVISION',
      evidence.title,
      evidence.module ?? 'NO_MODULE',
    ].join('|');
    if (!deduplicated.has(key)) deduplicated.set(key, evidence);
  }
  return [...deduplicated.values()].map((evidence) => ({
    id: `timeline-${normalizeTextToken(evidence.id)}`,
    timestamp: evidence.createdAt,
    actionType: evidence.type,
    description: evidence.title,
    module: evidence.module,
    step: evidence.step,
    revisionAfter: evidence.revisionRef,
    evidenceRefs: [evidence.id],
  }));
}

/**
 * Expõe reações automáticas já classificadas no backend para evitar inferência no frontend.
 */
export function mapAutomaticReactions(
  evidences: ComplianceEvidence[],
  blockings: ComplianceBlockingItem[],
  generatedAt: string,
): ComplianceAutomaticReaction[] {
  const reactions: ComplianceAutomaticReaction[] = [];

  for (const evidence of evidences) {
    if (evidence.type !== 'DOWNSTREAM_INVALIDATION') continue;
    reactions.push({
      id: `reaction-evidence-${normalizeTextToken(evidence.id)}`,
      reactionType: 'DOWNSTREAM_INVALIDATION',
      title: evidence.title,
      summary: evidence.summary,
      evidenceRefs: [evidence.id],
      createdAt: evidence.createdAt,
    });
  }

  for (const blocking of blockings) {
    if (blocking.blockType !== 'DOWNSTREAM_INVALIDATION') continue;
    reactions.push({
      id: `reaction-blocking-${normalizeTextToken(blocking.id)}`,
      reactionType: 'AUTOMATED_BLOCK_RESPONSE',
      title: blocking.name,
      summary: blocking.description,
      evidenceRefs: blocking.evidenceRefs,
      createdAt: generatedAt,
    });
  }

  const uniqueByKey = new Map<string, ComplianceAutomaticReaction>();
  for (const reaction of reactions) {
    const key = `${reaction.reactionType}|${reaction.title}|${reaction.evidenceRefs.join(',')}`;
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, reaction);
  }
  return [...uniqueByKey.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Deriva veredito mínimo determinístico e prudente a partir do conjunto de evidências disponível.
 */
export function resolveVerdict(
  evidences: ComplianceEvidence[],
  flowContext?: ComplianceFlowConclusionContext,
): ComplianceVerdict {
  const hasCriticalBlocking = evidences.some(
    (item) => item.status === 'BLOCKED' && item.severity === 'CRITICAL',
  );
  if (hasCriticalBlocking) return 'NOT_APPROVED';

  const hasReviewEvidence = evidences.some((item) => item.type === 'REVIEW_EXECUTION');
  const hasMinimumConclusionBase =
    evidences.some((item) => item.type === 'FLOW_ENFORCEMENT') &&
    evidences.some((item) => item.type === 'RULE_VALIDATION');
  const isFlowConclusionCompatible = flowContext?.hasTerminalSignal ?? false;
  if (!hasReviewEvidence || !hasMinimumConclusionBase || !isFlowConclusionCompatible) return 'UNDER_REVIEW';

  const hasWarnings = evidences.some((item) => item.severity === 'WARNING' || item.status === 'FAILED');
  if (hasWarnings) return 'APPROVED_WITH_WARNINGS';

  return 'APPROVED';
}

/**
 * Limita valor ao intervalo institucional de 0 a 100.
 */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Constrói score explicável robusto baseado em 4 pilares e coerente com o veredito.
 */
export function buildProvisionalScore(params: {
  evidences: ComplianceEvidence[];
  verdict: ComplianceVerdict;
  flowContext?: ComplianceFlowConclusionContext;
  validations: ComplianceValidationItem[];
  blockings: ComplianceBlockingItem[];
  timeline: ComplianceTimelineItem[];
}): ComplianceScoreBreakdown {
  const { evidences, verdict, flowContext, validations, blockings, timeline } = params;

  const criticalBlockings = evidences.filter((item) => item.status === 'BLOCKED' && item.severity === 'CRITICAL').length;
  const criticalIssues = evidences.filter((item) => item.severity === 'CRITICAL').length;
  const warnings = evidences.filter((item) => item.severity === 'WARNING' || item.status === 'FAILED').length;

  const hasFlowSessionEvidence = evidences.some((item) => item.type === 'FLOW_ENFORCEMENT');
  const hasReviewEvidence = evidences.some((item) => item.type === 'REVIEW_EXECUTION');
  const hasTerminalSignal = flowContext?.hasTerminalSignal ?? false;
  const flowBlockingSignals = evidences.filter(
    (item) =>
      item.type === 'TRANSITION_BLOCK' ||
      item.type === 'SECURITY_ENFORCEMENT' ||
      item.type === 'DOWNSTREAM_INVALIDATION',
  ).length;

  let flowIntegrityBase = 30;
  if (hasFlowSessionEvidence) flowIntegrityBase += 20;
  if (hasReviewEvidence) flowIntegrityBase += 20;
  if (hasTerminalSignal) flowIntegrityBase += 15;
  flowIntegrityBase -= criticalBlockings * 30;
  flowIntegrityBase -= Math.max(0, flowBlockingSignals - criticalBlockings) * 8;
  const flowIntegrity = clampScore(flowIntegrityBase);

  const passedValidations = validations.filter((item) => item.status === 'PASSED').length;
  const failedValidations = validations.filter((item) => item.status === 'FAILED').length;
  const structuralConsistency = clampScore(35 + passedValidations * 12 - failedValidations * 16 - warnings * 5);

  const crossModuleCount = evidences.filter((item) => item.type === 'CROSS_MODULE_VALIDATION').length;
  const interModuleCoherence = clampScore(crossModuleCount > 0 ? Math.min(90, 50 + crossModuleCount * 10) : 40);
  const hasInterModuleLimitation = crossModuleCount === 0;

  const withSourceRefs = evidences.filter((item) => item.sourceRefs.length > 0).length;
  const withRevision = evidences.filter((item) => typeof item.revisionRef === 'number').length;
  const auditEvents = evidences.filter((item) => item.type === 'AUDIT_EVENT').length;
  const traceability = clampScore(
    (evidences.length === 0 ? 0 : (withSourceRefs / evidences.length) * 55) +
      Math.min(20, withRevision * 3) +
      Math.min(15, auditEvents * 3) +
      Math.min(10, timeline.length >= 3 ? 10 : timeline.length * 3),
  );

  let overallScore = clampScore(
    flowIntegrity * 0.35 +
      structuralConsistency * 0.25 +
      interModuleCoherence * 0.15 +
      traceability * 0.25 -
      criticalBlockings * 18 -
      warnings * 4,
  );

  if (criticalBlockings > 0) {
    overallScore = Math.min(overallScore, 45);
  }
  if (verdict === 'UNDER_REVIEW') {
    overallScore = Math.min(overallScore, 74);
  }
  if (verdict === 'APPROVED_WITH_WARNINGS') {
    overallScore = Math.min(overallScore, 84);
  }
  if (verdict === 'APPROVED') {
    overallScore = Math.max(overallScore, 70);
  }
  if (verdict === 'NOT_APPROVED') {
    overallScore = Math.min(overallScore, 39);
  }

  const factors: ScoreFactor[] = [
    {
      name: 'Fluxo persistido com trilha rastreável',
      impact: hasFlowSessionEvidence ? 14 : -18,
      description: hasFlowSessionEvidence
        ? 'A base canônica contém enforcement de fluxo e sessão persistida.'
        : 'Ausência de evidência de enforcement de fluxo reduz confiança da integridade.',
    },
    {
      name: 'Revisão executada com sucesso',
      impact: hasReviewEvidence ? 12 : -16,
      description: hasReviewEvidence
        ? 'Há evidência de review execution no conjunto auditável.'
        : 'Não há evidência de review execution; conclusão permanece parcial.',
    },
    {
      name: 'Bloqueio crítico identificado',
      impact: criticalBlockings > 0 ? -28 : 6,
      description: criticalBlockings > 0
        ? 'Foi identificado impeditivo crítico com status BLOCKED.'
        : 'Não há bloqueio crítico impeditivo no conjunto atual.',
    },
    {
      name: 'Base intermodular',
      impact: hasInterModuleLimitation ? -10 : 10,
      description: hasInterModuleLimitation
        ? 'A coerência intermodular está limitada por ausência de CROSS_MODULE_VALIDATION explícita.'
        : 'Há evidências explícitas de validação entre módulos.',
    },
    {
      name: 'Evidências de auditoria e revisão',
      impact: traceability >= 80 ? 12 : traceability >= 60 ? 4 : -10,
      description:
        traceability >= 80
          ? 'Rastreabilidade sólida com sourceRefs, revisões e trilha de auditoria.'
          : 'Rastreabilidade parcial; vínculos e/ou eventos auditáveis ainda insuficientes.',
    },
    {
      name: 'Warnings e falhas não impeditivas',
      impact: warnings === 0 ? 4 : -Math.min(16, warnings * 3),
      description:
        warnings === 0
          ? 'Não há warnings/falhas não impeditivas relevantes.'
          : `Foram identificados ${warnings} warning(s)/falha(s), com impacto de prudência na nota.`,
    },
  ];

  const limitationNotes: string[] = [];
  if (hasInterModuleLimitation) limitationNotes.push('coerência intermodular ainda parcial');
  if (!hasReviewEvidence) limitationNotes.push('ausência de review execution');
  if (!hasTerminalSignal) limitationNotes.push('estado atual sem sinal terminal de conclusão');
  const criticalNote = criticalBlockings > 0
    ? 'Há impeditivo crítico identificado, relativizando o valor numérico do score.'
    : 'Não há impeditivo crítico identificado no conjunto atual.';
  const limitationText =
    limitationNotes.length > 0
      ? ` Limitações de base: ${limitationNotes.join('; ')}.`
      : '';

  return {
    overallScore: clampScore(overallScore),
    flowIntegrity,
    structuralConsistency,
    interModuleCoherence,
    traceability,
    criticalIssues,
    warnings,
    explanation:
      `Score explicado por quatro pilares (integridade de fluxo, consistência estrutural, coerência intermodular e rastreabilidade), com penalizações por bloqueios críticos e warnings.${limitationText} ${criticalNote}`,
    factors,
  };
}

/**
 * Produz resumo institucional curto e rastreável ao conteúdo do relatório.
 */
export function buildSummary(params: {
  evidences: ComplianceEvidence[];
  validations: ComplianceValidationItem[];
  blockings: ComplianceBlockingItem[];
  verdict: ComplianceVerdict;
  hasReviewEvidence: boolean;
  hasMinimumConclusionBase: boolean;
}): string {
  const { evidences, validations, blockings, verdict, hasReviewEvidence, hasMinimumConclusionBase } = params;
  const reviewStatus = hasReviewEvidence ? 'com execução de review registrada' : 'sem execução de review registrada';
  const baseStatus = hasMinimumConclusionBase ? 'base mínima de conclusão presente' : 'base de conclusão ainda parcial';
  return [
    `Relatório composto com ${evidences.length} evidência(s) rastreável(is).`,
    `${validations.length} validação(ões) consolidada(s) e ${blockings.length} bloqueio(s) identificado(s).`,
    `${reviewStatus}; ${baseStatus}.`,
    `Veredito atual: ${verdict}.`,
  ].join(' ');
}

/**
 * Monta objeto ComplianceReport completo para a fase atual.
 */
export function composeComplianceReport(params: {
  processId: string;
  tenantId: string;
  generatedAt: string;
  evidences: ComplianceEvidence[];
  flowContext?: ComplianceFlowConclusionContext;
}): ComplianceReport {
  const validations = mapValidations(params.evidences);
  const blockings = mapBlockings(params.evidences);
  const timeline = mapTimeline(params.evidences);
  const verdict = resolveVerdict(params.evidences, params.flowContext);
  const hasReviewEvidence = params.evidences.some((item) => item.type === 'REVIEW_EXECUTION');
  const hasMinimumConclusionBase =
    params.evidences.some((item) => item.type === 'FLOW_ENFORCEMENT') &&
    params.evidences.some((item) => item.type === 'RULE_VALIDATION');
  const score = buildProvisionalScore({
    evidences: params.evidences,
    verdict,
    flowContext: params.flowContext,
    validations,
    blockings,
    timeline,
  });
  const summary = buildSummary({
    evidences: params.evidences,
    validations,
    blockings,
    verdict,
    hasReviewEvidence,
    hasMinimumConclusionBase,
  });
  const automaticReactions = mapAutomaticReactions(params.evidences, blockings, params.generatedAt);

  return {
    processId: params.processId,
    tenantId: params.tenantId,
    generatedAt: params.generatedAt,
    verdict,
    summary,
    score,
    validations,
    blockings,
    timeline,
    evidences: params.evidences,
    documents: [],
    automaticReactions,
  };
}
