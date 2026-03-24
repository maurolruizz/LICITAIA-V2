/**
 * ETAPA G — Fase Interna 3 — Pool PostgreSQL e helper de contexto RLS.
 *
 * Pool singleton configurado via DATABASE_URL.
 * O helper `withTenantContext` garante que toda query executada dentro
 * de um contexto autenticado respeite o isolamento RLS do tenant:
 *   BEGIN → SET LOCAL app.current_tenant_id → fn(client) → COMMIT/ROLLBACK.
 *
 * Regra absoluta: nenhuma query operacional pode rodar fora de withTenantContext
 * quando envolve tabelas protegidas por RLS (users, user_sessions,
 * process_executions, audit_logs, organ_configs).
 *
 * A tabela `tenants` não possui RLS — pode ser consultada diretamente via pool.
 */

import { Pool, PoolClient } from 'pg';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  process.stderr.write(`[DB] Erro inesperado no pool PostgreSQL: ${err.message}\n`);
});

/**
 * Executa `fn` dentro de uma transação com o contexto RLS do tenant definido.
 * SET LOCAL garante que app.current_tenant_id é revertido ao fim da transação,
 * devolvendo a conexão ao pool em estado limpo.
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
