import { CANONICAL_SCENARIOS } from '../phase35/canonical-scenarios';
import type { AdministrativeProcessContext, AdministrativeProcessResult } from '../dto/administrative-process.types';
import {
  getFrontendCoreRuntimeInfo,
  getRunAdministrativeProcess,
} from '../lib/frontend-core-loader';

type CheckMap = Record<string, boolean>;

function mustScenario(id: string): AdministrativeProcessContext {
  const found = CANONICAL_SCENARIOS.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Cenario canonico nao encontrado: ${id}`);
  }
  return found.buildContext();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function cloneContext(ctx: AdministrativeProcessContext): AdministrativeProcessContext {
  return {
    ...ctx,
    payload: { ...ctx.payload },
  };
}

function codes(result: AdministrativeProcessResult): string[] {
  return (result.validations ?? [])
    .map((v) => asRecord(v).code)
    .filter((c): c is string => typeof c === 'string');
}

function eventsWithCode(result: AdministrativeProcessResult, code: string): boolean {
  return (result.events ?? []).some((e) => asRecord(e).code === code);
}

function executed(result: AdministrativeProcessResult): string[] {
  const raw = result['executedModules'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is string => typeof m === 'string');
}

async function main(): Promise<void> {
  const runAdministrativeProcess = getRunAdministrativeProcess();
  const runtimeInfo = getFrontendCoreRuntimeInfo();

  const successCtx = mustScenario('S1_LICITACAO_MATERIAL_CONSUMO_ITEM_UNICO_ENTREGA_UNICA');
  const legalBlockCtx = mustScenario('S5_DISPENSA_SEM_BASE_LEGAL_WARNING');

  const etpWithoutBaseCtx = cloneContext(successCtx);
  delete (etpWithoutBaseCtx.payload as Record<string, unknown>)['demandDescription'];

  const trWithoutBaseCtx = cloneContext(successCtx);
  delete (trWithoutBaseCtx.payload as Record<string, unknown>)['needDescription'];

  const pricingWithoutBaseCtx = cloneContext(successCtx);
  delete (pricingWithoutBaseCtx.payload as Record<string, unknown>)['objectDescription'];

  const success = await runAdministrativeProcess(successCtx);
  const etpWithoutBase = await runAdministrativeProcess(etpWithoutBaseCtx);
  const trWithoutBase = await runAdministrativeProcess(trWithoutBaseCtx);
  const pricingWithoutBase = await runAdministrativeProcess(pricingWithoutBaseCtx);
  const legalBlock = await runAdministrativeProcess(legalBlockCtx);

  const checks: CheckMap = {
    // 1) fluxo de sucesso completo
    flow_success_complete: success.finalStatus === 'SUCCESS' && success.halted === false,

    // 2) tentativa de executar ETP sem base suficiente (DFD falha, dependencia bloqueia sequencia)
    etp_without_base_halted_by_dependency:
      etpWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      eventsWithCode(etpWithoutBase, 'MODULE_DEPENDENCY_BLOCKED'),

    // 3) tentativa de executar TR sem base suficiente (ETP falha, TR bloqueado por dependencia)
    tr_without_base_halted_by_dependency:
      trWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      eventsWithCode(trWithoutBase, 'MODULE_DEPENDENCY_BLOCKED'),

    // 4) tentativa de executar pricing sem maturidade suficiente (TR falha, PRICING bloqueado)
    pricing_without_base_halted_by_dependency:
      pricingWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      eventsWithCode(pricingWithoutBase, 'MODULE_DEPENDENCY_BLOCKED'),

    // 5) halted por validacao juridica/estrutural
    legal_validation_block:
      legalBlock.finalStatus === 'HALTED_BY_VALIDATION' &&
      codes(legalBlock).includes('LEGAL_BASIS_REQUIRED_FOR_DIRECT_REGIME'),

    // 6) halted por dependencia
    dependency_halt_semantic:
      etpWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      trWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      pricingWithoutBase.finalStatus === 'HALTED_BY_DEPENDENCY',

    // 7) coerencia entre executedModules, events, validations e finalStatus
    consistency_success:
      JSON.stringify(executed(success)) === JSON.stringify(['DFD', 'ETP', 'TR', 'PRICING']) &&
      success.events.length > 0 &&
      success.validations.length >= 0 &&
      success.finalStatus === 'SUCCESS',
    consistency_halts:
      executed(etpWithoutBase).includes('DFD') &&
      executed(trWithoutBase).includes('ETP') &&
      executed(pricingWithoutBase).includes('TR') &&
      etpWithoutBase.events.length > 0 &&
      trWithoutBase.events.length > 0 &&
      pricingWithoutBase.events.length > 0,

    // 8) superficie canonica de execucao funcionando corretamente
    canonical_surface_loader_ok:
      typeof runAdministrativeProcess === 'function' &&
      (runtimeInfo.mode === 'compiled' || runtimeInfo.mode === 'source'),

    // 9) hardening da execucao canonica resolvido (modo compilado quando exigido)
    runtime_hardening_compiled_when_required:
      (process.env['FRONTEND_CORE_RUNTIME_MODE'] ?? '').toLowerCase() !== 'compiled' ||
      runtimeInfo.mode === 'compiled',
  };

  console.log(
    JSON.stringify(
      {
        runtimeInfo,
        statuses: {
          success: success.finalStatus,
          etpWithoutBase: etpWithoutBase.finalStatus,
          trWithoutBase: trWithoutBase.finalStatus,
          pricingWithoutBase: pricingWithoutBase.finalStatus,
          legalBlock: legalBlock.finalStatus,
        },
        executedModules: {
          success: executed(success),
          etpWithoutBase: executed(etpWithoutBase),
          trWithoutBase: executed(trWithoutBase),
          pricingWithoutBase: executed(pricingWithoutBase),
        },
        checks,
      },
      null,
      2
    )
  );

  const ok = Object.values(checks).every(Boolean);
  if (!ok) {
    process.exit(1);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});

