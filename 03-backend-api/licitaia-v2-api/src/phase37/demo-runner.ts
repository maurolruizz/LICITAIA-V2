/**
 * FASE 37 — DECYON / LICITAIA V2
 * Runner oficial de demonstração institucional.
 *
 * Executa os cenários canônicos de demonstração selecionados (DEMO-D1 a DEMO-D4),
 * com saída legível, repetível e auditável — pronta para apresentação ao BrazilLAB
 * e para futura integração em fluxo ponta a ponta.
 *
 * Uso:
 *   npx ts-node src/phase37/demo-runner.ts
 */

import type { AdministrativeProcessResult } from '../dto/administrative-process.types';
import { DEMO_CATALOG, DEMO_CATALOG_SUMMARY } from './demo-catalog';
import type { DemoScenarioEntry, DemoClassification } from './demo-catalog';
import { getRunAdministrativeProcess } from '../lib/frontend-core-loader';

// ---------------------------------------------------------------------------
// Tipos internos do runner
// ---------------------------------------------------------------------------

type DemoRunResult = {
  demoId: string;
  demoTitle: string;
  classification: DemoClassification;
  classificationLabel: string;
  whatItProves: string;
  institutionalValue: string;
  normativeStatus: string;
  normativeNote: string;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  haltedCode?: string;
  executedModules: string[];
  validationCodes: string[];
  expectationMet: boolean;
  expectationFailures: string[];
};

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const SEPARATOR = '─'.repeat(72);
const THICK_SEP = '═'.repeat(72);

function uniqueSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function extractValidationCodes(result: AdministrativeProcessResult): string[] {
  const codes = (result.validations ?? [])
    .map((v: any) => (v && typeof v.code === 'string' ? v.code : ''))
    .filter((c: string) => c.length > 0);
  return uniqueSorted(codes);
}

function extractExecutedModules(result: AdministrativeProcessResult): string[] {
  const raw = (result as any).executedModules;
  return Array.isArray(raw) ? raw.map((m: unknown) => String(m)) : [];
}

function extractHaltedBy(result: AdministrativeProcessResult): string | undefined {
  const raw = (result as any).haltedBy;
  if (typeof raw === 'string') return raw;
  if (raw != null) return String(raw);
  return undefined;
}

function extractHaltedCode(result: AdministrativeProcessResult): string | undefined {
  const raw = (result as any)?.haltedDetail?.code ?? (result as any)?.haltedDetail?.origin;
  if (typeof raw === 'string') return raw;
  if (raw != null) return String(raw);
  return undefined;
}

function validateExpectations(
  result: AdministrativeProcessResult,
  entry: DemoScenarioEntry,
  validationCodes: string[]
): string[] {
  const failures: string[] = [];
  const exp = entry.scenario.expectedObserved;

  if (exp.shouldHalt !== result.halted) {
    failures.push(`halt esperado=${exp.shouldHalt} obtido=${result.halted}`);
  }

  if (exp.expectedFinalStatus && exp.expectedFinalStatus !== result.finalStatus) {
    failures.push(`finalStatus esperado=${exp.expectedFinalStatus} obtido=${result.finalStatus}`);
  }

  if (exp.mustIncludeValidationCodes) {
    for (const code of exp.mustIncludeValidationCodes) {
      if (!validationCodes.includes(code)) {
        failures.push(`código obrigatório ausente: ${code}`);
      }
    }
  }

  if (exp.mustNotIncludeValidationCodes) {
    for (const code of exp.mustNotIncludeValidationCodes) {
      if (validationCodes.includes(code)) {
        failures.push(`código proibido presente: ${code}`);
      }
    }
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Execução de cenário individual
// ---------------------------------------------------------------------------

async function runDemoScenario(entry: DemoScenarioEntry): Promise<DemoRunResult> {
  const runAdministrativeProcess = getRunAdministrativeProcess();
  const context = entry.scenario.buildContext();
  const result = await runAdministrativeProcess(context);

  const validationCodes = extractValidationCodes(result);
  const executedModules = extractExecutedModules(result);
  const haltedBy = extractHaltedBy(result);
  const haltedCode = extractHaltedCode(result);
  const failures = validateExpectations(result, entry, validationCodes);

  return {
    demoId: entry.demoId,
    demoTitle: entry.demoTitle,
    classification: entry.classification,
    classificationLabel: entry.classificationLabel,
    whatItProves: entry.whatItProves,
    institutionalValue: entry.institutionalValue,
    normativeStatus: entry.scenario.normative.status,
    normativeNote: entry.scenario.normative.note,
    finalStatus: result.finalStatus,
    halted: result.halted,
    haltedBy,
    haltedCode,
    executedModules,
    validationCodes,
    expectationMet: failures.length === 0,
    expectationFailures: failures,
  };
}

// ---------------------------------------------------------------------------
// Formatação de saída
// ---------------------------------------------------------------------------

function printDemoHeader(): void {
  console.log(THICK_SEP);
  console.log('DECYON — FASE 37: Demonstração Funcional Institucional');
  console.log('Runner: execução real dos cenários canônicos de demonstração');
  console.log(`Data: ${new Date().toISOString().split('T')[0]}`);
  console.log(THICK_SEP);
  console.log('');
  console.log(`Cenários selecionados: ${DEMO_CATALOG_SUMMARY.totalScenarios}`);
  console.log(`  SOLID (sucesso homologável): ${DEMO_CATALOG_SUMMARY.solidCount}`);
  console.log(`  PARTIAL (cobertura parcial): ${DEMO_CATALOG_SUMMARY.partialCount}`);
  console.log('');
}

function printScenarioResult(run: DemoRunResult, index: number): void {
  const status = run.expectationMet ? '✓ OK' : '✗ FAIL';
  const haltLine = run.halted
    ? `HALT  →  ${run.haltedBy ?? 'N/A'}${run.haltedCode ? ` | código: ${run.haltedCode}` : ''}`
    : 'SEM HALT (pipeline concluído)';

  console.log(SEPARATOR);
  console.log(`[${status}]  ${run.demoId}  —  ${run.demoTitle}`);
  console.log(SEPARATOR);
  console.log(`Classificação : ${run.classificationLabel}`);
  console.log(`Status motor  : ${run.finalStatus}  |  ${haltLine}`);
  console.log(`Normativo     : ${run.normativeStatus}  —  ${run.normativeNote}`);
  console.log('');
  console.log(`Módulos executados : ${run.executedModules.join(' → ') || '(nenhum registrado)'}`);
  console.log(
    `Validações (${run.validationCodes.length}) : ${run.validationCodes.join(' | ') || '(nenhuma)'}`
  );
  console.log('');
  console.log(`O que prova  : ${run.whatItProves}`);
  console.log('');
  console.log(`Valor inst.  : ${run.institutionalValue}`);
  console.log('');
  if (!run.expectationMet) {
    console.log(`⚠ FALHAS DE EXPECTATIVA:`);
    for (const f of run.expectationFailures) {
      console.log(`  - ${f}`);
    }
    console.log('');
  }
}

function printDemoSummary(runs: DemoRunResult[]): void {
  const ok = runs.filter((r) => r.expectationMet).length;
  const fail = runs.length - ok;
  const solidPassed = runs.filter((r) => r.normativeStatus === 'SOLID' && r.expectationMet).map((r) => r.demoId);
  const partialPassed = runs.filter((r) => r.normativeStatus === 'PARTIAL' && r.expectationMet).map((r) => r.demoId);
  const halted = runs.filter((r) => r.halted).map((r) => r.demoId);
  const notHalted = runs.filter((r) => !r.halted).map((r) => r.demoId);

  console.log(THICK_SEP);
  console.log('RESUMO DA DEMONSTRAÇÃO FASE 37');
  console.log(THICK_SEP);
  console.log(`Cenários executados : ${runs.length}`);
  console.log(`Expectativas OK     : ${ok}`);
  console.log(`Expectativas FAIL   : ${fail}`);
  console.log('');
  console.log(`Cenários SOLID passados  : ${solidPassed.length ? solidPassed.join(', ') : '(nenhum)'}`);
  console.log(`Cenários PARTIAL passados: ${partialPassed.length ? partialPassed.join(', ') : '(nenhum)'}`);
  console.log('');
  console.log(`Com HALT (bloqueio)  : ${halted.length ? halted.join(', ') : '(nenhum)'}`);
  console.log(`Sem HALT (completos) : ${notHalted.length ? notHalted.join(', ') : '(nenhum)'}`);
  console.log('');

  console.log('O que já pode ser demonstrado institucionalmente:');
  const solidRuns = runs.filter((r) => r.normativeStatus === 'SOLID' && r.expectationMet);
  for (const r of solidRuns) {
    console.log(`  ✓ ${r.demoId}: ${r.demoTitle}`);
  }
  console.log('');

  console.log('O que demonstra inteligência de bloqueio legítimo:');
  const blockRuns = runs.filter((r) => r.halted && r.expectationMet);
  for (const r of blockRuns) {
    console.log(`  ✓ ${r.demoId}: ${r.demoTitle}`);
    if (r.validationCodes.length > 0) {
      console.log(`    código: ${r.validationCodes.join(', ')}`);
    }
  }
  console.log('');

  console.log('O que ainda é parcial (honestamente declarado):');
  const partialRuns = runs.filter((r) => r.normativeStatus === 'PARTIAL' && r.expectationMet);
  for (const r of partialRuns) {
    console.log(`  ~ ${r.demoId}: ${r.normativeNote}`);
  }
  console.log('');

  if (fail === 0) {
    console.log('✓ REGRESSÃO ZERO — todos os cenários de demonstração passaram na expectativa canônica.');
  } else {
    console.log(`⚠ ATENÇÃO: ${fail} cenário(s) falharam na expectativa canônica. Revisar antes de apresentar.`);
  }
  console.log(THICK_SEP);
}

function printJsonReport(runs: DemoRunResult[]): void {
  const report = {
    phase: 37,
    runDate: new Date().toISOString(),
    scenarioCount: runs.length,
    passed: runs.filter((r) => r.expectationMet).length,
    failed: runs.filter((r) => !r.expectationMet).length,
    regressionZero: runs.every((r) => r.expectationMet),
    runs: runs.map((r) => ({
      demoId: r.demoId,
      classification: r.classification,
      normativeStatus: r.normativeStatus,
      finalStatus: r.finalStatus,
      halted: r.halted,
      haltedBy: r.haltedBy,
      validationCodes: r.validationCodes,
      executedModules: r.executedModules,
      expectationMet: r.expectationMet,
      expectationFailures: r.expectationFailures,
    })),
  };

  console.log('');
  console.log('RELATORIO_JSON_FASE37');
  console.log(JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printDemoHeader();

  const runs: DemoRunResult[] = [];
  for (const entry of DEMO_CATALOG) {
    const run = await runDemoScenario(entry);
    runs.push(run);
    printScenarioResult(run, runs.length);
  }

  printDemoSummary(runs);
  printJsonReport(runs);

  const anyFailed = runs.some((r) => !r.expectationMet);
  if (anyFailed) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Runner Fase 37 falhou com erro inesperado:', err);
  process.exitCode = 1;
});
