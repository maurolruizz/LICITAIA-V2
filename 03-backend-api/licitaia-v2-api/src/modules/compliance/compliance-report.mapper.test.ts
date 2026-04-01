import test from 'node:test';
import assert from 'node:assert/strict';
import type { ComplianceEvidence } from './compliance-report.types';
import {
  buildProvisionalScore,
  buildSummary,
  mapBlockings,
  mapTimeline,
  mapValidations,
  resolveVerdict,
} from './compliance-report.mapper';

function evidence(input: Partial<ComplianceEvidence> & Pick<ComplianceEvidence, 'id' | 'type'>): ComplianceEvidence {
  return {
    id: input.id,
    type: input.type,
    category: input.category ?? 'TEST',
    severity: input.severity ?? 'INFO',
    status: input.status ?? 'PASSED',
    title: input.title ?? `Evidence ${input.id}`,
    summary: input.summary ?? 'Resumo de teste',
    processId: input.processId ?? 'FLOW-TEST-1',
    flowSessionId: input.flowSessionId,
    revisionRef: input.revisionRef,
    step: input.step,
    module: input.module ?? 'FLOW_CONTROLLER',
    sourceRefs: input.sourceRefs ?? [`source:${input.id}`],
    legalBasis: input.legalBasis,
    technicalBasis: input.technicalBasis,
    createdAt: input.createdAt ?? '2026-03-31T10:00:00.000Z',
  };
}

test('resolveVerdict retorna NOT_APPROVED com bloqueio crítico', () => {
  const evidences = [
    evidence({ id: 'e1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'e2', type: 'SECURITY_ENFORCEMENT', severity: 'CRITICAL', status: 'BLOCKED' }),
  ];
  const verdict = resolveVerdict(evidences, { currentRevision: 5, hasTerminalSignal: true });
  assert.equal(verdict, 'NOT_APPROVED');
});

test('resolveVerdict retorna UNDER_REVIEW sem base mínima de conclusão', () => {
  const evidences = [evidence({ id: 'e1', type: 'AUDIT_EVENT', status: 'INFO' })];
  const verdict = resolveVerdict(evidences, { currentRevision: 1, hasTerminalSignal: false });
  assert.equal(verdict, 'UNDER_REVIEW');
});

test('resolveVerdict retorna UNDER_REVIEW sem sinal terminal mesmo com review', () => {
  const evidences = [
    evidence({ id: 'e1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'e2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'e3', type: 'REVIEW_EXECUTION' }),
  ];
  const verdict = resolveVerdict(evidences, { currentRevision: 7, hasTerminalSignal: false });
  assert.equal(verdict, 'UNDER_REVIEW');
});

test('resolveVerdict retorna APPROVED_WITH_WARNINGS com base mínima e warning', () => {
  const evidences = [
    evidence({ id: 'e1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'e2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'e3', type: 'REVIEW_EXECUTION' }),
    evidence({ id: 'e4', type: 'AUDIT_EVENT', severity: 'WARNING', status: 'INFO' }),
  ];
  const verdict = resolveVerdict(evidences, { currentRevision: 8, hasTerminalSignal: true });
  assert.equal(verdict, 'APPROVED_WITH_WARNINGS');
});

test('resolveVerdict retorna APPROVED apenas com base completa e sem warnings', () => {
  const evidences = [
    evidence({ id: 'e1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'e2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'e3', type: 'REVIEW_EXECUTION' }),
  ];
  const verdict = resolveVerdict(evidences, { currentRevision: 9, hasTerminalSignal: true });
  assert.equal(verdict, 'APPROVED');
});

test('buildSummary reflete review e base de conclusão', () => {
  const summary = buildSummary({
    evidences: [evidence({ id: 'e1', type: 'AUDIT_EVENT' })],
    validations: [],
    blockings: [],
    verdict: 'UNDER_REVIEW',
    hasReviewEvidence: false,
    hasMinimumConclusionBase: false,
  });
  assert.match(summary, /sem execução de review registrada/);
  assert.match(summary, /base de conclusão ainda parcial/);
  assert.match(summary, /Veredito atual: UNDER_REVIEW/);
});

test('mapValidations preserva granularidade sem colapsar títulos distintos', () => {
  const evidences = [
    evidence({ id: 'v1', type: 'RULE_VALIDATION', title: 'Regra A', category: 'RULE_A' }),
    evidence({ id: 'v2', type: 'RULE_VALIDATION', title: 'Regra B', category: 'RULE_B' }),
  ];
  const validations = mapValidations(evidences);
  assert.equal(validations.length, 2);
  assert.notEqual(validations[0]?.id, validations[1]?.id);
});

test('mapBlockings descreve DOWNSTREAM_INVALIDATION como reação automática', () => {
  const blockings = mapBlockings([
    evidence({
      id: 'b1',
      type: 'DOWNSTREAM_INVALIDATION',
      severity: 'WARNING',
      status: 'FAILED',
    }),
  ]);
  assert.equal(blockings.length, 1);
  assert.match(blockings[0]?.description ?? '', /reação automática do motor/i);
});

test('mapTimeline reduz ruído ao ignorar tipo não prioritário', () => {
  const timeline = mapTimeline([
    evidence({ id: 't1', type: 'AUDIT_EVENT' }),
    evidence({ id: 't2', type: 'TENANT_ISOLATION_PROOF' }),
  ]);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.actionType, 'AUDIT_EVENT');
});

test('score alto não ocorre com bloqueio crítico', () => {
  const evidences = [
    evidence({ id: 's1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 's2', type: 'RULE_VALIDATION' }),
    evidence({ id: 's3', type: 'REVIEW_EXECUTION' }),
    evidence({ id: 's4', type: 'SECURITY_ENFORCEMENT', severity: 'CRITICAL', status: 'BLOCKED' }),
  ];
  const verdict = resolveVerdict(evidences, { currentRevision: 12, hasTerminalSignal: true });
  const score = buildProvisionalScore({
    evidences,
    verdict,
    flowContext: { currentRevision: 12, hasTerminalSignal: true },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  assert.equal(verdict, 'NOT_APPROVED');
  assert.ok(score.overallScore <= 39);
});

test('ausência de review reduz flowIntegrity', () => {
  const withReview = [
    evidence({ id: 'r1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'r2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'r3', type: 'REVIEW_EXECUTION' }),
  ];
  const withoutReview = [
    evidence({ id: 'r1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'r2', type: 'RULE_VALIDATION' }),
  ];
  const scoreWithReview = buildProvisionalScore({
    evidences: withReview,
    verdict: resolveVerdict(withReview, { currentRevision: 10, hasTerminalSignal: true }),
    flowContext: { currentRevision: 10, hasTerminalSignal: true },
    validations: mapValidations(withReview),
    blockings: mapBlockings(withReview),
    timeline: mapTimeline(withReview),
  });
  const scoreWithoutReview = buildProvisionalScore({
    evidences: withoutReview,
    verdict: resolveVerdict(withoutReview, { currentRevision: 10, hasTerminalSignal: true }),
    flowContext: { currentRevision: 10, hasTerminalSignal: true },
    validations: mapValidations(withoutReview),
    blockings: mapBlockings(withoutReview),
    timeline: mapTimeline(withoutReview),
  });
  assert.ok(scoreWithoutReview.flowIntegrity < scoreWithReview.flowIntegrity);
});

test('ausência de terminal signal impede score pleno', () => {
  const evidences = [
    evidence({ id: 't1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 't2', type: 'RULE_VALIDATION' }),
    evidence({ id: 't3', type: 'REVIEW_EXECUTION' }),
  ];
  const scoreNoTerminal = buildProvisionalScore({
    evidences,
    verdict: resolveVerdict(evidences, { currentRevision: 3, hasTerminalSignal: false }),
    flowContext: { currentRevision: 3, hasTerminalSignal: false },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  const scoreTerminal = buildProvisionalScore({
    evidences,
    verdict: resolveVerdict(evidences, { currentRevision: 3, hasTerminalSignal: true }),
    flowContext: { currentRevision: 3, hasTerminalSignal: true },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  assert.ok(scoreNoTerminal.flowIntegrity < scoreTerminal.flowIntegrity);
  assert.ok(scoreNoTerminal.overallScore <= 74);
});

test('ausência de CROSS_MODULE_VALIDATION limita interModuleCoherence', () => {
  const base = [
    evidence({ id: 'm1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'm2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'm3', type: 'REVIEW_EXECUTION' }),
  ];
  const withCross = [...base, evidence({ id: 'm4', type: 'CROSS_MODULE_VALIDATION' })];
  const scoreNoCross = buildProvisionalScore({
    evidences: base,
    verdict: resolveVerdict(base, { currentRevision: 5, hasTerminalSignal: true }),
    flowContext: { currentRevision: 5, hasTerminalSignal: true },
    validations: mapValidations(base),
    blockings: mapBlockings(base),
    timeline: mapTimeline(base),
  });
  const scoreWithCross = buildProvisionalScore({
    evidences: withCross,
    verdict: resolveVerdict(withCross, { currentRevision: 5, hasTerminalSignal: true }),
    flowContext: { currentRevision: 5, hasTerminalSignal: true },
    validations: mapValidations(withCross),
    blockings: mapBlockings(withCross),
    timeline: mapTimeline(withCross),
  });
  assert.ok(scoreNoCross.interModuleCoherence < scoreWithCross.interModuleCoherence);
  assert.match(scoreNoCross.explanation, /intermodular ainda parcial/i);
});

test('forte rastreabilidade melhora traceability', () => {
  const lowTrace = [
    evidence({ id: 'tr1', type: 'AUDIT_EVENT', sourceRefs: ['source:tr1'] }),
  ];
  const highTrace = [
    evidence({ id: 'tr2', type: 'AUDIT_EVENT', sourceRefs: ['audit_log:1'], revisionRef: 1 }),
    evidence({ id: 'tr3', type: 'RULE_VALIDATION', sourceRefs: ['flow_revision:2'], revisionRef: 2 }),
    evidence({ id: 'tr4', type: 'FLOW_ENFORCEMENT', sourceRefs: ['flow_session:3'], revisionRef: 2 }),
  ];
  const low = buildProvisionalScore({
    evidences: lowTrace,
    verdict: resolveVerdict(lowTrace, { currentRevision: 1, hasTerminalSignal: false }),
    flowContext: { currentRevision: 1, hasTerminalSignal: false },
    validations: mapValidations(lowTrace),
    blockings: mapBlockings(lowTrace),
    timeline: mapTimeline(lowTrace),
  });
  const high = buildProvisionalScore({
    evidences: highTrace,
    verdict: resolveVerdict(highTrace, { currentRevision: 2, hasTerminalSignal: true }),
    flowContext: { currentRevision: 2, hasTerminalSignal: true },
    validations: mapValidations(highTrace),
    blockings: mapBlockings(highTrace),
    timeline: mapTimeline(highTrace),
  });
  assert.ok(high.traceability > low.traceability);
});

test('warnings impactam overallScore', () => {
  const noWarnings = [
    evidence({ id: 'w1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'w2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'w3', type: 'REVIEW_EXECUTION' }),
  ];
  const withWarnings = [
    ...noWarnings,
    evidence({ id: 'w4', type: 'AUDIT_EVENT', severity: 'WARNING', status: 'INFO' }),
    evidence({ id: 'w5', type: 'DOWNSTREAM_INVALIDATION', severity: 'WARNING', status: 'FAILED' }),
  ];
  const scoreNoWarnings = buildProvisionalScore({
    evidences: noWarnings,
    verdict: resolveVerdict(noWarnings, { currentRevision: 4, hasTerminalSignal: true }),
    flowContext: { currentRevision: 4, hasTerminalSignal: true },
    validations: mapValidations(noWarnings),
    blockings: mapBlockings(noWarnings),
    timeline: mapTimeline(noWarnings),
  });
  const scoreWithWarnings = buildProvisionalScore({
    evidences: withWarnings,
    verdict: resolveVerdict(withWarnings, { currentRevision: 4, hasTerminalSignal: true }),
    flowContext: { currentRevision: 4, hasTerminalSignal: true },
    validations: mapValidations(withWarnings),
    blockings: mapBlockings(withWarnings),
    timeline: mapTimeline(withWarnings),
  });
  assert.ok(scoreWithWarnings.overallScore < scoreNoWarnings.overallScore);
});

test('factors explicam impactos positivos e negativos', () => {
  const evidences = [
    evidence({ id: 'f1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'f2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'f3', type: 'REVIEW_EXECUTION' }),
    evidence({ id: 'f4', type: 'SECURITY_ENFORCEMENT', severity: 'CRITICAL', status: 'BLOCKED' }),
  ];
  const score = buildProvisionalScore({
    evidences,
    verdict: resolveVerdict(evidences, { currentRevision: 6, hasTerminalSignal: true }),
    flowContext: { currentRevision: 6, hasTerminalSignal: true },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  assert.ok(score.factors.some((f) => f.impact > 0));
  assert.ok(score.factors.some((f) => f.impact < 0));
  assert.ok(score.factors.some((f) => /Bloqueio crítico/i.test(f.name)));
});

test('explanation explicita limitações quando houver', () => {
  const evidences = [
    evidence({ id: 'x1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'x2', type: 'RULE_VALIDATION' }),
  ];
  const score = buildProvisionalScore({
    evidences,
    verdict: resolveVerdict(evidences, { currentRevision: 2, hasTerminalSignal: false }),
    flowContext: { currentRevision: 2, hasTerminalSignal: false },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  assert.match(score.explanation, /Limitações de base/i);
  assert.match(score.explanation, /ausência de review execution/i);
});

test('compatibilidade entre verdict e score', () => {
  const notApprovedEvidence = [
    evidence({ id: 'c1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'c2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'c3', type: 'SECURITY_ENFORCEMENT', severity: 'CRITICAL', status: 'BLOCKED' }),
  ];
  const notApprovedVerdict = resolveVerdict(notApprovedEvidence, { currentRevision: 4, hasTerminalSignal: true });
  const notApprovedScore = buildProvisionalScore({
    evidences: notApprovedEvidence,
    verdict: notApprovedVerdict,
    flowContext: { currentRevision: 4, hasTerminalSignal: true },
    validations: mapValidations(notApprovedEvidence),
    blockings: mapBlockings(notApprovedEvidence),
    timeline: mapTimeline(notApprovedEvidence),
  });
  assert.equal(notApprovedVerdict, 'NOT_APPROVED');
  assert.ok(notApprovedScore.overallScore <= 39);

  const approvedEvidence = [
    evidence({ id: 'c4', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'c5', type: 'RULE_VALIDATION' }),
    evidence({ id: 'c6', type: 'REVIEW_EXECUTION' }),
    evidence({ id: 'c7', type: 'CROSS_MODULE_VALIDATION' }),
  ];
  const approvedVerdict = resolveVerdict(approvedEvidence, { currentRevision: 4, hasTerminalSignal: true });
  const approvedScore = buildProvisionalScore({
    evidences: approvedEvidence,
    verdict: approvedVerdict,
    flowContext: { currentRevision: 4, hasTerminalSignal: true },
    validations: mapValidations(approvedEvidence),
    blockings: mapBlockings(approvedEvidence),
    timeline: mapTimeline(approvedEvidence),
  });
  assert.equal(approvedVerdict, 'APPROVED');
  assert.ok(approvedScore.overallScore >= 70);
});

test('notas permanecem sempre entre 0 e 100', () => {
  const evidences = [
    evidence({ id: 'n1', type: 'FLOW_ENFORCEMENT' }),
    evidence({ id: 'n2', type: 'RULE_VALIDATION' }),
    evidence({ id: 'n3', type: 'REVIEW_EXECUTION' }),
    evidence({ id: 'n4', type: 'SECURITY_ENFORCEMENT', severity: 'CRITICAL', status: 'BLOCKED' }),
    evidence({ id: 'n5', type: 'DOWNSTREAM_INVALIDATION', severity: 'WARNING', status: 'FAILED' }),
  ];
  const score = buildProvisionalScore({
    evidences,
    verdict: resolveVerdict(evidences, { currentRevision: 8, hasTerminalSignal: true }),
    flowContext: { currentRevision: 8, hasTerminalSignal: true },
    validations: mapValidations(evidences),
    blockings: mapBlockings(evidences),
    timeline: mapTimeline(evidences),
  });
  assert.ok(score.overallScore >= 0 && score.overallScore <= 100);
  assert.ok(score.flowIntegrity >= 0 && score.flowIntegrity <= 100);
  assert.ok(score.structuralConsistency >= 0 && score.structuralConsistency <= 100);
  assert.ok(score.interModuleCoherence >= 0 && score.interModuleCoherence <= 100);
  assert.ok(score.traceability >= 0 && score.traceability <= 100);
});
