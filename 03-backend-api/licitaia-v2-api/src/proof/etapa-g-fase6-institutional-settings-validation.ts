import { Client } from 'pg';

const BASE_URL = process.env['PROOF_BASE_URL'] || process.env['API_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL = process.env['DATABASE_URL'] || '';

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

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function login(tenantSlug: string, email: string, password: string): Promise<string | null> {
  const r = await httpRequest('POST', '/api/auth/login', { tenantSlug, email, password });
  const token = (r.body as { data?: { accessToken?: string } })?.data?.accessToken;
  if (r.status !== 200 || !token) return null;
  return token;
}

async function dbEvidence(
  tenantId: string,
): Promise<{ cfgCount: number; lastOrgName: string | null; hasAudit: boolean }> {
  if (!DATABASE_URL) throw new Error('DATABASE_URL ausente.');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const roleCheck = await client.query<{
      rolname: string;
      rolsuper: boolean;
      rolbypassrls: boolean;
      current_user: string;
    }>(
      `SELECT
         r.rolname,
         r.rolsuper,
         r.rolbypassrls,
         current_user::text AS current_user
       FROM pg_roles r
       WHERE r.rolname = 'licitaia_app'
       LIMIT 1`,
    );
    if (roleCheck.rowCount === 0) {
      throw new Error('Role licitaia_app não encontrada.');
    }
    const role = roleCheck.rows[0];
    if (role.rolsuper || role.rolbypassrls) {
      throw new Error('Role licitaia_app inválida para prova RLS (superuser/BYPASSRLS).');
    }
    if (role.current_user !== 'licitaia_app') {
      throw new Error(`Conexão não está usando licitaia_app (current_user=${role.current_user}).`);
    }
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenantId]);

    const cfgResult = await client.query<{ c: string; organization_name: string | null }>(
      `SELECT COUNT(*)::text AS c, MAX(organization_name) AS organization_name
       FROM organ_configs
       WHERE tenant_id = $1::uuid`,
      [tenantId],
    );
    const cfg = cfgResult.rows[0] ?? { c: '0', organization_name: null };
    const audit = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'INSTITUTIONAL_SETTINGS_UPDATED'`,
      [tenantId],
    );
    return {
      cfgCount: parseInt(cfg.c ?? '0', 10),
      lastOrgName: cfg.organization_name ?? null,
      hasAudit: parseInt(audit.rows[0]?.c ?? '0', 10) > 0,
    };
  } finally {
    await client.end();
  }
}

async function run(): Promise<void> {
  console.log('=== ETAPA G — FASE INTERNA 6 — PROVA OPERACIONAL ===');

  const adminA = await login(TENANT_A.slug, TENANT_A.adminEmail, TENANT_A.password);
  const userA = await login(TENANT_A.slug, TENANT_A.userEmail, TENANT_A.password);
  const adminB = await login(TENANT_B.slug, TENANT_B.adminEmail, TENANT_B.password);
  if (!adminA || !userA || !adminB) {
    throw new Error('Falha de autenticação (adminA/userA/adminB).');
  }

  const bodyA = {
    organizationName: 'Prefeitura Exemplo FI6',
    organizationLegalName: 'Prefeitura Municipal de Exemplo FI6',
    documentNumber: '00.000.000/0001-06',
    defaultTimezone: 'America/Sao_Paulo',
    defaultLocale: 'pt-BR',
  };
  const bodyB = {
    organizationName: 'Orgao B FI6',
    organizationLegalName: 'Orgao B Institucional FI6',
    documentNumber: '11.111.111/0001-16',
    defaultTimezone: 'America/Manaus',
    defaultLocale: 'pt-BR',
  };

  const patchA = await httpRequest('PATCH', '/api/institutional-settings', bodyA, {
    Authorization: `Bearer ${adminA}`,
  });
  const patchB = await httpRequest('PATCH', '/api/institutional-settings', bodyB, {
    Authorization: `Bearer ${adminB}`,
  });
  const patchForbidden = await httpRequest('PATCH', '/api/institutional-settings', bodyA, {
    Authorization: `Bearer ${userA}`,
  });

  const getA = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${adminA}`,
  });
  const getB = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${adminB}`,
  });

  const dbA = await dbEvidence(TENANT_A.id);
  const dbB = await dbEvidence(TENANT_B.id);

  const regression = await httpRequest('POST', '/api/process/run', {
    processId: 'FI6-REGRESSION',
    regime: 'LICITACAO',
    objectType: 'MATERIAL_CONSUMO',
    objectStructure: 'single_item',
    deliveryType: 'unique',
    needJustification: 'Regressão FI5 na FI6',
  });

  const aData = (getA.body as { data?: { organizationName?: string } })?.data;
  const bData = (getB.body as { data?: { organizationName?: string } })?.data;

  const checks = {
    patchAdminA200: patchA.status === 200,
    patchAdminB200: patchB.status === 200,
    patchUser403: patchForbidden.status === 403,
    getA200: getA.status === 200,
    getB200: getB.status === 200,
    tenantASeesOnlyA: aData?.organizationName === bodyA.organizationName,
    tenantBSeesOnlyB: bData?.organizationName === bodyB.organizationName,
    tenantANotSeeB: aData?.organizationName !== bodyB.organizationName,
    tenantBNotSeeA: bData?.organizationName !== bodyA.organizationName,
    dbAHasData: dbA.cfgCount > 0 && dbA.lastOrgName === bodyA.organizationName,
    dbBHasData: dbB.cfgCount > 0 && dbB.lastOrgName === bodyB.organizationName,
    dbAHasAudit: dbA.hasAudit,
    dbBHasAudit: dbB.hasAudit,
    processRunRegression: regression.status !== 401,
  };

  console.log(JSON.stringify({ checks, statuses: {
    patchA: patchA.status,
    patchB: patchB.status,
    patchForbidden: patchForbidden.status,
    getA: getA.status,
    getB: getB.status,
    processRun: regression.status,
  } }, null, 2));

  const ok = Object.values(checks).every(Boolean);
  if (!ok) {
    process.exit(1);
  }
  process.exit(0);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
