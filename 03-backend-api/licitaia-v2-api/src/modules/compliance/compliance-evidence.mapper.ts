import type { ProcessRecord } from '../process/process.types';
import type { FlowSessionRecord, FlowSessionRevisionRecord } from '../flow/flow-session.types';
import type { ComplianceEvidence } from './compliance-report.types';

export type ProcessAuditLogRecord = {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function normalizeTextToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildEvidenceId(type: ComplianceEvidence['type'], key: string): string {
  return `ce-${normalizeTextToken(type)}-${normalizeTextToken(key)}`;
}

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function tryGetStep(snapshot: Record<string, unknown>): string | undefined {
  const stepCandidates = ['currentStep', 'currentStepId', 'step', 'stepId'];
  for (const key of stepCandidates) {
    const value = snapshot[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

function pickMetadataString(metadata: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

/**
 * Gera evidência base de criação do processo a partir da tabela canônica `processes`.
 */
export function mapProcessToEvidence(process: ProcessRecord): ComplianceEvidence {
  return {
    id: buildEvidenceId('AUDIT_EVENT', `process-created-${process.id}`),
    type: 'AUDIT_EVENT',
    category: 'PROCESS_LIFECYCLE',
    severity: 'INFO',
    status: 'INFO',
    title: 'Processo registrado',
    summary: `Processo ${process.id} registrado com persistência canônica em processes.`,
    processId: process.id,
    sourceRefs: [`process:${process.id}`],
    technicalBasis: ['processes'],
    createdAt: process.createdAt,
  };
}

/**
 * Gera evidência de enforcement estrutural da sessão de fluxo persistida.
 */
export function mapFlowSessionToEvidence(flowSession: FlowSessionRecord): ComplianceEvidence {
  return {
    id: buildEvidenceId('FLOW_ENFORCEMENT', `flow-session-${flowSession.id}`),
    type: 'FLOW_ENFORCEMENT',
    category: 'FLOW_SESSION',
    severity: 'INFO',
    status: 'PASSED',
    title: 'Sessão de fluxo persistida',
    summary: `Sessão ${flowSession.id} vinculada ao processo ${flowSession.processId} com revisão ${flowSession.revision}.`,
    processId: flowSession.processId,
    flowSessionId: flowSession.id,
    revisionRef: flowSession.revision,
    step: tryGetStep(flowSession.snapshot),
    module: 'FLOW_CONTROLLER',
    sourceRefs: [`flow_session:${flowSession.id}`, `process:${flowSession.processId}`],
    technicalBasis: ['flow_sessions'],
    createdAt: flowSession.createdAt,
  };
}

/**
 * Mapeia cada revisão persistida para evidências de validação, bloqueio ou review quando aplicável.
 */
export function mapRevisionToEvidences(revision: FlowSessionRevisionRecord): ComplianceEvidence[] {
  const evidences: ComplianceEvidence[] = [];
  const action = revision.action.trim();
  const actionNorm = action.toUpperCase();
  const snapshot = ensureObject(revision.snapshot);
  const step = tryGetStep(snapshot);
  const sourceRefs = [`flow_revision:${revision.id}`, `flow_revision_number:${revision.revision}`];

  if (actionNorm === 'TRIGGER_REVIEW') {
    const finalStatus = typeof snapshot['finalStatus'] === 'string' ? snapshot['finalStatus'] : null;
    const summarySuffix =
      finalStatus && finalStatus.trim() !== ''
        ? ` Resultado registrado: ${finalStatus}.`
        : ' Resultado registrado na revisão correspondente.';
    evidences.push({
      id: buildEvidenceId('REVIEW_EXECUTION', `revision-${revision.id}`),
      type: 'REVIEW_EXECUTION',
      category: 'FLOW_REVIEW',
      severity: 'INFO',
      status: 'PASSED',
      title: 'Review de fluxo executada',
      summary: `Ação TRIGGER_REVIEW persistida na revisão ${revision.revision}.${summarySuffix}`,
      processId: revision.processId,
      flowSessionId: revision.flowSessionId,
      revisionRef: revision.revision,
      step,
      module: 'FLOW_CONTROLLER',
      sourceRefs,
      technicalBasis: ['flow_session_revisions'],
      createdAt: revision.createdAt,
    });
    return evidences;
  }

  if (actionNorm.includes('BLOCK') || actionNorm.includes('DENY') || actionNorm.includes('INVALID')) {
    evidences.push({
      id: buildEvidenceId('TRANSITION_BLOCK', `revision-${revision.id}`),
      type: 'TRANSITION_BLOCK',
      category: 'FLOW_TRANSITION',
      severity: 'CRITICAL',
      status: 'BLOCKED',
      title: 'Transição bloqueada no fluxo',
      summary: `Ação ${action} registrada como bloqueio em revisão ${revision.revision}.`,
      processId: revision.processId,
      flowSessionId: revision.flowSessionId,
      revisionRef: revision.revision,
      step,
      module: 'FLOW_CONTROLLER',
      sourceRefs,
      technicalBasis: ['flow_session_revisions'],
      createdAt: revision.createdAt,
    });
    return evidences;
  }

  if (actionNorm.includes('INVALIDATE') || actionNorm.includes('REOPEN')) {
    evidences.push({
      id: buildEvidenceId('DOWNSTREAM_INVALIDATION', `revision-${revision.id}`),
      type: 'DOWNSTREAM_INVALIDATION',
      category: 'FLOW_CONSISTENCY',
      severity: 'WARNING',
      status: 'FAILED',
      title: 'Invalidação downstream registrada',
      summary: `Ação ${action} indica invalidação de etapa posterior na revisão ${revision.revision}.`,
      processId: revision.processId,
      flowSessionId: revision.flowSessionId,
      revisionRef: revision.revision,
      step,
      module: 'FLOW_CONTROLLER',
      sourceRefs,
      technicalBasis: ['flow_session_revisions'],
      createdAt: revision.createdAt,
    });
    return evidences;
  }

  evidences.push({
    id: buildEvidenceId('RULE_VALIDATION', `revision-${revision.id}`),
    type: 'RULE_VALIDATION',
    category: 'FLOW_RULE_EXECUTION',
    severity: 'INFO',
    status: 'PASSED',
    title: 'Ação de fluxo validada e persistida',
    summary: `Ação ${action} aplicada e persistida na revisão ${revision.revision}.`,
    processId: revision.processId,
    flowSessionId: revision.flowSessionId,
    revisionRef: revision.revision,
    step,
    module: 'FLOW_CONTROLLER',
    sourceRefs,
    technicalBasis: ['flow_session_revisions'],
    createdAt: revision.createdAt,
  });
  return evidences;
}

/**
 * Mapeia audit log canônico para evento de auditoria e evidências de segurança quando explícitas no fato.
 */
export function mapAuditLogToEvidences(
  auditLog: ProcessAuditLogRecord,
  processId: string,
  flowSessionId?: string,
): ComplianceEvidence[] {
  const evidences: ComplianceEvidence[] = [];
  const metadata = ensureObject(auditLog.metadata);
  const actionType = auditLog.action.trim();
  const normalizedAction = actionType.toUpperCase();
  const revisionAfterRaw = metadata['new_revision'];
  const revisionAfter = typeof revisionAfterRaw === 'number' ? revisionAfterRaw : undefined;
  const module = pickMetadataString(metadata, ['affected_module', 'module']);
  const step = pickMetadataString(metadata, ['step', 'step_id', 'current_step']);
  const flowSessionFromMetadata = pickMetadataString(metadata, ['flow_session_id']);
  const resolvedFlowSessionId = flowSessionFromMetadata ?? flowSessionId;

  const baseSourceRefs = [`audit_log:${auditLog.id}`];
  if (resolvedFlowSessionId) baseSourceRefs.push(`flow_session:${resolvedFlowSessionId}`);
  if (revisionAfter !== undefined) baseSourceRefs.push(`flow_revision_number:${revisionAfter}`);
  baseSourceRefs.push(`process:${processId}`);

  evidences.push({
    id: buildEvidenceId('AUDIT_EVENT', `audit-${auditLog.id}`),
    type: 'AUDIT_EVENT',
    category: 'AUDIT_TRAIL',
    severity: 'INFO',
    status: 'INFO',
    title: `Evento auditado: ${actionType}`,
    summary: `Ação ${actionType} registrada em audit_logs para o processo ${processId}.`,
    processId,
    flowSessionId: resolvedFlowSessionId,
    revisionRef: revisionAfter,
    step,
    module,
    sourceRefs: baseSourceRefs,
    technicalBasis: ['audit_logs'],
    createdAt: auditLog.createdAt,
  });

  const isStaleStateSignal =
    normalizedAction.includes('STALE') ||
    normalizedAction.includes('TOKEN_MISMATCH') ||
    normalizedAction.includes('SECURITY_BLOCK') ||
    normalizedAction.includes('MISSING_TENANT_CONTEXT');

  if (isStaleStateSignal) {
    evidences.push({
      id: buildEvidenceId('SECURITY_ENFORCEMENT', `audit-${auditLog.id}`),
      type: 'SECURITY_ENFORCEMENT',
      category: 'SECURITY_GUARD',
      severity: 'CRITICAL',
      status: 'BLOCKED',
      title: 'Bloqueio de segurança aplicado',
      summary: `Evento ${actionType} indica enforcement de segurança com bloqueio de operação.`,
      processId,
      flowSessionId: resolvedFlowSessionId,
      revisionRef: revisionAfter,
      step,
      module: module ?? 'SECURITY_GUARD',
      sourceRefs: baseSourceRefs,
      technicalBasis: ['audit_logs'],
      createdAt: auditLog.createdAt,
    });
  }

  if (normalizedAction.includes('RLS') || normalizedAction.includes('TENANT_ISOLATION')) {
    evidences.push({
      id: buildEvidenceId('TENANT_ISOLATION_PROOF', `audit-${auditLog.id}`),
      type: 'TENANT_ISOLATION_PROOF',
      category: 'MULTI_TENANT_SECURITY',
      severity: 'CRITICAL',
      status: 'PASSED',
      title: 'Prova de isolamento de tenant registrada',
      summary: `Evento ${actionType} contém referência explícita a enforcement de isolamento multi-tenant.`,
      processId,
      flowSessionId: resolvedFlowSessionId,
      revisionRef: revisionAfter,
      step,
      module: module ?? 'RLS',
      sourceRefs: baseSourceRefs,
      technicalBasis: ['audit_logs'],
      createdAt: auditLog.createdAt,
    });
  }

  return evidences;
}

/**
 * Remove duplicações por id estável e mantém versão mais recente em caso de colisão.
 */
export function deduplicateEvidences(evidences: ComplianceEvidence[]): ComplianceEvidence[] {
  const byId = new Map<string, ComplianceEvidence>();
  for (const evidence of evidences) {
    const current = byId.get(evidence.id);
    if (!current || evidence.createdAt > current.createdAt) {
      byId.set(evidence.id, evidence);
    }
  }
  return [...byId.values()];
}
