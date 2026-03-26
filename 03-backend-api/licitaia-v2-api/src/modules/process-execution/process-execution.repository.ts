/**
 * ETAPA G — Fase Interna 5 — Repositório de execuções persistidas (PostgreSQL).
 *
 * Fonte de verdade: tabela `process_executions` (RLS ativo).
 * Regra: todas as queries devem ser executadas dentro de `withTenantContext`,
 * pois o isolamento é aplicado via `app.current_tenant_id`.
 */

import type { PoolClient } from 'pg';
import type { ProcessExecution } from './process-execution.entity';
import type { ProcessExecutionSummary } from './process-execution.entity';

interface InsertProcessExecutionInput {
  id: string;
  tenantId: string;
  executedBy: string;
  requestPayload: Record<string, unknown>;
  response: Record<string, unknown>;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  httpStatus: number;
  modulesExecuted: string[];
  validationCodes: string[];
}

export async function insertProcessExecution(
  client: PoolClient,
  data: InsertProcessExecutionInput,
): Promise<ProcessExecution> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    executed_by: string;
    request_payload: unknown;
    response: unknown;
    final_status: string;
    halted: boolean;
    halted_by: string | null;
    http_status: number;
    modules_executed: string[] | null;
    validation_codes: string[] | null;
    created_at: Date;
  }>(
    `INSERT INTO process_executions
       (id, tenant_id, executed_by, request_payload, response, final_status, halted, halted_by, http_status, modules_executed, validation_codes)
     VALUES
       ($1, $2::uuid, $3::uuid, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11)
     RETURNING
       id, tenant_id, executed_by, request_payload, response, final_status, halted, halted_by, http_status, modules_executed, validation_codes, created_at`,
    [
      data.id,
      data.tenantId,
      data.executedBy,
      JSON.stringify(data.requestPayload ?? {}),
      JSON.stringify(data.response ?? {}),
      data.finalStatus,
      data.halted,
      data.haltedBy ?? null,
      data.httpStatus,
      data.modulesExecuted ?? [],
      data.validationCodes ?? [],
    ],
  );

  const row = r.rows[0];
  if (!row) {
    throw new Error('Falha ao inserir process_execution: RETURNING vazio.');
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    executedBy: row.executed_by,
    createdAt: row.created_at.toISOString(),
    requestPayload:
      row.request_payload !== null &&
      typeof row.request_payload === 'object' &&
      !Array.isArray(row.request_payload)
        ? (row.request_payload as Record<string, unknown>)
        : {},
    response:
      row.response !== null && typeof row.response === 'object' && !Array.isArray(row.response)
        ? (row.response as Record<string, unknown>)
        : {},
    finalStatus: row.final_status,
    halted: row.halted,
    ...(row.halted_by ? { haltedBy: row.halted_by } : {}),
    httpStatus: row.http_status,
    modulesExecuted: Array.isArray(row.modules_executed) ? row.modules_executed : [],
    validationCodes: Array.isArray(row.validation_codes) ? row.validation_codes : [],
  };
}

export async function listProcessExecutions(
  client: PoolClient,
  limit: number,
): Promise<ProcessExecutionSummary[]> {
  const r = await client.query<{
    id: string;
    executed_by: string;
    created_at: Date;
    request_payload: unknown;
    final_status: string;
    halted: boolean;
    halted_by: string | null;
    http_status: number;
    modules_executed: string[] | null;
    validation_codes: string[] | null;
  }>(
    `SELECT
       id,
       executed_by,
       created_at,
       request_payload,
       final_status,
       halted,
       halted_by,
       http_status,
       modules_executed,
       validation_codes
     FROM process_executions
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );

  return r.rows.map((row) => {
    const rp =
      row.request_payload !== null &&
      typeof row.request_payload === 'object' &&
      !Array.isArray(row.request_payload)
        ? (row.request_payload as Record<string, unknown>)
        : {};
    const processId = typeof rp['processId'] === 'string' ? rp['processId'] : undefined;
    const summary: ProcessExecutionSummary = {
      id: row.id,
      executedBy: row.executed_by,
      createdAt: row.created_at.toISOString(),
      processId,
      finalStatus: row.final_status,
      halted: row.halted,
      httpStatus: row.http_status,
      validationCodesCount: Array.isArray(row.validation_codes)
        ? row.validation_codes.length
        : 0,
      modulesExecuted: Array.isArray(row.modules_executed) ? row.modules_executed : [],
    };
    if (row.halted_by) summary.haltedBy = row.halted_by;
    return summary;
  });
}

export async function findProcessExecutionById(
  client: PoolClient,
  id: string,
): Promise<ProcessExecution | null> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    executed_by: string;
    created_at: Date;
    request_payload: unknown;
    response: unknown;
    final_status: string;
    halted: boolean;
    halted_by: string | null;
    http_status: number;
    modules_executed: string[] | null;
    validation_codes: string[] | null;
  }>(
    `SELECT
       id,
       tenant_id,
       executed_by,
       created_at,
       request_payload,
       response,
       final_status,
       halted,
       halted_by,
       http_status,
       modules_executed,
       validation_codes
     FROM process_executions
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  const row = r.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    executedBy: row.executed_by,
    createdAt: row.created_at.toISOString(),
    requestPayload:
      row.request_payload !== null &&
      typeof row.request_payload === 'object' &&
      !Array.isArray(row.request_payload)
        ? (row.request_payload as Record<string, unknown>)
        : {},
    response:
      row.response !== null && typeof row.response === 'object' && !Array.isArray(row.response)
        ? (row.response as Record<string, unknown>)
        : {},
    finalStatus: row.final_status,
    halted: row.halted,
    ...(row.halted_by ? { haltedBy: row.halted_by } : {}),
    httpStatus: row.http_status,
    modulesExecuted: Array.isArray(row.modules_executed) ? row.modules_executed : [],
    validationCodes: Array.isArray(row.validation_codes) ? row.validation_codes : [],
  };
}
