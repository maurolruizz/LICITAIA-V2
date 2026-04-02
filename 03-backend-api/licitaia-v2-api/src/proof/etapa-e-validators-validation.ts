/**
 * ETAPA E — Prova executável: base legal estrutural + coerência cross-module (motor real).
 */

import assert from 'assert';
import { CANONICAL_SCENARIOS } from '../phase35/canonical-scenarios';
import type { AdministrativeProcessContext, AdministrativeProcessResult } from '../dto/administrative-process.types';
import { getRunAdministrativeProcess } from '../lib/frontend-core-loader';

type AnyRec = Record<string, unknown>;

function mustScenario(id: string): AdministrativeProcessContext {
  const found = CANONICAL_SCENARIOS.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Cenario canonico nao encontrado: ${id}`);
  }
  return found.buildContext();
}

function codes(result: AdministrativeProcessResult): string[] {
  return (result.validations ?? [])
    .map((v) => (v as AnyRec).code)
    .filter((c): c is string => typeof c === 'string');
}

function clonePayload(ctx: AdministrativeProcessContext): AdministrativeProcessContext {
  return {
    ...ctx,
    payload: { ...(ctx.payload as AnyRec) },
  };
}

async function main(): Promise<void> {
  const runAdministrativeProcess = getRunAdministrativeProcess();

  // --- Cenário 1: base legal inválida (texto genérico; bloqueio no motor de regime) ---
  const s5 = mustScenario('S5_DISPENSA_SEM_BASE_LEGAL_WARNING');
  const rInvalidLegal = await runAdministrativeProcess(s5);
  assert.strictEqual(rInvalidLegal.halted, true);
  assert.strictEqual(rInvalidLegal.finalStatus, 'HALTED_BY_VALIDATION');
  assert.ok(
    codes(rInvalidLegal).includes('REGIME_FUNDAMENTO_MINIMO_AUSENTE'),
    'esperado REGIME_FUNDAMENTO_MINIMO_AUSENTE para base legal sem estrutura normativa'
  );

  // --- Cenário 2: base legal válida (referência concreta) ---
  const s1 = mustScenario('S1_LICITACAO_MATERIAL_CONSUMO_ITEM_UNICO_ENTREGA_UNICA');
  const rValid = await runAdministrativeProcess(s1);
  assert.strictEqual(rValid.halted, false);
  assert.strictEqual(rValid.finalStatus, 'SUCCESS');

  // --- Cenário 3: inconsistência cross-module (DFD vs ETP sem overlap lexical) ---
  const cross = clonePayload(s1);
  const p = cross.payload as AnyRec;
  p['needDescription'] =
    'Serviço totalmente distinto: limpeza hospitalar especializada sem relação com o objeto da demanda.';
  p['solutionSummary'] =
    'Contratação de equipe de limpeza para ambiente hospitalar em caráter emergencial.';
  const rCross = await runAdministrativeProcess(cross);
  assert.strictEqual(rCross.halted, true);
  assert.strictEqual(rCross.finalStatus, 'HALTED_BY_VALIDATION');
  assert.ok(
    codes(rCross).includes('CROSS_MODULE_INCONSISTENCY'),
    'esperado CROSS_MODULE_INCONSISTENCY para descrições incoerentes entre módulos'
  );

  // --- Cenário 4: regressão — fluxo canônico de sucesso preservado ---
  const rRegression = await runAdministrativeProcess(s1);
  assert.strictEqual(rRegression.halted, false);
  assert.strictEqual(rRegression.finalStatus, 'SUCCESS');

  console.log('[ETAPA_E_VALIDATORS_OK]');
  console.log('[ETAPA_E_EVIDENCE] legal_basis_validation=OK');
  console.log('[ETAPA_E_EVIDENCE] cross_module_validation=OK');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
