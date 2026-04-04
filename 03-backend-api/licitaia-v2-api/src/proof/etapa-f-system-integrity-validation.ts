/**
 * ETAPA F — Prova consolidada transversal: reexecuta testes críticos e provas A–E
 * sem mascarar falhas parciais. Ordem fixa; qualquer exit code != 0 encerra com erro.
 *
 * Invoca `node` diretamente (sem `npm run`) para reprodutibilidade em Windows/Linux.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const API_ROOT = path.resolve(__dirname, '../..');
const NODE = process.execPath;

function run(args: string[], env?: NodeJS.ProcessEnv): void {
  const r = spawnSync(NODE, args, {
    cwd: API_ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    console.error(
      `[ETAPA_F_FAIL] comando falhou (código ${r.status ?? 'desconhecido'}): ${NODE} ${args.join(' ')}`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // BLOCO 1 — Review real (ETAPA A): unitários + integração TRIGGER_REVIEW
  run([
    '--test',
    '-r',
    'ts-node/register',
    'src/modules/flow/adapters/snapshot-to-motor-input.test.ts',
    'src/modules/flow/adapters/motor-result-to-review-result.test.ts',
    'src/modules/flow/flow-session.service.trigger-review.integration.test.ts',
  ]);

  // BLOCO 3 — PostgreSQL real + FORCE RLS + multi-tenant (ETAPA B)
  run(['-r', 'ts-node/register', 'src/proof/etapa-b-force-rls-multitenant-validation.ts']);

  // BLOCO 1 / 4 — Freeze de regime + fluxo canônico hostil (ETAPA C)
  run(['-r', 'ts-node/register', 'src/proof/etapa-c-freeze-regime-validation.ts']);

  // BLOCO 4 — Hardening HTTP (ETAPA D)
  run(['-r', 'ts-node/register', 'src/proof/etapa-d-http-hardening-validation.ts']);

  // BLOCO 2 / 5 — Validadores + regressão canônica (ETAPA E)
  run(['-r', 'ts-node/register', 'src/proof/etapa-e-validators-validation.ts']);

  console.log('');
  console.log('[ETAPA_F_TESTS_OK]');
  console.log('[ETAPA_F_EVIDENCE] review_real=OK');
  console.log('[ETAPA_F_EVIDENCE] force_rls=OK');
  console.log('[ETAPA_F_EVIDENCE] regime_freeze=OK');
  console.log('[ETAPA_F_EVIDENCE] http_hardening=OK');
  console.log('[ETAPA_F_EVIDENCE] validators=OK');
  console.log('[ETAPA_F_EVIDENCE] regression=OK');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
