import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import type { FlowSessionRecord, FlowSessionRevisionRecord } from './flow-session.types';

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapFlowSession(row: {
  id: string;
  tenant_id: string;
  process_id: string;
  snapshot: unknown;
  revision: number;
  render_token: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}): FlowSessionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    processId: row.process_id,
    snapshot: ensureObject(row.snapshot),
    revision: row.revision,
    renderToken: row.render_token,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findByProcessId(
  client: PoolClient,
  tenantId: string,
  processId: string,
): Promise<FlowSessionRecord | null> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    process_id: string;
    snapshot: unknown;
    revision: number;
    render_token: string;
    created_by: string | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, tenant_id, process_id, snapshot, revision, render_token, created_by, updated_by, created_at, updated_at
     FROM flow_sessions
     WHERE process_id = $1
       AND tenant_id = $2::uuid
     LIMIT 1`,
    [processId, tenantId],
  );
  return r.rows[0] ? mapFlowSession(r.rows[0]) : null;
}

export async function createInitial(
  client: PoolClient,
  data: {
    tenantId: string;
    processId: string;
    snapshot: Record<string, unknown>;
    revision: number;
    renderToken: string;
    actorUserId: string | null;
  },
): Promise<FlowSessionRecord> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    process_id: string;
    snapshot: unknown;
    revision: number;
    render_token: string;
    created_by: string | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `INSERT INTO flow_sessions
       (id, tenant_id, process_id, snapshot, revision, render_token, created_by, updated_by)
     VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, $5, $6, $7::uuid, $8::uuid)
     RETURNING id, tenant_id, process_id, snapshot, revision, render_token, created_by, updated_by, created_at, updated_at`,
    [
      randomUUID(),
      data.tenantId,
      data.processId,
      JSON.stringify(data.snapshot),
      data.revision,
      data.renderToken,
      data.actorUserId,
      data.actorUserId,
    ],
  );
  if (!r.rows[0]) {
    throw new Error('FLOW_SESSION_CREATE_FAILED');
  }
  return mapFlowSession(r.rows[0]);
}

export async function updateWithRevisionCheck(
  client: PoolClient,
  data: {
    id: string;
    tenantId: string;
    expectedRevision: number;
    expectedRenderToken: string;
    snapshot: Record<string, unknown>;
    revision: number;
    renderToken: string;
    actorUserId: string | null;
  },
): Promise<FlowSessionRecord | null> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    process_id: string;
    snapshot: unknown;
    revision: number;
    render_token: string;
    created_by: string | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `UPDATE flow_sessions
     SET snapshot = $1::jsonb,
         revision = $2,
         render_token = $3,
         updated_by = $4::uuid,
         updated_at = NOW()
     WHERE id = $5::uuid
       AND tenant_id = $6::uuid
       AND revision = $7
       AND render_token = $8
     RETURNING id, tenant_id, process_id, snapshot, revision, render_token, created_by, updated_by, created_at, updated_at`,
    [
      JSON.stringify(data.snapshot),
      data.revision,
      data.renderToken,
      data.actorUserId,
      data.id,
      data.tenantId,
      data.expectedRevision,
      data.expectedRenderToken,
    ],
  );
  return r.rows[0] ? mapFlowSession(r.rows[0]) : null;
}

export async function insertRevision(
  client: PoolClient,
  data: {
    tenantId: string;
    flowSessionId: string;
    processId: string;
    revision: number;
    renderToken: string;
    snapshot: Record<string, unknown>;
    action: string;
    actorUserId: string | null;
  },
): Promise<FlowSessionRevisionRecord> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    flow_session_id: string;
    process_id: string;
    revision: number;
    render_token: string;
    snapshot: unknown;
    action: string;
    actor_user_id: string | null;
    created_at: Date;
  }>(
    `INSERT INTO flow_session_revisions
       (id, tenant_id, flow_session_id, process_id, revision, render_token, snapshot, action, actor_user_id)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb, $8, $9::uuid)
     RETURNING id, tenant_id, flow_session_id, process_id, revision, render_token, snapshot, action, actor_user_id, created_at`,
    [
      randomUUID(),
      data.tenantId,
      data.flowSessionId,
      data.processId,
      data.revision,
      data.renderToken,
      JSON.stringify(data.snapshot),
      data.action,
      data.actorUserId,
    ],
  );
  if (!r.rows[0]) {
    throw new Error('FLOW_SESSION_REVISION_INSERT_FAILED');
  }
  const row = r.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    flowSessionId: row.flow_session_id,
    processId: row.process_id,
    revision: row.revision,
    renderToken: row.render_token,
    snapshot: ensureObject(row.snapshot),
    action: row.action,
    actorUserId: row.actor_user_id,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listRevisionsByProcessId(
  client: PoolClient,
  tenantId: string,
  processId: string,
): Promise<FlowSessionRevisionRecord[]> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    flow_session_id: string;
    process_id: string;
    revision: number;
    render_token: string;
    snapshot: unknown;
    action: string;
    actor_user_id: string | null;
    created_at: Date;
  }>(
    `SELECT id, tenant_id, flow_session_id, process_id, revision, render_token, snapshot, action, actor_user_id, created_at
     FROM flow_session_revisions
     WHERE tenant_id = $1::uuid
       AND process_id = $2
     ORDER BY revision ASC, created_at ASC`,
    [tenantId, processId],
  );

  return r.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    flowSessionId: row.flow_session_id,
    processId: row.process_id,
    revision: row.revision,
    renderToken: row.render_token,
    snapshot: ensureObject(row.snapshot),
    action: row.action,
    actorUserId: row.actor_user_id,
    createdAt: row.created_at.toISOString(),
  }));
}
