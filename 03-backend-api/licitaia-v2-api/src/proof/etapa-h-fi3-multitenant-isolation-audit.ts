import 'dotenv/config';
import { Client } from 'pg';

const API_BASE_URL =
  process.env['API_BASE_URL'] || process.env['PROOF_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL =
  process.env['DATABASE_URL'] || 'postgresql://licitaia_app:licitaia_app@localhost:5432/licitaia_dev';

const TENANT_A = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'prefeitura-exemplo',
  adminEmail: 'admin@exemplo.gov.br',
  password: 'SenhaTeste@123',
};

const TENANT_B = {
  id: '00000000-0000-0000-0000-000000000002',
  slug: 'orgao-isolamento-b',
  adminEmail: 'admin-b@exemplo.gov.br',
  password: 'SenhaTeste@123',
};

type HttpResult = { status: number; body: any; text: string };

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResult> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { status: res.status, body: parsed, text };
}

async function loginAdmin(
  tenantSlug: string,
  email: string,
  password: string,
): Promise<{ accessToken: string } | null> {
  const r = await httpRequest('POST', '/api/auth/login', { tenantSlug, email, password });
  const token = r.body?.data?.accessToken;
  if (r.status !== 200 || !token) return null;
  return { accessToken: token };
}

async function validateDatabaseSecurityPosture(): Promise<{
  roleOk: boolean;
  currentUser: string | null;
  forceRlsByTable: Record<string, boolean>;
}> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const role = await client.query<{
      current_user: string;
      rolsuper: boolean;
      rolbypassrls: boolean;
    }>(
      `SELECT
         current_user::text AS current_user,
         r.rolsuper,
         r.rolbypassrls
       FROM pg_roles r
       WHERE r.rolname = current_user::text`,
    );

    const roleRow = role.rows[0];
    const currentUser = roleRow?.current_user ?? null;
    const roleOk =
      !!roleRow &&
      roleRow.current_user === 'licitaia_app' &&
      roleRow.rolsuper === false &&
      roleRow.rolbypassrls === false;

    const force = await client.query<{ relname: string; relforcerowsecurity: boolean }>(
      `SELECT relname, relforcerowsecurity
       FROM pg_class
       WHERE relname = ANY($1::text[])`,
      [['users', 'user_sessions', 'process_executions', 'audit_logs', 'organ_configs']],
    );

    const forceByTable: Record<string, boolean> = {
      users: false,
      user_sessions: false,
      process_executions: false,
      audit_logs: false,
      organ_configs: false,
    };
    for (const row of force.rows) forceByTable[row.relname] = row.relforcerowsecurity;

    return { roleOk, currentUser, forceRlsByTable: forceByTable };
  } finally {
    await client.end();
  }
}

async function queryTenantScopedCount(
  tenantId: string,
  sql: string,
  values: unknown[] = [],
): Promise<number> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenantId]);
    const r = await client.query<{ c: string }>(sql, values);
    return Number(r.rows[0]?.c ?? '0');
  } finally {
    await client.end();
  }
}

async function tryHostileCrossTenantInsert(actorTenantId: string, targetTenantId: string): Promise<boolean> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [actorTenantId]);
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1::uuid, NULL, 'HOSTILE_CROSS_WRITE_ATTEMPT', 'test', 'x', '{"source":"h-fi3"}'::jsonb)`,
      [targetTenantId],
    );
    return false;
  } catch {
    return true;
  } finally {
    await client.end();
  }
}

async function run(): Promise<void> {
  console.log('=== ETAPA H — H-FI3 — AUDITORIA HOSTIL MULTI-TENANT ===');

  const health = await httpRequest('GET', '/health');

  const adminA = await loginAdmin(TENANT_A.slug, TENANT_A.adminEmail, TENANT_A.password);
  const adminB = await loginAdmin(TENANT_B.slug, TENANT_B.adminEmail, TENANT_B.password);
  if (!adminA || !adminB) {
    throw new Error('Falha de login em adminA ou adminB.');
  }

  const getSettingsA = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${adminA.accessToken}`,
  });
  const getSettingsB = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${adminB.accessToken}`,
  });

  const tenantAOrgName = `H-FI3-A-${Date.now()}`;
  const tenantBOrgName = `H-FI3-B-${Date.now()}`;

  const patchSettingsA = await httpRequest(
    'PATCH',
    '/api/institutional-settings',
    {
      organizationName: tenantAOrgName,
      organizationLegalName: 'Tenant A H-FI3',
      documentNumber: '00.000.000/0001-03',
      defaultTimezone: 'America/Sao_Paulo',
      defaultLocale: 'pt-BR',
    },
    { Authorization: `Bearer ${adminA.accessToken}` },
  );
  const patchSettingsB = await httpRequest(
    'PATCH',
    '/api/institutional-settings',
    {
      organizationName: tenantBOrgName,
      organizationLegalName: 'Tenant B H-FI3',
      documentNumber: '11.111.111/0001-03',
      defaultTimezone: 'America/Manaus',
      defaultLocale: 'pt-BR',
    },
    { Authorization: `Bearer ${adminB.accessToken}` },
  );

  const guidance = await httpRequest('GET', '/api/process/guidance-options');
  if (guidance.status !== 200 || !guidance.body?.data) {
    throw new Error('guidance-options indisponível para construir payload válido.');
  }
  const g = guidance.body.data;
  const payloadBase = {
    legalRegime: g.legalRegime[0],
    objectType: g.objectType[0],
    objectStructure: g.objectStructure[0],
    executionForm: g.executionForm[0],
    needJustification: 'H-FI3 isolamento',
  };

  const runA = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: { ...payloadBase, processId: `H-FI3-A-${Date.now()}` } },
    { Authorization: `Bearer ${adminA.accessToken}` },
  );
  const runB = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: { ...payloadBase, processId: `H-FI3-B-${Date.now()}` } },
    { Authorization: `Bearer ${adminB.accessToken}` },
  );

  const histA = await httpRequest('GET', '/api/process-executions', undefined, {
    Authorization: `Bearer ${adminA.accessToken}`,
  });
  const histB = await httpRequest('GET', '/api/process-executions', undefined, {
    Authorization: `Bearer ${adminB.accessToken}`,
  });

  const securityPosture = await validateDatabaseSecurityPosture();

  const dbViewAUsers = await queryTenantScopedCount(
    TENANT_A.id,
    `SELECT COUNT(*)::text AS c FROM users WHERE tenant_id = $1::uuid`,
    [TENANT_B.id],
  );
  const dbViewAExec = await queryTenantScopedCount(
    TENANT_A.id,
    `SELECT COUNT(*)::text AS c FROM process_executions WHERE tenant_id = $1::uuid`,
    [TENANT_B.id],
  );
  const dbViewAAudit = await queryTenantScopedCount(
    TENANT_A.id,
    `SELECT COUNT(*)::text AS c FROM audit_logs WHERE tenant_id = $1::uuid`,
    [TENANT_B.id],
  );
  const dbViewASettings = await queryTenantScopedCount(
    TENANT_A.id,
    `SELECT COUNT(*)::text AS c FROM organ_configs WHERE tenant_id = $1::uuid`,
    [TENANT_B.id],
  );

  const hostileCrossWriteBlocked = await tryHostileCrossTenantInsert(TENANT_A.id, TENANT_B.id);

  const histAIds = new Set<string>((histA.body?.data ?? []).map((e: any) => e.id));
  const histBIds = new Set<string>((histB.body?.data ?? []).map((e: any) => e.id));
  let overlapCount = 0;
  for (const id of histAIds) if (histBIds.has(id)) overlapCount += 1;

  const checks = {
    env_backend_health_200: health.status === 200,
    c1_tenantA_reads_own_settings: getSettingsA.status === 200,
    c2_tenantB_reads_own_settings: getSettingsB.status === 200,
    c3_tenantA_writes_own_settings: patchSettingsA.status === 200,
    c4_tenantB_writes_own_settings: patchSettingsB.status === 200,
    c5_tenantA_executes_process: runA.status !== 401 && runA.status !== 403,
    c6_tenantB_executes_process: runB.status !== 401 && runB.status !== 403,
    c7_history_no_cross_tenant_overlap: histA.status === 200 && histB.status === 200 && overlapCount === 0,
    c8_hostile_cross_reads_blocked_by_rls:
      dbViewAUsers === 0 && dbViewAExec === 0 && dbViewAAudit === 0 && dbViewASettings === 0,
    c9_hostile_cross_write_blocked_by_rls: hostileCrossWriteBlocked,
    c10_rls_security_posture_hardened:
      securityPosture.roleOk &&
      securityPosture.forceRlsByTable['users'] &&
      securityPosture.forceRlsByTable['user_sessions'] &&
      securityPosture.forceRlsByTable['process_executions'] &&
      securityPosture.forceRlsByTable['audit_logs'] &&
      securityPosture.forceRlsByTable['organ_configs'],
  };

  console.log(
    JSON.stringify(
      {
        checks,
        evidence: {
          apiStatus: {
            health: health.status,
            getSettingsA: getSettingsA.status,
            getSettingsB: getSettingsB.status,
            patchSettingsA: patchSettingsA.status,
            patchSettingsB: patchSettingsB.status,
            runA: runA.status,
            runB: runB.status,
            histA: histA.status,
            histB: histB.status,
            historyOverlapCount: overlapCount,
          },
          hostileReadCountsFromTenantAContext: {
            usersFromTenantB: dbViewAUsers,
            processExecutionsFromTenantB: dbViewAExec,
            auditLogsFromTenantB: dbViewAAudit,
            settingsFromTenantB: dbViewASettings,
          },
          securityPosture,
          hostileCrossWriteBlocked,
        },
      },
      null,
      2,
    ),
  );

  if (!Object.values(checks).every(Boolean)) process.exit(1);
  process.exit(0);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
