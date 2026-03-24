/**
 * ETAPA G — Fase Interna 2
 * Runner de migrations — DECYON V2
 *
 * Lê arquivos .sql numerados de ./migrations/, executa os ainda não aplicados
 * em ordem crescente e registra cada um em schema_migrations.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... npx ts-node migrate.ts
 *
 * Requisitos:
 *   - PostgreSQL 14+
 *   - Variável de ambiente DATABASE_URL
 *   - O usuário conectado deve ter permissão para CREATE TABLE, CREATE POLICY e ALTER TABLE
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function loadDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url || url.trim() === '') {
    throw new Error(
      '[migrate] DATABASE_URL não definida. ' +
      'Defina a variável de ambiente antes de executar o runner.',
    );
  }
  return url.trim();
}

function loadMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`[migrate] Diretório de migrations não encontrado: ${MIGRATIONS_DIR}`);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL       PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
  `);
}

async function loadAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC;',
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function applyMigration(client: Client, filename: string): Promise<void> {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  // Cada migration roda dentro de uma transação explícita
  await client.query('BEGIN;');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1);',
      [filename],
    );
    await client.query('COMMIT;');
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  }
}

async function main(): Promise<void> {
  const databaseUrl = loadDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });

  console.log('[migrate] Conectando ao banco...');
  await client.connect();

  try {
    await ensureMigrationsTable(client);

    const files = loadMigrationFiles();
    const applied = await loadAppliedMigrations(client);

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('[migrate] Nenhuma migration pendente. Schema está atualizado.');
      return;
    }

    console.log(`[migrate] ${pending.length} migration(s) pendente(s):`);
    for (const f of pending) {
      console.log(`  → ${f}`);
    }

    for (const filename of pending) {
      process.stdout.write(`[migrate] Aplicando: ${filename} ... `);
      await applyMigration(client, filename);
      console.log('OK');
    }

    console.log(`[migrate] ${pending.length} migration(s) aplicada(s) com sucesso.`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[migrate] ERRO: ${message}`);
  process.exit(1);
});
