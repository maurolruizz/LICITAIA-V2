import 'dotenv/config';
import { Client } from 'pg';

const BASE_URL = process.env['PROOF_BASE_URL'] || process.env['API_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL = process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/licitaia_dev';

const TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'prefeitura-exemplo',
  adminEmail: 'admin@exemplo.gov.br',
  userEmail: 'operador@exemplo.gov.br',
  password: 'SenhaTeste@123',
};

type HttpResult = { status: number; body: any };

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResult> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function login(email: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const response = await httpRequest('POST', '/api/auth/login', {
    tenantSlug: TENANT.slug,
    email,
    password: TENANT.password,
  });
  const data = response.body?.data;
  if (response.status !== 200 || !data?.accessToken || !data?.refreshToken) return null;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

async function dbEvidence(expectedOrgName: string, actorUserId: string): Promise<{ updated: boolean; hasAudit: boolean }> {
  if (!DATABASE_URL) throw new Error('DATABASE_URL ausente.');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [TENANT.id]);
    const cfg = await client.query<{ organization_name: string | null }>(
      `SELECT organization_name
       FROM organ_configs
       WHERE tenant_id = $1::uuid`,
      [TENANT.id],
    );
    const log = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'INSTITUTIONAL_SETTINGS_UPDATED'
         AND user_id = $2::uuid`,
      [TENANT.id, actorUserId],
    );
    return {
      updated: cfg.rows[0]?.organization_name === expectedOrgName,
      hasAudit: Number(log.rows[0]?.c || '0') > 0,
    };
  } finally {
    await client.end();
  }
}

async function run(): Promise<void> {
  console.log('=== ETAPA G — FASE INTERNA 7 — PROVA OPERACIONAL FRONTEND/ADMIN ===');

  const adminSession = await login(TENANT.adminEmail);
  const userSession = await login(TENANT.userEmail);
  if (!adminSession || !userSession) throw new Error('Falha de login (admin/user).');

  const meAdmin = await httpRequest('GET', '/api/users/me', undefined, {
    Authorization: `Bearer ${adminSession.accessToken}`,
  });
  const meUser = await httpRequest('GET', '/api/users/me', undefined, {
    Authorization: `Bearer ${userSession.accessToken}`,
  });

  const getSettingsAdmin = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${adminSession.accessToken}`,
  });
  const getSettingsUser = await httpRequest('GET', '/api/institutional-settings', undefined, {
    Authorization: `Bearer ${userSession.accessToken}`,
  });

  const adminPayload = {
    organizationName: 'Prefeitura Exemplo FI7',
    organizationLegalName: 'Prefeitura Municipal Exemplo FI7',
    documentNumber: '00.000.000/0001-07',
    defaultTimezone: 'America/Sao_Paulo',
    defaultLocale: 'pt-BR',
  };

  const patchAdmin = await httpRequest('PATCH', '/api/institutional-settings', adminPayload, {
    Authorization: `Bearer ${adminSession.accessToken}`,
  });
  const patchUserForbidden = await httpRequest('PATCH', '/api/institutional-settings', adminPayload, {
    Authorization: `Bearer ${userSession.accessToken}`,
  });

  const adminUserId = meAdmin.body?.data?.id;
  if (!adminUserId) {
    throw new Error('ID do admin não disponível para evidência de audit log.');
  }
  const db = await dbEvidence(adminPayload.organizationName, adminUserId);

  const logoutAdmin = await httpRequest(
    'POST',
    '/api/auth/logout',
    { refreshToken: adminSession.refreshToken },
    { Authorization: `Bearer ${adminSession.accessToken}` },
  );

  const regressionProcessRun = await httpRequest('POST', '/api/process/run', {
    processId: 'FI7-REGRESSION',
    regime: 'LICITACAO',
    objectType: 'MATERIAL_CONSUMO',
    objectStructure: 'single_item',
    deliveryType: 'unique',
    needJustification: 'Regressao FI7',
  });

  const checks = {
    adminLogin200: !!adminSession,
    userLogin200: !!userSession,
    meAdmin200: meAdmin.status === 200,
    meUser200: meUser.status === 200,
    meAdminRoleOk: meAdmin.body?.data?.role === 'TENANT_ADMIN',
    meUserRoleOk: meUser.body?.data?.role === 'TENANT_USER',
    settingsReadAdmin200: getSettingsAdmin.status === 200,
    settingsReadUser200: getSettingsUser.status === 200,
    settingsPatchAdmin200: patchAdmin.status === 200,
    settingsPatchUser403: patchUserForbidden.status === 403,
    dbUpdated: db.updated,
    auditLogged: db.hasAudit,
    logoutAdmin200: logoutAdmin.status === 200,
    regressionProcessRunOk: regressionProcessRun.status !== 401,
  };

  console.log(
    JSON.stringify(
      {
        checks,
        statuses: {
          meAdmin: meAdmin.status,
          meUser: meUser.status,
          getSettingsAdmin: getSettingsAdmin.status,
          getSettingsUser: getSettingsUser.status,
          patchAdmin: patchAdmin.status,
          patchUser: patchUserForbidden.status,
          logoutAdmin: logoutAdmin.status,
          processRun: regressionProcessRun.status,
        },
      },
      null,
      2,
    ),
  );

  if (!Object.values(checks).every(Boolean)) {
    process.exit(1);
  }
  process.exit(0);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
