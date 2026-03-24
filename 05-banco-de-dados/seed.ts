/**
 * ETAPA G — Fase Interna 2
 * Runner de seeds — DECYON V2
 *
 * AVISO: seeds são apenas para desenvolvimento e CI.
 * O script bloqueia execução se NODE_ENV=production.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... NODE_ENV=development npx ts-node seed.ts
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const SEEDS_DIR = path.join(__dirname, 'seeds');

function guardProduction(): void {
  const env = process.env['NODE_ENV'] ?? 'development';
  if (env === 'production') {
    throw new Error(
      '[seed] BLOQUEADO: seeds não podem ser executadas em NODE_ENV=production.',
    );
  }
}

function loadDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url || url.trim() === '') {
    throw new Error('[seed] DATABASE_URL não definida.');
  }
  return url.trim();
}

function loadSeedFiles(): string[] {
  if (!fs.existsSync(SEEDS_DIR)) {
    throw new Error(`[seed] Diretório de seeds não encontrado: ${SEEDS_DIR}`);
  }
  return fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function main(): Promise<void> {
  guardProduction();

  const databaseUrl = loadDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });

  console.log('[seed] Conectando ao banco...');
  await client.connect();

  try {
    const files = loadSeedFiles();
    console.log(`[seed] ${files.length} seed(s) encontrada(s):`);

    for (const filename of files) {
      const filepath = path.join(SEEDS_DIR, filename);
      const sql = fs.readFileSync(filepath, 'utf-8');

      process.stdout.write(`[seed] Executando: ${filename} ... `);
      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('COMMIT;');
        console.log('OK');
      } catch (err) {
        await client.query('ROLLBACK;');
        throw err;
      }
    }

    console.log('[seed] Seeds aplicadas com sucesso.');
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[seed] ERRO: ${message}`);
  process.exit(1);
});
