import type { PoolClient } from 'pg';
import type { ProcessRecord } from './process.types';

function mapProcessRow(row: {
  id: string;
  tenant_id: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}): ProcessRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findById(
  client: PoolClient,
  tenantId: string,
  id: string,
): Promise<ProcessRecord | null> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, tenant_id, created_by, created_at, updated_at
     FROM processes
     WHERE id = $1
       AND tenant_id = $2::uuid
     LIMIT 1`,
    [id, tenantId],
  );
  return r.rows[0] ? mapProcessRow(r.rows[0]) : null;
}

export async function create(
  client: PoolClient,
  data: { id: string; tenantId: string; createdBy: string | null },
): Promise<ProcessRecord> {
  const r = await client.query<{
    id: string;
    tenant_id: string;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `INSERT INTO processes (id, tenant_id, created_by)
     VALUES ($1, $2::uuid, $3::uuid)
     RETURNING id, tenant_id, created_by, created_at, updated_at`,
    [data.id, data.tenantId, data.createdBy],
  );
  if (!r.rows[0]) {
    throw new Error('PROCESS_CREATE_FAILED');
  }
  return mapProcessRow(r.rows[0]);
}
