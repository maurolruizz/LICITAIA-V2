/**
 * ETAPA H — H-FI6 — Prova reexecutável de readiness controlado (build, runtime, borda, integração mínima).
 *
 * Pré-requisitos:
 * - `npm run build` já executado (gera dist/ + runtime do núcleo frontend-core).
 * - API acessível em API_BASE_URL / PROOF_BASE_URL (padrão http://localhost:3001).
 * - Para cenários auth + persistência + regressão H-FI4/H-FI5: PostgreSQL com DATABASE_URL válida,
 *   migrations/seed conforme ETAPA G, e servidor iniciado com `npm run dev` ou `npm start`.
 *
 * Execução:
 *   npx ts-node src/proof/etapa-h-fi6-readiness-controlled-environment.ts
 *
 * Variáveis opcionais:
 *   H_FI6_SKIP_HTTP=1 — pula apenas as verificações HTTP (útil em CI sem servidor); ainda exige artefato dist e FI2.
 */

import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const API_BASE_URL =
  process.env['API_BASE_URL'] || process.env['PROOF_BASE_URL'] || 'http://localhost:3001';
/** Alinhado às provas H-FI4/H-FI5 — exige PostgreSQL acessível para regressão completa. */
const DATABASE_URL =
  process.env['DATABASE_URL'] ||
  'postgresql://licitaia_app:licitaia_app@localhost:5432/licitaia_dev';
const SKIP_HTTP = process.env['H_FI6_SKIP_HTTP'] === '1';
/** Se 1, não executa FI4/FI5 mesmo com DATABASE_URL (útil quando API sobe mas banco não). */
const SKIP_DB_REGRESSION = process.env['H_FI6_SKIP_DB_REGRESSION'] === '1';

const ROOT = join(__dirname, '..', '..');
const DIST_SERVER = join(ROOT, 'dist', 'server.js');

function assertDistBuild(): void {
  if (!existsSync(DIST_SERVER)) {
    throw new Error(
      `[H-FI6] Artefato ausente: ${DIST_SERVER}. Execute npm run build no diretório licitaia-v2-api antes da prova.`,
    );
  }
}

async function httpJson(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: any; headers: Headers }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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

/** Payload mínimo canônico (subset do cenário de sucesso FI5) para POST /api/process/run sem auth. */
function minimalRunPayload(processId: string): Record<string, unknown> {
  return {
    processId,
    payload: {
      demandDescription:
        'Aquisição de material de consumo: 10 kits de cabos de rede categoria 6 para manutenção da rede interna.',
      hiringJustification:
        'Necessidade comprovada de cabos Cat6 para manutenção e expansão da rede interna do órgão.',
      administrativeObjective:
        'Garantir infraestrutura de conectividade adequada para continuidade do serviço público.',
      requestingDepartment: 'Diretoria de Tecnologia da Informação',
      requesterName: 'Gestor de Compras',
      requestDate: new Date().toISOString(),
      needDescription:
        'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente de rede institucional.',
      expectedResults: 'Aumento de produtividade e redução de falhas por obsolescência de cabeamento.',
      solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores homologados.',
      technicalJustification:
        'Especificações técnicas de cabos Cat6 com conectores e padrões ANSI/TIA aplicáveis.',
      analysisDate: new Date().toISOString(),
      responsibleAnalyst: 'Analista de Planejamento de Contratações',
      objectDescription: 'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
      contractingPurpose:
        'Garantir aquisição dos kits de cabos Cat6 para manutenção e expansão da rede interna.',
      technicalRequirements: 'Cabos Cat6 com conectores; atender padrões ANSI/TIA.',
      executionConditions: 'Entrega única em até 15 dias corridos.',
      acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
      referenceDate: new Date().toISOString(),
      responsibleAuthor: 'Responsável pelo Termo de Referência',
      pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
      referenceItemsDescription: 'Kits de cabos de rede Cat6 com conectores (material de consumo).',
      estimatedUnitValue: 100,
      estimatedTotalValue: 1000,
      pricingJustification:
        'Pesquisa de mercado em três fornecedores distintos para kits de cabos Cat6.',
      legalRegime: 'LICITACAO',
      objectType: 'MATERIAL_CONSUMO',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'ENTREGA_UNICA',
      procurementStrategy: {
        targetType: 'process',
        procurementModality: 'PREGAO',
        competitionStrategy: 'OPEN_COMPETITION',
        divisionStrategy: 'SINGLE_CONTRACT',
        contractingJustification:
          'Licitação na modalidade pregão, visando competição ampla e proposta mais vantajosa.',
      },
      administrativeJustification: {
        targetType: 'process',
        problemStatement: 'Necessidade de material de consumo para conectividade de rede interna.',
        administrativeNeed: 'Garantir cabos Cat6 para manutenção e expansão do ambiente de rede.',
        expectedOutcome: 'Conectividade estável e suporte às demandas operacionais do órgão.',
      },
    },
  };
}

async function assertHttpLayer(): Promise<void> {
  const health = await httpJson('GET', '/health');
  if (health.status !== 200 || health.json?.status !== 'ok') {
    throw new Error(
      `[H-FI6] GET /health falhou (${health.status}). Inicie a API: npm run dev ou npm start em licitaia-v2-api.`,
    );
  }

  const diag = await httpJson('GET', '/diagnostics');
  if (diag.status !== 200 || diag.json?.kind !== 'operational-diagnostics') {
    throw new Error(`[H-FI6] GET /diagnostics falhou (${diag.status}).`);
  }

  const preflight = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type, authorization, x-request-id',
    },
  });
  if (preflight.status !== 204) {
    throw new Error(`[H-FI6] CORS preflight OPTIONS falhou (HTTP ${preflight.status}).`);
  }
  const allowHeaders = preflight.headers.get('access-control-allow-headers') ?? '';
  if (!allowHeaders.toLowerCase().includes('x-request-id')) {
    throw new Error(
      `[H-FI6] CORS: access-control-allow-headers deve incluir x-request-id (obtido: "${allowHeaders}").`,
    );
  }

  const pid = `HFI6-RUN-${Date.now()}`;
  const run = await httpJson('POST', '/api/process/run', minimalRunPayload(pid), {
    'x-request-id': `hfi6-${Date.now()}`,
  });
  if (run.status !== 200) {
    throw new Error(
      `[H-FI6] POST /api/process/run (público, motor) esperado 200, obteve ${run.status}.`,
    );
  }
  if (run.json?.success !== true || run.json?.process?.status !== 'success') {
    throw new Error('[H-FI6] Resposta canônica de sucesso do motor não confirmada.');
  }
}

function runFi2Regression(): void {
  execSync('npx ts-node src/proof/etapa-h-fi2-flow-hardening-validation.ts', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

function runFi5Regression(): void {
  execSync('npx ts-node src/proof/etapa-h-fi5-contract-surface-audit.ts', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API_BASE_URL, DATABASE_URL },
  });
}

function runFi4Regression(): void {
  execSync('npx ts-node src/proof/etapa-h-fi4-audit-trace.ts', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API_BASE_URL, DATABASE_URL },
  });
}

async function main(): Promise<void> {
  console.log('[H-FI6] Caminho canônico de build: npm run build (licitaia-v2-api)');
  console.log('[H-FI6] Caminho canônico de runtime: npm run dev | npm start (dist/server.js)');
  console.log('[H-FI6] Frontend oficial demo: node server.js em 02-frontend/licitaia-v2-demo (porta 3000)');
  console.log('');

  assertDistBuild();
  console.log('[H-FI6] OK — dist/server.js presente (build refletido).');

  runFi2Regression();
  console.log('[H-FI6] OK — regressão H-FI2 (motor / loader).');

  if (SKIP_HTTP) {
    console.log('[H-FI6] AVISO — H_FI6_SKIP_HTTP=1: pulando HTTP, FI4 e FI5 (exigem API + PostgreSQL).');
    return;
  }

  await assertHttpLayer();
  console.log('[H-FI6] OK — health, diagnostics, CORS preflight, POST /api/process/run.');

  if (SKIP_DB_REGRESSION) {
    console.log(
      '[H-FI6] AVISO — H_FI6_SKIP_DB_REGRESSION=1: pulando H-FI4/H-FI5 (persistência e auditoria de borda).',
    );
    console.log('[H-FI6] Prova parcial concluída (build + FI2 + HTTP).');
    return;
  }

  try {
    runFi5Regression();
    console.log('[H-FI6] OK — regressão H-FI5.');
  } catch (e) {
    console.error(
      '[H-FI6] Falha na regressão H-FI5 — PostgreSQL, migrations/seed, API e credenciais de prova devem estar alinhados.',
      e,
    );
    process.exit(1);
  }

  try {
    runFi4Regression();
    console.log('[H-FI6] OK — regressão H-FI4.');
  } catch (e) {
    console.error('[H-FI6] Falha na regressão H-FI4:', e);
    process.exit(1);
  }

  console.log('');
  console.log('[H-FI6] Prova de readiness controlado concluída com sucesso (inclui FI4/FI5).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
