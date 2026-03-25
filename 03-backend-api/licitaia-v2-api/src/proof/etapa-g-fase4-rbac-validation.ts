/**
 * ETAPA G — Fase Interna 4 — Validação RBAC + módulo de usuários.
 *
 * Pré-requisitos: PostgreSQL com migrations (incl. 007) + seed 001; API em execução.
 *   DATABASE_URL, JWT_SECRET (32+ chars), API_BASE_URL opcional
 *
 * Execução: npx ts-node src/proof/etapa-g-fase4-rbac-validation.ts
 */

import http from 'http';
import { Client } from 'pg';

const API_BASE = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
const DATABASE_URL = process.env['DATABASE_URL'];

const TENANT_A_SLUG = 'prefeitura-exemplo';
const TENANT_B_SLUG = 'orgao-isolamento-b';
const TENANT_A_ID = '00000000-0000-0000-0000-000000000001';

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, passed: true, detail });
  console.log(`  ✓ ${name}`);
  if (detail) console.log(`    ${detail}`);
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
  console.error(`  ✗ ${name}`);
  console.error(`    ${detail}`);
}

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port) || 80,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function login(
  tenantSlug: string,
  email: string,
  password: string,
): Promise<{ accessToken: string } | null> {
  const r = await httpRequest('POST', '/api/auth/login', {
    tenantSlug,
    email,
    password,
  });
  if (r.status !== 200) return null;
  const d = r.body as { success?: boolean; data?: { accessToken?: string } };
  if (!d.success || !d.data?.accessToken) return null;
  return { accessToken: d.data.accessToken };
}

async function runTests(): Promise<void> {
  console.log('\n=== ETAPA G — Fase Interna 4 — RBAC + Usuários ===\n');

  const proofEmail = `fase4-proof-${Date.now()}@tenant-a.proof`;
  const proofPassword = 'SenhaFase4ProofUser@9';
  let createdUserId = '';
  let adminToken = '';

  // --- CASO 1 ---
  console.log('CASO 1: Admin cria usuário → 201');
  try {
    const auth = await login(TENANT_A_SLUG, 'admin@exemplo.gov.br', 'SenhaTeste@123');
    if (!auth) {
      fail('Admin cria usuário', 'Login admin falhou');
    } else {
      adminToken = auth.accessToken;
      const r = await httpRequest(
        'POST',
        '/api/users',
        {
          email: proofEmail,
          name: 'Usuário Prova Fase 4',
          password: proofPassword,
          role: 'TENANT_USER',
        },
        { Authorization: `Bearer ${adminToken}` },
      );
      if (r.status === 201) {
        const d = r.body as { data?: { user?: { id?: string; email?: string } } };
        createdUserId = d.data?.user?.id ?? '';
        if (createdUserId && d.data?.user?.email === proofEmail) {
          pass('Admin cria usuário → 201', `id=${createdUserId}`);
        } else {
          fail('Admin cria usuário → 201', `Resposta sem id/email: ${JSON.stringify(r.body)}`);
        }
      } else {
        fail('Admin cria usuário → 201', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    }
  } catch (err) {
    fail('Admin cria usuário', String(err));
  }

  // --- CASO 2 ---
  console.log('\nCASO 2: Admin lista usuários → 200');
  try {
    const r = await httpRequest('GET', '/api/users', undefined, {
      Authorization: `Bearer ${adminToken}`,
    });
    if (r.status === 200) {
      const d = r.body as { data?: { users?: { email: string }[] } };
      const emails = (d.data?.users ?? []).map((u) => u.email);
      if (emails.includes(proofEmail)) {
        pass('Admin lista usuários → 200', `${emails.length} usuário(s) no tenant`);
      } else {
        fail('Admin lista usuários → 200', `Email criado ausente na lista: ${emails.join(',')}`);
      }
    } else {
      fail('Admin lista usuários → 200', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    }
  } catch (err) {
    fail('Admin lista usuários', String(err));
  }

  // --- CASO 3 ---
  console.log('\nCASO 3: TENANT_USER tenta criar → 403');
  try {
    const u = await login(TENANT_A_SLUG, 'operador@exemplo.gov.br', 'SenhaTeste@123');
    if (!u) {
      fail('User tenta criar', 'Login operador falhou');
    } else {
      const r = await httpRequest(
        'POST',
        '/api/users',
        {
          email: 'nao-deve-existir@test.local',
          name: 'X',
          password: 'Abcd1234!@',
          role: 'TENANT_USER',
        },
        { Authorization: `Bearer ${u.accessToken}` },
      );
      if (r.status === 403) {
        pass('TENANT_USER tenta criar → 403', `code=${(r.body as { error?: { code?: string } }).error?.code}`);
      } else {
        fail('TENANT_USER tenta criar → 403', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    }
  } catch (err) {
    fail('User tenta criar', String(err));
  }

  // --- CASO 4 ---
  console.log('\nCASO 4: TENANT_USER tenta listar → 403');
  try {
    const u = await login(TENANT_A_SLUG, 'operador@exemplo.gov.br', 'SenhaTeste@123');
    if (!u) {
      fail('User tenta listar', 'Login operador falhou');
    } else {
      const r = await httpRequest('GET', '/api/users', undefined, {
        Authorization: `Bearer ${u.accessToken}`,
      });
      if (r.status === 403) {
        pass('TENANT_USER tenta listar → 403', `code=${(r.body as { error?: { code?: string } }).error?.code}`);
      } else {
        fail('TENANT_USER tenta listar → 403', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    }
  } catch (err) {
    fail('User tenta listar', String(err));
  }

  // --- CASO 5 ---
  console.log('\nCASO 5: Admin altera role → 200');
  try {
    if (!createdUserId || !adminToken) {
      fail('Admin altera role', 'Sem id de usuário criado ou token admin');
    } else {
      const r = await httpRequest(
        'PATCH',
        `/api/users/${createdUserId}`,
        { role: 'TENANT_ADMIN' },
        { Authorization: `Bearer ${adminToken}` },
      );
      if (r.status === 200) {
        const d = r.body as { data?: { user?: { role?: string } } };
        if (d.data?.user?.role === 'TENANT_ADMIN') {
          pass('Admin altera role → 200', 'role=TENANT_ADMIN');
        } else {
          fail('Admin altera role → 200', JSON.stringify(r.body));
        }
      } else {
        fail('Admin altera role → 200', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    }
  } catch (err) {
    fail('Admin altera role', String(err));
  }

  // --- CASO 6 ---
  console.log('\nCASO 6: Admin desativa usuário → 200');
  try {
    if (!createdUserId || !adminToken) {
      fail('Admin desativa usuário', 'Sem id ou token');
    } else {
      const r = await httpRequest(
        'PATCH',
        `/api/users/${createdUserId}`,
        { status: 'inactive' },
        { Authorization: `Bearer ${adminToken}` },
      );
      if (r.status === 200) {
        const d = r.body as { data?: { user?: { status?: string } } };
        if (d.data?.user?.status === 'inactive') {
          pass('Admin desativa usuário → 200', 'status=inactive');
        } else {
          fail('Admin desativa usuário → 200', JSON.stringify(r.body));
        }
      } else {
        fail('Admin desativa usuário → 200', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    }
  } catch (err) {
    fail('Admin desativa usuário', String(err));
  }

  // --- CASO 7 ---
  console.log('\nCASO 7: Usuário desativado não loga → 403');
  try {
    const r = await httpRequest('POST', '/api/auth/login', {
      tenantSlug: TENANT_A_SLUG,
      email: proofEmail,
      password: proofPassword,
    });
    if (r.status === 403) {
      const code = (r.body as { error?: { code?: string } }).error?.code;
      pass('Usuário desativado não loga → 403', `code=${code}`);
    } else {
      fail('Usuário desativado não loga → 403', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    }
  } catch (err) {
    fail('Usuário desativado não loga', String(err));
  }

  // --- CASO 8 ---
  console.log('\nCASO 8: Isolamento entre tenants → OK');
  try {
    const b = await login(TENANT_B_SLUG, 'admin-b@exemplo.gov.br', 'SenhaTeste@123');
    if (!b) {
      fail('Isolamento entre tenants', 'Login admin tenant B falhou');
    } else {
      const r = await httpRequest('GET', '/api/users', undefined, {
        Authorization: `Bearer ${b.accessToken}`,
      });
      if (r.status !== 200) {
        fail('Isolamento entre tenants', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      } else {
        const d = r.body as { data?: { users?: { email: string }[] } };
        const emails = (d.data?.users ?? []).map((u) => u.email);
        if (emails.includes(proofEmail)) {
          fail('Isolamento entre tenants', `Email do tenant A apareceu no tenant B: ${proofEmail}`);
        } else {
          pass('Isolamento entre tenants → OK', 'Email do tenant A ausente na lista do tenant B');
        }
      }
    }
  } catch (err) {
    fail('Isolamento entre tenants', String(err));
  }

  // --- CASO 9: Auditoria + regressão /api/process/run ---
  console.log('\nCASO 9: Auditoria registrada + regressão /api/process/run');
  try {
    if (!DATABASE_URL || DATABASE_URL.trim() === '') {
      fail('Auditoria + regressão', 'DATABASE_URL não definida para checagem de audit_logs');
    } else {
      const client = new Client({ connectionString: DATABASE_URL });
      await client.connect();
      let hasAll = false;
      try {
        await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [TENANT_A_ID]);
        const ar = await client.query<{ action: string }>(
          `SELECT action FROM audit_logs
           WHERE tenant_id = $1::uuid
             AND action IN ('USER_CREATED', 'USER_ROLE_CHANGED', 'USER_DEACTIVATED')
           ORDER BY created_at DESC
           LIMIT 50`,
          [TENANT_A_ID],
        );
        const actions = new Set(ar.rows.map((row) => row.action));
        hasAll =
          actions.has('USER_CREATED') &&
          actions.has('USER_ROLE_CHANGED') &&
          actions.has('USER_DEACTIVATED');
      } finally {
        await client.end();
      }

      const pr = await httpRequest('POST', '/api/process/run', {
        processId: 'REGRESSION-FASE4',
        regime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'single_item',
        deliveryType: 'unique',
        needJustification: 'Regressão Fase Interna 4',
      });

      if (!hasAll) {
        fail(
          'Auditoria + regressão',
          `audit_logs incompleto (esperado USER_CREATED, USER_ROLE_CHANGED, USER_DEACTIVATED). /api/process/run → HTTP ${pr.status}`,
        );
      } else if (pr.status === 401) {
        fail('Auditoria + regressão', 'POST /api/process/run retornou 401 (regressão)');
      } else {
        pass(
          'Auditoria + regressão',
          `audit_logs OK; /api/process/run → HTTP ${pr.status}`,
        );
      }
    }
  } catch (err) {
    fail('Auditoria + regressão', String(err));
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTADO FINAL: ${passed}/${total} casos passaram`);
  console.log('='.repeat(60));

  if (passed === total) {
    console.log('\n✓ FASE INTERNA 4 — VALIDAÇÃO APROVADA\n');
    process.exit(0);
  } else {
    console.error('\n✗ FASE INTERNA 4 — VALIDAÇÃO COM FALHAS\n');
    process.exit(1);
  }
}

void runTests().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
