import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { config } from '../config/env';
import { withTenantContext } from '../lib/db';

function fail(message: string): never {
  throw new Error(`[ETAPA_B_FORCE_RLS_FAIL] ${message}`);
}

type CatalogRow = {
  relname: string;
  relrowsecurity: boolean;
  relforcerowsecurity: boolean;
};

async function assertForceRlsCatalog(pool: Pool): Promise<void> {
  const tables = ['processes', 'flow_sessions', 'flow_session_revisions'];
  const r = await pool.query<CatalogRow>(
    `SELECT relname, relrowsecurity, relforcerowsecurity
     FROM pg_class
     WHERE relname = ANY($1::text[])
       AND relkind = 'r'
     ORDER BY relname ASC`,
    [tables],
  );
  if (r.rows.length !== 3) {
    fail('Nem todas as tabelas alvo foram encontradas no catálogo do PostgreSQL.');
  }
  for (const row of r.rows) {
    if (!row.relrowsecurity) {
      fail(`RLS não está ativo em '${row.relname}'.`);
    }
    if (!row.relforcerowsecurity) {
      fail(`FORCE RLS não está ativo em '${row.relname}'.`);
    }
  }
}

async function main(): Promise<void> {
  const tenantA = process.env['ETAPA_B_TENANT_A'] ?? '';
  const tenantB = process.env['ETAPA_B_TENANT_B'] ?? '';
  const processId = process.env['ETAPA_B_PROCESS_ID'] ?? `etapa-b-force-rls-${Date.now()}`;

  if (!tenantA || !tenantB) {
    fail('Defina ETAPA_B_TENANT_A e ETAPA_B_TENANT_B com UUIDs válidos e distintos.');
  }
  if (tenantA === tenantB) {
    fail('ETAPA_B_TENANT_A e ETAPA_B_TENANT_B devem ser diferentes.');
  }

  const pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await assertForceRlsCatalog(pool);

    await withTenantContext(tenantA, async (client) => {
      await client.query(
        `INSERT INTO processes (id, tenant_id, created_by)
         VALUES ($1, $2::uuid, NULL)
         ON CONFLICT (id) DO NOTHING`,
        [processId, tenantA],
      );

      const sessionIdRow = await client.query<{ id: string }>(
        `SELECT id
         FROM flow_sessions
         WHERE tenant_id = $1::uuid
           AND process_id = $2
         LIMIT 1`,
        [tenantA, processId],
      );

      let sessionId = sessionIdRow.rows[0]?.id ?? null;
      if (!sessionId) {
        const createdSession = await client.query<{ id: string }>(
          `INSERT INTO flow_sessions
             (id, tenant_id, process_id, snapshot, revision, render_token, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3, '{}'::jsonb, 1, 'etapa-b-token-a', NULL, NULL)
           RETURNING id`,
          [randomUUID(), tenantA, processId],
        );
        sessionId = createdSession.rows[0]?.id ?? null;
      }
      if (!sessionId) {
        fail('Falha ao garantir flow_session base para tenant A.');
      }

      await client.query(
        `INSERT INTO flow_session_revisions
           (id, tenant_id, flow_session_id, process_id, revision, render_token, snapshot, action, actor_user_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 1, 'etapa-b-token-a', '{}'::jsonb, 'ETAPA_B_ASSERT', NULL)
         ON CONFLICT DO NOTHING`,
        [randomUUID(), tenantA, sessionId, processId],
      );
    });

    const visibleToA = await withTenantContext(tenantA, async (client) => {
      const r = await client.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c
         FROM flow_sessions
         WHERE process_id = $1`,
        [processId],
      );
      return Number(r.rows[0]?.c ?? '0');
    });
    if (visibleToA < 1) {
      fail('Tenant A não enxerga os próprios dados.');
    }

    const visibleToB = await withTenantContext(tenantB, async (client) => {
      const r = await client.query<{ c: string }>(
        `SELECT COUNT(*)::text AS c
         FROM flow_sessions
         WHERE process_id = $1`,
        [processId],
      );
      return Number(r.rows[0]?.c ?? '0');
    });
    if (visibleToB !== 0) {
      fail('Tenant B enxergou dados do tenant A.');
    }

    const crossUpdate = await withTenantContext(tenantB, async (client) => {
      const r = await client.query(
        `UPDATE flow_sessions
         SET updated_at = NOW()
         WHERE process_id = $1`,
        [processId],
      );
      return r.rowCount ?? 0;
    });
    if (crossUpdate !== 0) {
      fail('Tenant B conseguiu atualizar dado do tenant A.');
    }

    const crossDelete = await withTenantContext(tenantB, async (client) => {
      const r = await client.query(
        `DELETE FROM flow_sessions
         WHERE process_id = $1`,
        [processId],
      );
      return r.rowCount ?? 0;
    });
    if (crossDelete !== 0) {
      fail('Tenant B conseguiu excluir dado do tenant A.');
    }

    // Sem contexto de tenant, o filtro de policy deve negar acesso amplo.
    const noContextRead = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM flow_sessions
       WHERE process_id = $1`,
      [processId],
    );
    if (Number(noContextRead.rows[0]?.c ?? '0') !== 0) {
      fail('Sem tenant context houve visibilidade indevida.');
    }

    console.log('[ETAPA_B_FORCE_RLS_OK] FORCE RLS ativo e isolamento multi-tenant comprovado.');
    console.log(`[ETAPA_B_FORCE_RLS_EVIDENCE] process_id=${processId}`);
  } finally {
    await pool.end();
  }
}

void main();
