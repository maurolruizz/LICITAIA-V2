import { runInTransaction } from '../database/transaction';
import { findById as findProcessById } from '../process/process.repository';
import { findByProcessId } from '../flow/flow-session.repository';
import type { ComplianceReport } from './compliance-report.types';
import { buildComplianceEvidences } from './compliance-evidence.service';
import { composeComplianceReport } from './compliance-report.mapper';

export type BuildComplianceReportParams = {
  tenantId: string;
  processId: string;
};

export class ComplianceReportBuildError extends Error {
  public readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(snapshot: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = snapshot[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

function hasTerminalFlowSignal(snapshot: Record<string, unknown>): boolean {
  const status = pickString(snapshot, ['finalStatus', 'status', 'reviewStatus'])?.toUpperCase();
  if (status === 'SUCCESS' || status === 'APPROVED' || status === 'COMPLETED') return true;
  const step = pickString(snapshot, ['currentStep', 'currentStepId', 'step', 'stepId'])?.toUpperCase();
  if (step && (step.includes('REVIEW_COMPLETED') || step.includes('DONE') || step.includes('COMPLETED'))) return true;
  return false;
}

/**
 * Constrói o artefato ComplianceReport a partir de fontes canônicas e evidências normalizadas.
 * Não expõe endpoint e não aplica lógica visual.
 */
export async function buildComplianceReport(
  params: BuildComplianceReportParams,
): Promise<ComplianceReport> {
  const { tenantId, processId } = params;

  const [process, flowSession, evidences] = await Promise.all([
    runInTransaction(tenantId, async (client) => findProcessById(client, tenantId, processId)),
    runInTransaction(tenantId, async (client) => findByProcessId(client, tenantId, processId)),
    buildComplianceEvidences({ tenantId, processId }),
  ]);

  if (!process) {
    throw new ComplianceReportBuildError(
      'PROCESS_NOT_FOUND',
      `Processo ${processId} não encontrado para o tenant informado.`,
    );
  }

  if (!flowSession) {
    throw new ComplianceReportBuildError(
      'FLOW_SESSION_NOT_FOUND',
      `Flow session não encontrada para o processo ${processId}.`,
    );
  }

  return composeComplianceReport({
    processId,
    tenantId,
    generatedAt: new Date().toISOString(),
    evidences,
    flowContext: {
      currentRevision: flowSession.revision,
      currentStep: pickString(ensureObject(flowSession.snapshot), ['currentStep', 'currentStepId', 'step', 'stepId']),
      hasTerminalSignal: hasTerminalFlowSignal(ensureObject(flowSession.snapshot)),
    },
  });
}
