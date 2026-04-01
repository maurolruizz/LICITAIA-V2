import { runInTransaction } from '../database/transaction';
import { findById as findProcessById } from '../process/process.repository';
import { findByProcessId, listRevisionsByProcessId } from '../flow/flow-session.repository';
import type { ComplianceEvidence } from './compliance-report.types';
import {
  deduplicateEvidences,
  mapAuditLogToEvidences,
  mapFlowSessionToEvidence,
  mapProcessToEvidence,
  mapRevisionToEvidences,
  type ProcessAuditLogRecord,
} from './compliance-evidence.mapper';

export type BuildComplianceEvidencesParams = {
  tenantId: string;
  processId: string;
};

type AuditLogRow = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: unknown;
  created_at: Date;
};

function ensureObjectOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function mapAuditLogRow(row: AuditLogRow): ProcessAuditLogRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    metadata: ensureObjectOrNull(row.metadata),
    createdAt: row.created_at.toISOString(),
  };
}

async function listAuditLogsByProcess(
  tenantId: string,
  processId: string,
): Promise<ProcessAuditLogRecord[]> {
  return await runInTransaction(tenantId, async (client) => {
    const query = await client.query<AuditLogRow>(
      `SELECT id, tenant_id, user_id, action, resource_type, resource_id, metadata, created_at
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND (
              resource_id = $2
              OR metadata->>'process_id' = $2
              OR metadata->>'processId' = $2
         )
       ORDER BY created_at ASC`,
      [tenantId, processId],
    );
    return query.rows.map(mapAuditLogRow);
  });
}

/**
 * Agrega fatos canônicos do processo e normaliza em evidências de conformidade.
 * Não calcula score e não monta relatório final.
 */
export async function buildComplianceEvidences(
  params: BuildComplianceEvidencesParams,
): Promise<ComplianceEvidence[]> {
  const { tenantId, processId } = params;

  const [process, flowSession, revisions, auditLogs] = await Promise.all([
    runInTransaction(tenantId, async (client) => findProcessById(client, tenantId, processId)),
    runInTransaction(tenantId, async (client) => findByProcessId(client, tenantId, processId)),
    runInTransaction(tenantId, async (client) => listRevisionsByProcessId(client, tenantId, processId)),
    listAuditLogsByProcess(tenantId, processId),
  ]);

  if (!process) {
    return [];
  }

  const candidates: ComplianceEvidence[] = [];

  candidates.push(mapProcessToEvidence(process));

  if (flowSession) {
    candidates.push(mapFlowSessionToEvidence(flowSession));
  }

  for (const revision of revisions) {
    candidates.push(...mapRevisionToEvidences(revision));
  }

  for (const auditLog of auditLogs) {
    candidates.push(...mapAuditLogToEvidences(auditLog, processId, flowSession?.id));
  }

  const normalized = candidates.filter(
    (evidence) => evidence.sourceRefs.length > 0 && evidence.processId === processId,
  );

  const deduplicated = deduplicateEvidences(normalized);
  deduplicated.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return deduplicated;
}
