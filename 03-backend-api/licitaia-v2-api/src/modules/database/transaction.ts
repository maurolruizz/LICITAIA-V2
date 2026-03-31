import type { PoolClient } from 'pg';
import { withTenantContext } from '../../lib/db';

export async function runInTransaction<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return await withTenantContext(tenantId, fn);
}
