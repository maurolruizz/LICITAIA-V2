/**
 * ETAPA G — Fase Interna 2
 * Validação estrutural do schema — DECYON V2
 *
 * Verifica que o banco contém todas as entidades, RLS, políticas,
 * constraints e índices esperados pela arquitetura aprovada.
 * Não modifica o banco. Apenas lê e reporta.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npx ts-node validate.ts
 *
 * Critério de aceite: saída "SCHEMA VÁLIDO — ETAPA G FASE INTERNA 2: OK"
 */

import { Client } from 'pg';

const EXPECTED_TABLES: string[] = [
  'tenants',
  'users',
  'user_sessions',
  'process_executions',
  'audit_logs',
  'organ_configs',
];

// Tabelas que devem ter RLS ativo (não inclui tenants, que é a raiz)
const TABLES_WITH_RLS: string[] = [
  'users',
  'user_sessions',
  'process_executions',
  'audit_logs',
  'organ_configs',
];

// Políticas esperadas por tabela
const EXPECTED_POLICIES: Record<string, string[]> = {
  users:               ['users_tenant_isolation'],
  user_sessions:       ['user_sessions_tenant_isolation'],
  process_executions:  ['process_executions_tenant_isolation'],
  audit_logs:          ['audit_logs_tenant_select', 'audit_logs_tenant_insert'],
  organ_configs:       ['organ_configs_tenant_isolation'],
};

// Constraints de CHECK críticas esperadas
const EXPECTED_CONSTRAINTS: Array<{ table: string; constraint: string }> = [
  { table: 'tenants',            constraint: 'tenants_status_check' },
  { table: 'tenants',            constraint: 'tenants_plan_check' },
  { table: 'users',              constraint: 'users_role_check' },
  { table: 'users',              constraint: 'users_status_check' },
  { table: 'users',              constraint: 'users_tenant_required' },
  { table: 'user_sessions',      constraint: 'user_sessions_expires_future' },
  { table: 'organ_configs',      constraint: 'organ_configs_esfera_check' },
  { table: 'organ_configs',      constraint: 'organ_configs_retencao_check' },
];

// Triggers de imutabilidade esperados
const EXPECTED_TRIGGERS: Array<{ table: string; trigger: string }> = [
  { table: 'audit_logs', trigger: 'audit_logs_block_update' },
  { table: 'audit_logs', trigger: 'audit_logs_block_delete' },
];

type CheckResult = { label: string; passed: boolean; detail?: string };

function pass(label: string): CheckResult { return { label, passed: true }; }
function fail(label: string, detail: string): CheckResult { return { label, passed: false, detail }; }

async function checkTables(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`,
  );
  const existing = new Set(res.rows.map((r) => r.tablename));
  return EXPECTED_TABLES.map((t) =>
    existing.has(t)
      ? pass(`Tabela existe: ${t}`)
      : fail(`Tabela existe: ${t}`, `Tabela '${t}' não encontrada em pg_tables.`),
  );
}

async function checkRls(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ relname: string; rowsecurity: boolean }>(
    `SELECT relname, relrowsecurity AS rowsecurity
     FROM pg_class
     WHERE relname = ANY($1) AND relkind = 'r';`,
    [TABLES_WITH_RLS],
  );
  const rlsMap = new Map(res.rows.map((r) => [r.relname, r.rowsecurity]));
  return TABLES_WITH_RLS.map((t) => {
    const enabled = rlsMap.get(t);
    if (enabled === undefined) return fail(`RLS ativo: ${t}`, `Tabela '${t}' não encontrada.`);
    return enabled
      ? pass(`RLS ativo: ${t}`)
      : fail(`RLS ativo: ${t}`, `RLS NÃO está ativo na tabela '${t}'.`);
  });
}

async function checkPolicies(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ tablename: string; policyname: string }>(
    `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';`,
  );
  const existing = new Set(res.rows.map((r) => `${r.tablename}.${r.policyname}`));
  const results: CheckResult[] = [];
  for (const [table, policies] of Object.entries(EXPECTED_POLICIES)) {
    for (const policy of policies) {
      const key = `${table}.${policy}`;
      results.push(
        existing.has(key)
          ? pass(`Política RLS: ${key}`)
          : fail(`Política RLS: ${key}`, `Política '${policy}' não encontrada na tabela '${table}'.`),
      );
    }
  }
  return results;
}

async function checkConstraints(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ table_name: string; constraint_name: string }>(
    `SELECT tc.table_name, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.constraint_schema = 'public'
       AND tc.constraint_type IN ('CHECK', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY');`,
  );
  const existing = new Set(res.rows.map((r) => `${r.table_name}.${r.constraint_name}`));
  return EXPECTED_CONSTRAINTS.map(({ table, constraint }) => {
    const key = `${table}.${constraint}`;
    return existing.has(key)
      ? pass(`Constraint: ${key}`)
      : fail(`Constraint: ${key}`, `Constraint '${constraint}' não encontrada na tabela '${table}'.`);
  });
}

async function checkTriggers(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ event_object_table: string; trigger_name: string }>(
    `SELECT event_object_table, trigger_name
     FROM information_schema.triggers
     WHERE trigger_schema = 'public';`,
  );
  const existing = new Set(
    res.rows.map((r) => `${r.event_object_table}.${r.trigger_name}`),
  );
  return EXPECTED_TRIGGERS.map(({ table, trigger }) => {
    const key = `${table}.${trigger}`;
    return existing.has(key)
      ? pass(`Trigger imutabilidade: ${key}`)
      : fail(`Trigger imutabilidade: ${key}`, `Trigger '${trigger}' não encontrado na tabela '${table}'.`);
  });
}

async function checkMigrationsTable(client: Client): Promise<CheckResult[]> {
  const res = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM schema_migrations;`,
  );
  const count = parseInt(res.rows[0]?.count ?? '0', 10);
  return [
    count >= 7
      ? pass(`schema_migrations: ${count} migration(s) registrada(s)`)
      : fail(
          `schema_migrations: ${count} migration(s) registrada(s)`,
          `Esperado >= 7 migrations aplicadas. Encontrado: ${count}.`,
        ),
  ];
}

function loadDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url || url.trim() === '') {
    throw new Error('[validate] DATABASE_URL não definida.');
  }
  return url.trim();
}

async function main(): Promise<void> {
  const databaseUrl = loadDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });

  console.log('[validate] Conectando ao banco...\n');
  await client.connect();

  try {
    const allChecks: CheckResult[] = [
      ...(await checkTables(client)),
      ...(await checkRls(client)),
      ...(await checkPolicies(client)),
      ...(await checkConstraints(client)),
      ...(await checkTriggers(client)),
      ...(await checkMigrationsTable(client)),
    ];

    let failures = 0;
    for (const check of allChecks) {
      const status = check.passed ? '  PASS' : '  FAIL';
      console.log(`${status}  ${check.label}`);
      if (!check.passed && check.detail) {
        console.log(`         → ${check.detail}`);
        failures++;
      }
    }

    console.log('');
    console.log(`Total: ${allChecks.length} verificações | ${failures} falha(s)`);
    console.log('');

    if (failures > 0) {
      console.error('SCHEMA INVÁLIDO — Corrigir falhas antes de avançar para a Fase Interna 3.');
      process.exit(1);
    } else {
      console.log('SCHEMA VÁLIDO — ETAPA G FASE INTERNA 2: OK');
      console.log('Fase Interna 3 (Autenticação + Tenant Resolution) liberada.');
    }
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[validate] ERRO: ${message}`);
  process.exit(1);
});
