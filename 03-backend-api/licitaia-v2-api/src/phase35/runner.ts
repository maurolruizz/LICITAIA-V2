import type { AdministrativeProcessResult } from '../dto/administrative-process.types';
import type { CanonicalScenario, ExpectedOutcome } from './canonical-scenarios';
import { CANONICAL_SCENARIOS, DERIVED_COVERAGE_MATRIX_FROM_SCENARIOS } from './canonical-scenarios';
import { formatDimensions as formatCoverageDimensions } from './coverage-matrix';

const { runAdministrativeProcess } = require(
  '../../../../02-frontend/licitaia-v2-web/modules'
) as {
  runAdministrativeProcess(context: unknown): Promise<AdministrativeProcessResult>;
};

type ScenarioRun = {
  id: string;
  name: string;
  ok: boolean;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  haltedOrigin?: string;
  validationCodes: string[];
  executedModules: string[];
  failures: string[];
  normativeStatus: string;
  normativeNote: string;
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function pickValidationCodes(result: AdministrativeProcessResult): string[] {
  const codes = (result.validations ?? [])
    .map((v: any) => (v && typeof v.code === 'string' ? v.code : ''))
    .filter((c: string) => c.length > 0);
  return uniqueSorted(codes);
}

function evaluateExpectation(result: AdministrativeProcessResult, expected: ExpectedOutcome): string[] {
  const failures: string[] = [];

  if (expected.shouldHalt !== result.halted) {
    failures.push(`halted esperado=${expected.shouldHalt} obtido=${result.halted}`);
  }

  if (expected.expectedFinalStatus && expected.expectedFinalStatus !== result.finalStatus) {
    failures.push(
      `finalStatus esperado=${expected.expectedFinalStatus} obtido=${result.finalStatus}`
    );
  }

  const codes = pickValidationCodes(result);

  if (expected.mustIncludeValidationCodes) {
    for (const code of expected.mustIncludeValidationCodes) {
      if (!codes.includes(code)) {
        failures.push(`código de validação ausente: ${code}`);
      }
    }
  }

  if (expected.mustNotIncludeValidationCodes) {
    for (const code of expected.mustNotIncludeValidationCodes) {
      if (codes.includes(code)) {
        failures.push(`código de validação presente (não esperado): ${code}`);
      }
    }
  }

  return failures;
}

function formatScenarioDimensions(s: CanonicalScenario): string {
  return formatCoverageDimensions(s.dimensions);
}

async function runScenario(s: CanonicalScenario): Promise<ScenarioRun> {
  const context = s.buildContext();
  const result = await runAdministrativeProcess(context);

  const validationCodes = pickValidationCodes(result);
  const failures = evaluateExpectation(result, s.expectedObserved);

  const haltedByRaw = (result as any).haltedBy;
  const haltedBy =
    typeof haltedByRaw === 'string'
      ? haltedByRaw
      : haltedByRaw != null
      ? String(haltedByRaw)
      : undefined;

  const haltedOriginRaw = (result as any)?.haltedDetail?.origin;
  const haltedOrigin =
    typeof haltedOriginRaw === 'string'
      ? haltedOriginRaw
      : haltedOriginRaw != null
      ? String(haltedOriginRaw)
      : undefined;

  const executedModulesRaw = (result as any).executedModules;
  const executedModules = Array.isArray(executedModulesRaw)
    ? executedModulesRaw.map((m: unknown) => String(m))
    : [];

  return {
    id: s.id,
    name: s.name,
    ok: failures.length === 0,
    finalStatus: result.finalStatus,
    halted: result.halted,
    haltedBy,
    haltedOrigin,
    validationCodes,
    executedModules,
    failures,
    normativeStatus: s.normative.status,
    normativeNote: s.normative.note,
  };
}

function printHeader(): void {
  console.log('FASE 35 — Runner de cenários canônicos (cobertura real do motor)');
  console.log('Modo: execução determinística, sem mocks, invocando runAdministrativeProcess.');
  console.log('');
}

function printScenarioLine(run: ScenarioRun, dims: string): void {
  const status = run.ok ? 'OK' : 'FAIL';
  const halt = run.halted ? `HALT(${run.haltedBy ?? 'N/A'}|${run.haltedOrigin ?? 'N/A'})` : 'NO_HALT';
  console.log(`[${status}] ${run.id}`);
  console.log(`  dims: ${dims}`);
  console.log(`  finalStatus: ${run.finalStatus} | ${halt}`);
  console.log(`  normative: ${run.normativeStatus} | ${run.normativeNote}`);
  console.log(`  executedModules: ${run.executedModules.join(' → ') || '(nenhum)'}`);
  console.log(`  validations(${run.validationCodes.length}): ${run.validationCodes.join(', ') || '(nenhuma)'}`);
  if (!run.ok) {
    console.log(`  failures: ${run.failures.join(' | ')}`);
  }
  console.log('');
}

function printCoverageMatrix(): void {
  console.log('MATRIZ_DE_COBERTURA (normativa, derivada dos cenários)');
  for (const row of DERIVED_COVERAGE_MATRIX_FROM_SCENARIOS) {
    console.log(`- ${row.coverageStatus} | ${row.scenarioId}`);
    console.log(`  dims: ${formatCoverageDimensions(row.dimensions)}`);
    console.log(`  note: ${row.note}`);
  }
  console.log('');
}

function printSummary(runs: ScenarioRun[]): void {
  const ok = runs.filter((r) => r.ok).length;
  const fail = runs.length - ok;

  const blocking = runs.filter((r) => r.halted).map((r) => r.id);
  const allValidationCodes = uniqueSorted(runs.flatMap((r) => r.validationCodes));
  const solid = runs.filter((r) => r.normativeStatus === 'SOLID').map((r) => r.id);
  const partial = runs.filter((r) => r.normativeStatus === 'PARTIAL').map((r) => r.id);
  const notCovered = runs.filter((r) => r.normativeStatus === 'NOT_COVERED').map((r) => r.id);

  console.log('RESUMO');
  console.log(`- Cenários: ${runs.length}`);
  console.log(`- Passaram: ${ok}`);
  console.log(`- Falharam: ${fail}`);
  console.log(`- SOLID: ${solid.length ? solid.join(', ') : '(nenhum)'}`);
  console.log(`- PARTIAL: ${partial.length ? partial.join(', ') : '(nenhum)'}`);
  console.log(`- NOT_COVERED: ${notCovered.length ? notCovered.join(', ') : '(nenhum)'}`);
  console.log(`- Cenários com HALT: ${blocking.length ? blocking.join(', ') : '(nenhum)'}`);
  console.log(`- Códigos de validação observados: ${allValidationCodes.join(', ') || '(nenhum)'}`);
  console.log('');
}

async function main(): Promise<void> {
  printHeader();
  printCoverageMatrix();

  const runs: ScenarioRun[] = [];
  for (const s of CANONICAL_SCENARIOS) {
    const run = await runScenario(s);
    runs.push(run);
    printScenarioLine(run, formatScenarioDimensions(s));
  }

  printSummary(runs);

  const report = {
    phase: 35,
    scenarioCount: runs.length,
    passed: runs.filter((r) => r.ok).length,
    failed: runs.filter((r) => !r.ok).length,
    runs,
  };

  console.log('RELATORIO_JSON');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('Runner Fase 35 falhou.', err);
  process.exitCode = 1;
});

