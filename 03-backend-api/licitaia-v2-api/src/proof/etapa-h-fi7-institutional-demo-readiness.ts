/**
 * ETAPA H — H-FI7 — Prova reexecutável de readiness institucional e demonstração controlada.
 *
 * Valida:
 * - existência do protocolo oficial versionado no repositório;
 * - artefato de build (dist/server.js);
 * - PostgreSQL com migrations esperadas (schema_migrations);
 * - borda HTTP: health, diagnostics, login demo, /api/users/me, /api/institutional-settings;
 * - regressão zero: encadeia `npm run proof:h-fi6` (FI2 + HTTP + FI5 + FI4).
 *
 * Pré-requisito: API em execução (npm start ou npm run dev) com .env coerente com o protocolo.
 *
 *   npm run proof:h-fi7
 */

import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { Client } from 'pg';

const API_BASE_URL =
  process.env['API_BASE_URL'] || process.env['PROOF_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL =
  process.env['DATABASE_URL'] ||
  'postgresql://licitaia_app:licitaia_app@127.0.0.1:5432/licitaia_dev';

/** Repositório: LICITAIA-V2 (quatro níveis acima de src/proof). */
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const PROTOCOL_DOC = join(
  REPO_ROOT,
  '01-planejamento',
  'governanca',
  'PROTOCOLO-DEMONSTRACAO-CONTROLADA-ETAPA-H-FI7.md',
);

const API_ROOT = join(__dirname, '..', '..');
const DIST_SERVER = join(API_ROOT, 'dist', 'server.js');

/** Credenciais oficiais do seed 001_test_tenant.sql — apenas desenvolvimento/piloto controlado. */
const DEMO_ADMIN = {
  tenantSlug: 'prefeitura-exemplo',
  email: 'admin@exemplo.gov.br',
  password: 'SenhaTeste@123',
} as const;

const MIN_MIGRATIONS = 9;

type CheckResult = { id: string; ok: boolean; detail?: string };

async function fetchJson(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: any; headers: Headers }> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, headers: res.headers };
}

function assertProtocolFile(): CheckResult {
  if (!existsSync(PROTOCOL_DOC)) {
    return {
      id: 'protocol_doc',
      ok: false,
      detail: `Artefato ausente: ${PROTOCOL_DOC}`,
    };
  }
  return { id: 'protocol_doc', ok: true, detail: PROTOCOL_DOC };
}

function assertDistBuild(): CheckResult {
  if (!existsSync(DIST_SERVER)) {
    return {
      id: 'dist_server',
      ok: false,
      detail: 'Execute npm run build no diretório licitaia-v2-api.',
    };
  }
  return { id: 'dist_server', ok: true };
}

async function assertMigrationsApplied(): Promise<CheckResult> {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const r = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'schema_migrations'`,
    );
    if (r.rows[0]?.c !== '1') {
      return { id: 'schema_migrations_table', ok: false, detail: 'Tabela schema_migrations ausente.' };
    }
    const c = await client.query<{ n: string }>(
      'SELECT count(*)::text AS n FROM schema_migrations',
    );
    const n = parseInt(c.rows[0]?.n ?? '0', 10);
    if (n < MIN_MIGRATIONS) {
      return {
        id: 'migrations_count',
        ok: false,
        detail: `Esperado >= ${MIN_MIGRATIONS} migrations aplicadas, obtido ${n}.`,
      };
    }
    return { id: 'migrations_count', ok: true, detail: String(n) };
  } catch (e) {
    return {
      id: 'database_connect',
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function assertHttpDemoPath(): Promise<CheckResult[]> {
  const out: CheckResult[] = [];

  const health = await fetchJson('GET', `${API_BASE_URL}/health`);
  const hOk =
    health.status === 200 &&
    health.json?.status === 'ok' &&
    health.json?.service === 'licitaia-v2-api';
  out.push({
    id: 'health',
    ok: hOk,
    detail: hOk ? undefined : `HTTP ${health.status}`,
  });
  if (!hOk) return out;

  const diag = await fetchJson('GET', `${API_BASE_URL}/diagnostics`);
  out.push({
    id: 'diagnostics',
    ok: diag.status === 200 && diag.json?.kind === 'operational-diagnostics',
    detail: diag.status !== 200 ? `HTTP ${diag.status}` : undefined,
  });

  const login = await fetchJson('POST', `${API_BASE_URL}/api/auth/login`, {
    tenantSlug: DEMO_ADMIN.tenantSlug,
    email: DEMO_ADMIN.email,
    password: DEMO_ADMIN.password,
  });
  const token = login.json?.data?.accessToken as string | undefined;
  const refresh = login.json?.data?.refreshToken as string | undefined;
  out.push({
    id: 'auth_login_demo',
    ok: login.status === 200 && Boolean(token),
    detail: login.status !== 200 ? `HTTP ${login.status}` : undefined,
  });
  if (!token) return out;

  const me = await fetchJson('GET', `${API_BASE_URL}/api/users/me`, undefined, {
    Authorization: `Bearer ${token}`,
  });
  out.push({
    id: 'users_me',
    ok: me.status === 200 && me.json?.data?.email === DEMO_ADMIN.email,
    detail: me.status !== 200 ? `HTTP ${me.status}` : undefined,
  });

  const inst = await fetchJson('GET', `${API_BASE_URL}/api/institutional-settings`, undefined, {
    Authorization: `Bearer ${token}`,
  });
  out.push({
    id: 'institutional_settings',
    ok: inst.status === 200 && inst.json?.success === true,
    detail: inst.status !== 200 ? `HTTP ${inst.status}` : undefined,
  });

  if (refresh) {
    const logout = await fetchJson(
      'POST',
      `${API_BASE_URL}/api/auth/logout`,
      { refreshToken: refresh },
      { Authorization: `Bearer ${token}` },
    );
    out.push({
      id: 'auth_logout_post_demo',
      ok: logout.status === 200,
      detail: logout.status !== 200 ? `HTTP ${logout.status}` : undefined,
    });
  }

  return out;
}

function printChecklist(kind: 'pre' | 'post'): void {
  const pre = [
    'PostgreSQL a escutar; base licitaia_dev (ou equivalente no .env)',
    '05-banco-de-dados: npm run migrate e NODE_ENV=development npm run seed',
    'Backend: .env a partir de .env.example; DATABASE_URL com licitaia_app para RLS',
    'Backend: npm run build; npm start (porta 3001)',
    'Frontend demo: node server.js em licitaia-v2-demo (porta 3000) se usar UI',
    'GET /health retorna 200 antes de abrir audiência',
  ];
  const post = [
    'Logout ou revogação de sessão conforme política local',
    'Não expor credenciais de demo em gravações sem consentimento',
    'Em falha: registar x-request-id; não improvisar correção sem registo',
    'Opcional: npm run proof:h-fi7 ou npm run proof:h-fi6 antes do próximo evento',
  ];
  console.log('');
  console.log(kind === 'pre' ? '--- Checklist pré-demo (referência protocolo) ---' : '--- Checklist pós-demo (referência protocolo) ---');
  for (const line of kind === 'pre' ? pre : post) {
    console.log(`  [ ] ${line}`);
  }
}

function runHFi6Regression(): void {
  execSync('npm run proof:h-fi6', {
    cwd: API_ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL, API_BASE_URL },
  });
}

async function main(): Promise<void> {
  console.log('[H-FI7] Readiness institucional — demonstração controlada');
  console.log(`[H-FI7] API: ${API_BASE_URL}`);
  console.log(`[H-FI7] Protocolo: ${PROTOCOL_DOC}`);
  console.log('');

  printChecklist('pre');

  const checks: CheckResult[] = [];

  const p = assertProtocolFile();
  checks.push(p);
  console.log(`[H-FI7] ${p.id}: ${p.ok ? 'OK' : 'FALHA'}${p.detail ? ` — ${p.detail}` : ''}`);
  if (!p.ok) throw new Error('Protocolo oficial ausente.');

  const d = assertDistBuild();
  checks.push(d);
  console.log(`[H-FI7] ${d.id}: ${d.ok ? 'OK' : 'FALHA'}${d.detail ? ` — ${d.detail}` : ''}`);
  if (!d.ok) throw new Error('Build ausente.');

  const m = await assertMigrationsApplied();
  checks.push(m);
  console.log(`[H-FI7] ${m.id}: ${m.ok ? 'OK' : 'FALHA'}${m.detail ? ` — ${m.detail}` : ''}`);
  if (!m.ok) throw new Error('Base ou migrations incompatíveis com a demo.');

  const httpChecks = await assertHttpDemoPath();
  for (const c of httpChecks) {
    checks.push(c);
    console.log(`[H-FI7] http.${c.id}: ${c.ok ? 'OK' : 'FALHA'}${c.detail ? ` — ${c.detail}` : ''}`);
  }
  if (httpChecks.some((c) => !c.ok)) {
    throw new Error(
      'Falha na borda HTTP ou autenticação demo. Inicie a API e verifique seed/credenciais.',
    );
  }

  printChecklist('post');

  console.log('');
  console.log('[H-FI7] Encadeando regressão H-FI6 (FI2 + FI5 + FI4)...');
  runHFi6Regression();

  console.log('');
  console.log('[H-FI7] Concluído: protocolo documentado, demo canónica validada, regressão H-FI6 em verde.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
