import type { PoolClient } from 'pg';
import type { AuditLogInput } from './audit.types';

export async function insertLog(client: PoolClient, data: AuditLogInput): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs
       (tenant_id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
    [
      data.tenantId,
      data.userId,
      data.action,
      data.resourceType,
      data.resourceId,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress,
      data.userAgent,
    ],
  );
}
