import { Pool } from 'pg';
import { config } from '../config/env';

function fail(message: string): never {
  throw new Error(`[FI8_RLS_HOSTILE_FAIL] ${message}`);
}

async function main(): Promise<void> {
  const processId = process.env['FI8_PROCESS_ID'] ?? '';
  const tenantA = process.env['FI8_TENANT_A'] ?? '';
  const tenantB = process.env['FI8_TENANT_B'] ?? '';

  if (!processId || !tenantA || !tenantB) {
    fail('Defina FI8_PROCESS_ID, FI8_TENANT_A e FI8_TENANT_B.');
  }
  if (tenantA === tenantB) {
    fail('FI8_TENANT_A e FI8_TENANT_B devem ser diferentes.');
  }

  const pool = new Pool({ connectionString: config.databaseUrl });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantA]);
    const selectA = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM flow_sessions WHERE process_id = $1`,
      [processId],
    );
    const visibleInA = Number(selectA.rows[0]?.c ?? '0');
    if (visibleInA < 1) {
      fail('Tenant A não enxerga o processo esperado.');
    }

    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantB]);
    const selectB = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM flow_sessions WHERE process_id = $1`,
      [processId],
    );
    const visibleInB = Number(selectB.rows[0]?.c ?? '0');
    if (visibleInB !== 0) {
      fail('Tenant B enxergou sessão de outro tenant.');
    }

    const updateB = await client.query(
      `UPDATE flow_sessions
       SET updated_at = NOW()
       WHERE process_id = $1`,
      [processId],
    );
    if ((updateB.rowCount ?? 0) !== 0) {
      fail('Tenant B conseguiu atualizar sessão de outro tenant.');
    }

    console.log('[FI8_RLS_HOSTILE_OK] Isolamento RLS confirmado (SELECT/UPDATE cruzado bloqueados).');
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
