const { Client } = require('pg');

const BASE_URL = process.env.PROOF_BASE_URL || 'http://localhost:3001';
const DATABASE_URL = process.env.DATABASE_URL || '';

const TENANT_A = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'prefeitura-exemplo',
  adminEmail: 'admin@exemplo.gov.br',
  adminPassword: 'SenhaTeste@123',
};

const TENANT_B = {
  id: '00000000-0000-0000-0000-000000000002',
  slug: 'orgao-isolamento-b',
  adminEmail: 'admin-b@exemplo.gov.br',
  adminPassword: 'SenhaTeste@123',
};

async function httpRequest(method, path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function login(tenantSlug, email, password) {
  const r = await httpRequest('POST', '/api/auth/login', { tenantSlug, email, password });
  const token = r?.body?.data?.accessToken;
  const userId = r?.body?.data?.user?.id;
  if (r.status !== 200 || !token || !userId) return null;
  return { accessToken: token, userId };
}

async function queryDbByTenant(tenantId) {
  if (!DATABASE_URL) throw new Error('DATABASE_URL ausente.');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenantId]);
    const ex = await client.query(
      `SELECT id, tenant_id::text AS tenant_id, executed_by::text AS executed_by
       FROM process_executions
       WHERE tenant_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT 20`,
      [tenantId],
    );
    const al = await client.query(
      `SELECT action
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'PROCESS_EXECUTION'
       ORDER BY created_at DESC
       LIMIT 20`,
      [tenantId],
    );
    return { executions: ex.rows, audits: al.rows };
  } finally {
    await client.end();
  }
}

async function run() {
  const guidance = await httpRequest('GET', '/api/process/guidance-options');
  if (guidance.status !== 200) throw new Error('guidance-options indisponivel');
  const g = guidance.body.data;
  const payloadBase = {
    legalRegime: g.legalRegime[0],
    objectType: g.objectType[0],
    objectStructure: g.objectStructure[0],
    executionForm: g.executionForm[0],
    needJustification: 'FI5 prova operacional',
  };

  const noAuth = await httpRequest('POST', '/api/process/run', {
    payload: { ...payloadBase, processId: 'FI5-NOAUTH' },
  });

  const a = await login(TENANT_A.slug, TENANT_A.adminEmail, TENANT_A.adminPassword);
  const b = await login(TENANT_B.slug, TENANT_B.adminEmail, TENANT_B.adminPassword);
  if (!a || !b) throw new Error('Falha de login tenant A/B');

  const runA = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: { ...payloadBase, processId: 'FI5-A' } },
    { Authorization: `Bearer ${a.accessToken}` },
  );
  const runB = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: { ...payloadBase, processId: 'FI5-B' } },
    { Authorization: `Bearer ${b.accessToken}` },
  );

  const histA = await httpRequest('GET', '/api/process/executions?limit=20', undefined, {
    Authorization: `Bearer ${a.accessToken}`,
  });
  const histB = await httpRequest('GET', '/api/process/executions?limit=20', undefined, {
    Authorization: `Bearer ${b.accessToken}`,
  });
  const idsA = ((histA.body?.data || []).map((x) => x.id));
  const idsB = ((histB.body?.data || []).map((x) => x.id));
  const overlap = idsA.filter((id) => idsB.includes(id));

  const dbA = await queryDbByTenant(TENANT_A.id);
  const dbB = await queryDbByTenant(TENANT_B.id);

  const result = {
    noAuthStatus: noAuth.status,
    loginAStatus: 200,
    loginBStatus: 200,
    runAStatus: runA.status,
    runBStatus: runB.status,
    histAStatus: histA.status,
    histBStatus: histB.status,
    histAItems: idsA.length,
    histBItems: idsB.length,
    overlapCount: overlap.length,
    dbAHasExecutionByUser: dbA.executions.some((x) => x.executed_by === a.userId),
    dbBHasExecutionByUser: dbB.executions.some((x) => x.executed_by === b.userId),
    dbAHasAudit: dbA.audits.some((x) => x.action === 'PROCESS_EXECUTION'),
    dbBHasAudit: dbB.audits.some((x) => x.action === 'PROCESS_EXECUTION'),
  };

  console.log(JSON.stringify(result, null, 2));

  const ok =
    result.noAuthStatus !== 401 &&
    result.runAStatus !== 401 &&
    result.runBStatus !== 401 &&
    result.histAStatus === 200 &&
    result.histBStatus === 200 &&
    result.overlapCount === 0 &&
    result.dbAHasExecutionByUser &&
    result.dbBHasExecutionByUser &&
    result.dbAHasAudit &&
    result.dbBHasAudit;
  process.exit(ok ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
