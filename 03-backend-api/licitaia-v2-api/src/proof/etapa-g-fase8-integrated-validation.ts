import 'dotenv/config';
import { spawn } from 'child_process';
import { Client } from 'pg';

const FRONTEND_BASE_URL = process.env['FRONTEND_BASE_URL'] || 'http://localhost:3000';
const API_BASE_URL = process.env['API_BASE_URL'] || process.env['PROOF_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL = process.env['DATABASE_URL'] || 'postgresql://licitaia_app:licitaia_app@localhost:5432/licitaia_dev';

const TENANT_A = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'prefeitura-exemplo',
  adminEmail: 'admin@exemplo.gov.br',
  userEmail: 'operador@exemplo.gov.br',
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
  baseUrl: string = API_BASE_URL,
): Promise<HttpResult> {
  const res = await fetch(`${baseUrl}${path}`, {
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

async function login(tenantSlug: string, email: string, password: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const r = await httpRequest('POST', '/api/auth/login', { tenantSlug, email, password });
  const data = r.body?.data;
  if (r.status !== 200 || !data?.accessToken || !data?.refreshToken) return null;
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

async function validateRlsRole(): Promise<{ ok: boolean; currentUser: string | null }> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const role = await client.query<{ current_user: string; rolsuper: boolean; rolbypassrls: boolean }>(
      `SELECT
         current_user::text AS current_user,
         r.rolsuper,
         r.rolbypassrls
       FROM pg_roles r
       WHERE r.rolname = current_user::text`,
    );
    const row = role.rows[0];
    if (!row) return { ok: false, currentUser: null };
    return {
      ok: row.current_user === 'licitaia_app' && row.rolsuper === false && row.rolbypassrls === false,
      currentUser: row.current_user,
    };
  } finally {
    await client.end();
  }
}

async function dbTenantEvidence(params: {
  tenantId: string;
  expectedOrgName: string;
  expectedExecutedBy: string;
}): Promise<{
  organConfigUpdated: boolean;
  hasInstitutionalAudit: boolean;
  hasProcessExecution: boolean;
  hasProcessAudit: boolean;
}> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [params.tenantId]);

    const cfg = await client.query<{ organization_name: string | null }>(
      `SELECT organization_name
       FROM organ_configs
       WHERE tenant_id = $1::uuid`,
      [params.tenantId],
    );

    const instAudit = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'INSTITUTIONAL_SETTINGS_UPDATED'`,
      [params.tenantId],
    );

    const execs = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM process_executions
       WHERE tenant_id = $1::uuid
         AND executed_by = $2::uuid`,
      [params.tenantId, params.expectedExecutedBy],
    );

    const execAudit = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'PROCESS_EXECUTION'`,
      [params.tenantId],
    );

    return {
      organConfigUpdated: cfg.rows[0]?.organization_name === params.expectedOrgName,
      hasInstitutionalAudit: Number(instAudit.rows[0]?.c || '0') > 0,
      hasProcessExecution: Number(execs.rows[0]?.c || '0') > 0,
      hasProcessAudit: Number(execAudit.rows[0]?.c || '0') > 0,
    };
  } finally {
    await client.end();
  }
}

function runProofCommand(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<boolean> {
  return new Promise((resolve) => {
    const executable = process.platform === 'win32' && command === 'npx' ? 'npx.cmd' : command;
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env,
    });
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function runRegressionSuite(): Promise<Record<string, boolean>> {
  const baseEnv = {
    ...process.env,
    API_BASE_URL: API_BASE_URL,
    PROOF_BASE_URL: API_BASE_URL,
    DATABASE_URL: DATABASE_URL,
  };
  return {
    FI3_auth: await runProofCommand('npx', ['ts-node', 'src/proof/etapa-g-fase3-auth-validation.ts'], baseEnv),
    FI4_rbac: await runProofCommand('npx', ['ts-node', 'src/proof/etapa-g-fase4-rbac-validation.ts'], baseEnv),
    FI5_execution_audit: await runProofCommand('node', ['src/proof/etapa-g-fase5-process-execution-auditlog-validation.js'], baseEnv),
    FI6_institutional: await runProofCommand('npx', ['ts-node', 'src/proof/etapa-g-fase6-institutional-settings-validation.ts'], baseEnv),
    FI7_frontend_admin: await runProofCommand('npx', ['ts-node', 'src/proof/etapa-g-fase7-frontend-admin-validation.ts'], baseEnv),
  };
}

async function run(): Promise<void> {
  console.log('=== ETAPA G — FASE INTERNA 8 — PROVA INTEGRADA FINAL ===');

  const frontendPing = await httpRequest('GET', '/', undefined, {}, FRONTEND_BASE_URL);
  const backendHealth = await httpRequest('GET', '/health');
  const rlsRole = await validateRlsRole();

  const adminA = await login(TENANT_A.slug, TENANT_A.adminEmail, TENANT_A.password);
  const userA = await login(TENANT_A.slug, TENANT_A.userEmail, TENANT_A.password);
  const adminB = await login(TENANT_B.slug, TENANT_B.adminEmail, TENANT_B.password);
  if (!adminA || !userA || !adminB) throw new Error('Falha de login em pelo menos uma conta de prova.');

  const meAdminA = await httpRequest('GET', '/api/users/me', undefined, { Authorization: `Bearer ${adminA.accessToken}` });
  const meUserA = await httpRequest('GET', '/api/users/me', undefined, { Authorization: `Bearer ${userA.accessToken}` });
  const meAdminB = await httpRequest('GET', '/api/users/me', undefined, { Authorization: `Bearer ${adminB.accessToken}` });

  const getSettingsAdminA = await httpRequest('GET', '/api/institutional-settings', undefined, { Authorization: `Bearer ${adminA.accessToken}` });
  const getSettingsUserA = await httpRequest('GET', '/api/institutional-settings', undefined, { Authorization: `Bearer ${userA.accessToken}` });

  const fi8OrgNameA = `Prefeitura Exemplo FI8 ${Date.now()}`;
  const updatePayloadA = {
    organizationName: fi8OrgNameA,
    organizationLegalName: 'Prefeitura Municipal Exemplo FI8',
    documentNumber: '00.000.000/0001-08',
    defaultTimezone: 'America/Sao_Paulo',
    defaultLocale: 'pt-BR',
  };
  const patchAdminA = await httpRequest('PATCH', '/api/institutional-settings', updatePayloadA, {
    Authorization: `Bearer ${adminA.accessToken}`,
  });
  const patchUserAForbidden = await httpRequest('PATCH', '/api/institutional-settings', updatePayloadA, {
    Authorization: `Bearer ${userA.accessToken}`,
  });

  const guidance = await httpRequest('GET', '/api/process/guidance-options');
  if (guidance.status !== 200 || !guidance.body?.data) {
    throw new Error('guidance-options indisponível no ambiente oficial.');
  }
  const g = guidance.body.data;
  const payloadBase = {
    legalRegime: g.legalRegime[0],
    objectType: g.objectType[0],
    objectStructure: g.objectStructure[0],
    executionForm: g.executionForm[0],
    needJustification: 'Integracao FI8',
  };

  const runA = await httpRequest(
    'POST',
    '/api/process/run',
    {
      payload: { ...payloadBase, processId: `FI8-A-${Date.now()}` },
    },
    { Authorization: `Bearer ${adminA.accessToken}` },
  );
  const runB = await httpRequest(
    'POST',
    '/api/process/run',
    {
      payload: { ...payloadBase, processId: `FI8-B-${Date.now()}` },
    },
    { Authorization: `Bearer ${adminB.accessToken}` },
  );

  const histA = await httpRequest('GET', '/api/process-executions', undefined, { Authorization: `Bearer ${adminA.accessToken}` });
  const histB = await httpRequest('GET', '/api/process-executions', undefined, { Authorization: `Bearer ${adminB.accessToken}` });
  const histAIds = new Set<string>((histA.body?.data || []).map((x: any) => x.id));
  const histBIds = new Set<string>((histB.body?.data || []).map((x: any) => x.id));
  let overlap = 0;
  histAIds.forEach((id) => {
    if (histBIds.has(id)) overlap += 1;
  });

  const dbA = await dbTenantEvidence({
    tenantId: TENANT_A.id,
    expectedOrgName: fi8OrgNameA,
    expectedExecutedBy: meAdminA.body?.data?.id || '00000000-0000-0000-0000-000000000000',
  });
  const dbB = await dbTenantEvidence({
    tenantId: TENANT_B.id,
    expectedOrgName: (await httpRequest('GET', '/api/institutional-settings', undefined, { Authorization: `Bearer ${adminB.accessToken}` })).body?.data?.organizationName || '',
    expectedExecutedBy: meAdminB.body?.data?.id || '00000000-0000-0000-0000-000000000000',
  });

  const processRunNoAuth = await httpRequest(
    'POST',
    '/api/process/run',
    {
      processId: `FI8-REG-${Date.now()}`,
      regime: 'LICITACAO',
      objectType: 'MATERIAL_CONSUMO',
      objectStructure: 'single_item',
      deliveryType: 'unique',
      needJustification: 'Regressao global FI8',
    },
  );

  const regression = await runRegressionSuite();

  const checks = {
    env_frontend_3000_ok: frontendPing.status === 200,
    env_frontend_has_admin_ui: frontendPing.text.includes('Admin SaaS') && frontendPing.text.includes('login-form'),
    env_backend_3001_ok: backendHealth.status === 200,
    env_rls_role_valid: rlsRole.ok,

    scenarioA_admin_login: !!adminA,
    scenarioA_users_me_200: meAdminA.status === 200,
    scenarioA_users_me_role_admin: meAdminA.body?.data?.role === 'TENANT_ADMIN',
    scenarioA_settings_read_200: getSettingsAdminA.status === 200,
    scenarioA_settings_update_200: patchAdminA.status === 200,
    scenarioA_db_updated: dbA.organConfigUpdated,
    scenarioA_audit_institutional: dbA.hasInstitutionalAudit,

    scenarioB_user_login: !!userA,
    scenarioB_users_me_200: meUserA.status === 200,
    scenarioB_users_me_role_user: meUserA.body?.data?.role === 'TENANT_USER',
    scenarioB_settings_read_200: getSettingsUserA.status === 200,
    scenarioB_settings_update_forbidden_403: patchUserAForbidden.status === 403,

    scenarioC_exec_A_not_auth_error: runA.status !== 401,
    scenarioC_exec_B_not_auth_error: runB.status !== 401,
    scenarioC_history_A_200: histA.status === 200,
    scenarioC_history_B_200: histB.status === 200,
    scenarioC_db_has_execution_A: dbA.hasProcessExecution,
    scenarioC_db_has_execution_B: dbB.hasProcessExecution,
    scenarioC_db_has_audit_A: dbA.hasProcessAudit,
    scenarioC_db_has_audit_B: dbB.hasProcessAudit,

    scenarioD_api_history_no_overlap: overlap === 0,
    scenarioD_rls_real_validated: rlsRole.ok,

    scenarioE_process_run_integrity: processRunNoAuth.status !== 401,
    scenarioE_reg_fi3: regression.FI3_auth,
    scenarioE_reg_fi4: regression.FI4_rbac,
    scenarioE_reg_fi5: regression.FI5_execution_audit,
    scenarioE_reg_fi6: regression.FI6_institutional,
    scenarioE_reg_fi7: regression.FI7_frontend_admin,
  };

  console.log(
    JSON.stringify(
      {
        checks,
        statusEvidence: {
          frontend: frontendPing.status,
          backend: backendHealth.status,
          rlsCurrentUser: rlsRole.currentUser,
          meAdminA: meAdminA.status,
          meUserA: meUserA.status,
          getSettingsAdminA: getSettingsAdminA.status,
          getSettingsUserA: getSettingsUserA.status,
          patchAdminA: patchAdminA.status,
          patchUserAForbidden: patchUserAForbidden.status,
          runA: runA.status,
          runB: runB.status,
          histA: histA.status,
          histB: histB.status,
          historyOverlapCount: overlap,
          processRunNoAuth: processRunNoAuth.status,
        },
      },
      null,
      2,
    ),
  );

  const ok = Object.values(checks).every(Boolean);
  if (!ok) process.exit(1);
  process.exit(0);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});

