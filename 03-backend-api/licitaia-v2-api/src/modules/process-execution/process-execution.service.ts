/**
 * FASE 40 — Serviço de execuções persistidas.
 * FASE 42 — Blindagem: derivação centralizada e defensiva do summary operacional.
 *
 * Camada de negócio entre controller e repositório.
 * Responsável por: gerar ID único, montar a entidade, delegar ao repositório,
 * e derivar deterministicamente o summary a partir da entidade normalizada.
 */

import { randomUUID } from 'crypto';
import type { ProcessExecution, ProcessExecutionSummary } from './process-execution.entity';
import {
  insertProcessExecution,
  listProcessExecutions,
  findProcessExecutionById,
} from './process-execution.repository';
import { withTenantContext } from '../../lib/db';
import { insertAuditLog } from '../auth/auth.repository';

export interface SaveExecutionParams {
  tenantId: string;
  executedBy: string;
  requestPayload: Record<string, unknown>;
  response: Record<string, unknown>;
  processId: string;
  correlationId?: string;
  requestId?: string;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  httpStatus: number;
  modulesExecuted: string[];
  validationCodes: string[];
  eventsCount: number;
  decisionMetadataCount: number;
  audit: {
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
  };
}

export async function saveExecution(params: SaveExecutionParams): Promise<ProcessExecution> {
  const executionId = randomUUID();
  return await withTenantContext(params.tenantId, async (client) => {
    const execution = await insertProcessExecution(client, {
      id: executionId,
      tenantId: params.tenantId,
      executedBy: params.executedBy,
      requestPayload: params.requestPayload,
      response: params.response,
      finalStatus: params.finalStatus,
      halted: params.halted,
      ...(params.haltedBy !== undefined ? { haltedBy: params.haltedBy } : {}),
      httpStatus: params.httpStatus,
      modulesExecuted: params.modulesExecuted,
      validationCodes: params.validationCodes,
    });

    // Auditoria operacional da execução (append-only).
    await insertAuditLog(client, {
      tenantId: params.tenantId,
      userId: params.audit.userId,
      action: 'PROCESS_EXECUTION',
      resourceType: 'process_execution',
      resourceId: execution.id,
      metadata: {
        executionId: execution.id,
        tenantId: params.tenantId,
        userId: params.audit.userId,
        processId: params.processId,
        correlationId: params.correlationId ?? null,
        requestId: params.requestId ?? null,
        finalStatus: execution.finalStatus,
        halted: execution.halted,
        haltedBy: execution.haltedBy ?? null,
        httpStatus: execution.httpStatus,
        modulesExecuted: params.modulesExecuted,
        validationCodes: params.validationCodes,
        eventsCount: params.eventsCount,
        decisionMetadataCount: params.decisionMetadataCount,
      },
      ipAddress: params.audit.ipAddress,
      userAgent: params.audit.userAgent,
    });

    return execution;
  });
}

/**
 * FASE 42 — Derivação centralizada e determinística do summary operacional.
 *
 * Todo campo do summary é derivado exclusivamente a partir da entidade
 * normalizada. O frontend não precisa interpretar nem inferir nada.
 * A presença de `haltedBy` é propagada apenas quando o campo existe,
 * evitando que o summary carregue chaves com valor undefined.
 */
export function buildExecutionSummary(e: ProcessExecution): ProcessExecutionSummary {
  const summary: ProcessExecutionSummary = {
    id:                  e.id,
    executedBy:          e.executedBy,
    createdAt:           e.createdAt,
    processId:           typeof e.requestPayload['processId'] === 'string'
                           ? (e.requestPayload['processId'] as string)
                           : undefined,
    finalStatus:         e.finalStatus,
    halted:              e.halted,
    httpStatus:          e.httpStatus,
    validationCodesCount: e.validationCodes.length,
    modulesExecuted:     e.modulesExecuted,
  };
  if (e.haltedBy !== undefined) {
    summary.haltedBy = e.haltedBy;
  }
  return summary;
}

export async function listExecutions(params: {
  tenantId: string;
  limit?: number;
}): Promise<ProcessExecutionSummary[]> {
  const limit =
    typeof params.limit === 'number' && params.limit > 0 ? Math.min(params.limit, 200) : 50;
  return await withTenantContext(params.tenantId, (client) =>
    listProcessExecutions(client, params.tenantId, limit),
  );
}

export async function getExecutionById(params: {
  tenantId: string;
  id: string;
}): Promise<ProcessExecution | null> {
  return await withTenantContext(params.tenantId, (client) =>
    findProcessExecutionById(client, params.tenantId, params.id),
  );
}
