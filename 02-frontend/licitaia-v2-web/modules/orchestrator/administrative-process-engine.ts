/**
 * Serviço central do motor administrativo LICITAIA V2.
 * Pipeline DFD → ETP → TR → PRICING com travas de dependência entre módulos.
 */

import type { ModuleInputContract } from '../core/contracts/module-input.contract';
import type { ModuleOutputContract } from '../core/contracts/module-output.contract';
import type { ValidationItemContract } from '../core/contracts/validation.contract';
import type { AdministrativeEventContract } from '../core/contracts/event.contract';
import { ModuleId } from '../core/enums/module-id.enum';
import { EventType } from '../core/enums/event-type.enum';
import { ValidationSeverity } from '../core/enums/validation-severity.enum';
import { DecisionOrigin } from '../core/enums/decision-origin.enum';
import { createValidationItem } from '../core/factories/validation-result.factory';
import { createAdministrativeEvent } from '../core/factories/administrative-event.factory';
import { createDecisionMetadata } from '../core/factories/decision-metadata.factory';
import { initializeModuleRegistry } from '../registry/module.registry';
import { getModulesForPhase } from './flow-registry';
import { dispatchModule } from './flow-dispatcher';
import { checkModuleDependency } from './module-dependency';
import {
  validateCrossModuleConsistency,
  validateLegalStructure,
} from '../shared/validators';
import type { ProcessPhase } from '../core/enums/process-phase.enum';
import type { AdministrativeProcessContext } from './process-context.types';
import type {
  AdministrativeFinalStatus,
  AdministrativeProcessResult,
  ProcessStatus,
} from './process-result.types';
import type { DecisionMetadataContract } from '../core/contracts/decision-metadata.contract';
import {
  deepCloneProcessSnapshot,
  mergeModuleSuccessDataIntoSnapshot,
} from './process-snapshot.utils';
import { runClassificationPreflight } from './classification-preflight';
import { runRegimeBehaviorEngine } from '../regime-behavior-engine/regime-behavior-engine';

const ENGINE_LOG_PREFIX = '[AdministrativeProcessEngine]';

function buildModuleInput(
  context: AdministrativeProcessContext,
  moduleId: ModuleId
): ModuleInputContract {
  return {
    moduleId,
    phase: context.phase as ProcessPhase,
    payload: context.payload ?? {},
    context: {
      processId: context.processId,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId: context.correlationId,
    },
    timestamp: context.timestamp ?? new Date().toISOString(),
  };
}

function aggregateValidationsFromOutputs(
  outputs: ModuleOutputContract[]
): ValidationItemContract[] {
  const items: ValidationItemContract[] = [];
  for (const out of outputs) {
    const { result } = out;
    if (result.status === 'success') continue;
    const severity =
      result.status === 'blocked' ? ValidationSeverity.BLOCK : ValidationSeverity.ERROR;
    const code = result.codes?.[0] ?? 'MODULE_RESULT';
    const message = result.message ?? `Módulo ${out.moduleId} retornou ${result.status}`;
    items.push(
      createValidationItem(code, message, severity, {
        details: { moduleId: out.moduleId },
      })
    );
  }
  return items;
}

function aggregateEventsFromOutputs(
  outputs: ModuleOutputContract[],
  processId: string
): AdministrativeEventContract[] {
  const aggregated: AdministrativeEventContract[] = [];
  for (const out of outputs) {
    if (out.events?.length) {
      aggregated.push(...out.events);
    }
    aggregated.push(
      createAdministrativeEvent(
        EventType.COMPLIANCE,
        out.moduleId,
        'MODULE_EXECUTED',
        `Módulo ${out.moduleId} executado`,
        { processId }
      )
    );
  }
  return aggregated;
}

/**
 * Consolida metadados dos outputs em estrutura rastreável por módulo, específica
 * do motor administrativo (isolada de helpers genéricos de core).
 *
 * Política adotada para o motor:
 * - nenhum dado de módulo é "espalhado" na raiz de metadata;
 * - todos os metadados de módulos ficam sob `modulesMetadata[moduleId]`;
 * - chaves com o mesmo nome em módulos distintos são esperadas (cada módulo publica
 *   o mesmo conjunto de blocos semânticos); o isolamento é `modulesMetadata[moduleId]`.
 * - `metadataConflicts` lista apenas coincidências de nome para auditoria; não gera alerta de validação.
 */
function buildEngineBaseMetadata(
  outputs: ModuleOutputContract[]
): Record<string, unknown> {
  const modulesMetadata: Record<string, Record<string, unknown>> = {};
  const keyOwners: Record<string, Set<string>> = {};

  for (const out of outputs) {
    const raw = out.metadata;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

    const moduleId = String(out.moduleId);
    const safe = raw as Record<string, unknown>;

    if (!modulesMetadata[moduleId]) {
      modulesMetadata[moduleId] = {};
    }

    for (const [key, value] of Object.entries(safe)) {
      modulesMetadata[moduleId][key] = value;
      if (!keyOwners[key]) {
        keyOwners[key] = new Set<string>();
      }
      keyOwners[key].add(moduleId);
    }
  }

  const metadataConflicts = Object.entries(keyOwners)
    .filter(([, owners]) => owners.size > 1)
    .map(([key, owners]) => ({
      key,
      modules: Array.from(owners),
    }));

  return {
    modulesMetadata,
    metadataConflicts,
  };
}

/**
 * Ordem fixa do pipeline mínimo: DFD → ETP → TR → PRICING.
 * Garante execução estruturada mesmo que o registry retorne em outra ordem.
 */
const PIPELINE_ORDER: ModuleId[] = [
  ModuleId.DFD,
  ModuleId.ETP,
  ModuleId.TR,
  ModuleId.PRICING,
];

function getOrderedModulesForPhase(phase: string): ModuleId[] {
  const fromRegistry = getModulesForPhase(phase);
  return PIPELINE_ORDER.filter((id) => fromRegistry.includes(id));
}

/**
 * Agrega todos os metadados de decisão dos outputs e do motor (bloqueio por dependência)
 * em um único array, padrão oficial do resultado do processo.
 */
function aggregateDecisionMetadata(
  outputs: ModuleOutputContract[],
  dependencyBlockMetadata?: DecisionMetadataContract
): DecisionMetadataContract[] {
  const list: DecisionMetadataContract[] = [];
  for (const out of outputs) {
    const dm = out.metadata?.decisionMetadata as DecisionMetadataContract | undefined;
    if (dm && typeof dm === 'object' && 'origin' in dm && 'timestamp' in dm) {
      list.push(dm);
    }
  }
  if (dependencyBlockMetadata) {
    list.push(dependencyBlockMetadata);
  }
  return list;
}

/**
 * Executa o motor administrativo para o contexto dado.
 * Inicializa o registro de módulos, despacha na ordem DFD → ETP → TR → PRICING,
 * agrega resultados e interrompe em caso de bloqueio.
 */
export async function runAdministrativeProcess(
  context: AdministrativeProcessContext
): Promise<AdministrativeProcessResult> {
  initializeModuleRegistry();

  const processId = context.processId;
  const phase = context.phase as string;

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      `${ENGINE_LOG_PREFIX} Início da execução do motor. processId=${processId} phase=${phase}`
    );
  }

  const orderedModuleIds = getOrderedModulesForPhase(phase);
  const outputs: ModuleOutputContract[] = [];
  const crossValidationItems: ValidationItemContract[] = [];
  const crossValidationEvents: AdministrativeEventContract[] = [];
  const crossValidationMetadata: DecisionMetadataContract[] = [];
  const legalValidationItems: ValidationItemContract[] = [];
  const legalValidationEvents: AdministrativeEventContract[] = [];
  const legalValidationMetadata: DecisionMetadataContract[] = [];
  let haltedBy: ModuleId | undefined;
  let dependencyBlockEvent: AdministrativeEventContract | undefined;
  let dependencyBlockMetadata: ReturnType<typeof createDecisionMetadata> | undefined;
  let haltReasonType:
    | 'DEPENDENCY'
    | 'CROSS_VALIDATION'
    | 'LEGAL_VALIDATION'
    | 'MODULE_SIGNAL'
    | 'CLASSIFICATION_PREFLIGHT'
    | 'REGIME_BEHAVIOR_ENGINE'
    | undefined;
  let haltReasonCode: string | undefined;
  let haltReasonMessage: string | undefined;

  const processSnapshot = deepCloneProcessSnapshot(context.payload ?? {});
  const preflight = runClassificationPreflight(processSnapshot);
  if (preflight.ok === false) {
    const preflightItem = createValidationItem(
      preflight.code,
      preflight.message,
      ValidationSeverity.BLOCK,
      { details: { phase: 'CLASSIFICATION_PREFLIGHT' } }
    );
    const preflightDm = createDecisionMetadata(DecisionOrigin.SYSTEM, {
      ruleId: preflight.code,
      rationale: preflight.message,
      payload: { phase: 'CLASSIFICATION_PREFLIGHT', processId },
    });
    const preflightEvent = createAdministrativeEvent(
      EventType.VALIDATION,
      ModuleId.DFD,
      'CLASSIFICATION_PREFLIGHT_BLOCK',
      preflight.message,
      { processId, payload: { code: preflight.code } }
    );
    return {
      success: false,
      status: 'halted',
      outputs: [],
      moduleOutputs: [],
      validations: [preflightItem],
      events: [preflightEvent],
      metadata: {
        processSnapshot: deepCloneProcessSnapshot(processSnapshot),
        decisionMetadata: [preflightDm],
      },
      decisionMetadata: [preflightDm],
      legalTrace: [],
      halted: true,
      haltedBy: ModuleId.DFD,
      haltedDetail: {
        moduleId: ModuleId.DFD,
        type: 'VALIDATION',
        origin: 'CLASSIFICATION_PREFLIGHT',
        code: preflight.code,
        message: preflight.message,
      },
      finalStatus: 'HALTED_BY_VALIDATION',
      executedModules: [],
      processSnapshot: deepCloneProcessSnapshot(processSnapshot),
    };
  }

  const regimeBehavior = runRegimeBehaviorEngine({
    processSnapshot,
    execution: context.execution,
  });

  if (regimeBehavior.decision.canProceed === false) {
    const codes = regimeBehavior.decision.blockingReasonCodes;
    const primaryCode = codes[0] ?? 'REGIME_BEHAVIOR_BLOCK';
    const rbItem = createValidationItem(
      primaryCode,
      `Bloqueio normativo de regime (${codes.join(', ')}).`,
      ValidationSeverity.BLOCK,
      { details: { phase: 'REGIME_BEHAVIOR_ENGINE', codes } }
    );
    const rbDm = createDecisionMetadata(DecisionOrigin.SYSTEM, {
      ruleId: primaryCode,
      rationale: 'Regime behavior engine bloqueou progressão por política normativa.',
      payload: {
        phase: 'REGIME_BEHAVIOR_ENGINE',
        processId,
        audit: regimeBehavior.audit,
      },
    });
    const rbEvent = createAdministrativeEvent(
      EventType.VALIDATION,
      ModuleId.DFD,
      'REGIME_BEHAVIOR_ENGINE_BLOCK',
      `Bloqueio normativo de regime (${codes.join(', ')}).`,
      { processId, payload: { codes } }
    );
    return {
      success: false,
      status: 'halted',
      outputs: [],
      moduleOutputs: [],
      validations: [rbItem],
      events: [rbEvent],
      metadata: {
        processSnapshot: deepCloneProcessSnapshot(processSnapshot),
        decisionMetadata: [rbDm],
        regimeBehavior,
      },
      decisionMetadata: [rbDm],
      legalTrace: [],
      halted: true,
      haltedBy: ModuleId.DFD,
      haltedDetail: {
        moduleId: ModuleId.DFD,
        type: 'VALIDATION',
        origin: 'REGIME_BEHAVIOR_ENGINE',
        code: primaryCode,
        message: rbItem.message,
      },
      finalStatus: 'HALTED_BY_VALIDATION',
      executedModules: [],
      processSnapshot: deepCloneProcessSnapshot(processSnapshot),
    };
  }

  for (const moduleId of orderedModuleIds) {
    const dependencyCheck = checkModuleDependency(moduleId, outputs);
    if (dependencyCheck.satisfied === false) {
      dependencyBlockEvent = createAdministrativeEvent(
        EventType.COMPLIANCE,
        moduleId,
        dependencyCheck.code,
        dependencyCheck.message,
        {
          processId,
          payload: {
            dependentModule: dependencyCheck.dependentModule,
            phase,
          },
        }
      );
      dependencyBlockMetadata = createDecisionMetadata(DecisionOrigin.SYSTEM, {
        ruleId: 'MODULE_DEPENDENCY_BLOCK',
        rationale: dependencyCheck.message,
        payload: {
          moduleThatTriedToRun: moduleId,
          dependentModule: dependencyCheck.dependentModule,
          reason: dependencyCheck.message,
          phase,
        },
      });
      // Precedência causal:
      // - se já houve bloqueio jurídico ou de validação cruzada, essa causa raiz
      //   deve prevalecer sobre a consequência de dependência;
      // - se não houver causa anterior, ou se for apenas sinal de módulo,
      //   a dependência passa a ser a causa principal.
      if (
        haltReasonType === undefined ||
        haltReasonType === 'MODULE_SIGNAL' ||
        haltReasonType === 'DEPENDENCY'
      ) {
        haltedBy = moduleId;
        haltReasonType = 'DEPENDENCY';
        haltReasonCode = dependencyCheck.code;
        haltReasonMessage = dependencyCheck.message;
      }
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(
          `${ENGINE_LOG_PREFIX} Bloqueio por dependência. módulo=${moduleId} dependente=${dependencyCheck.dependentModule}`
        );
      }
      break;
    }

    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`${ENGINE_LOG_PREFIX} Início da execução do módulo: ${moduleId}`);
    }

    const input = buildModuleInput(context, moduleId);
    const output = await dispatchModule(moduleId, input);
    outputs.push(output);

    if (output.result.status === 'success') {
      mergeModuleSuccessDataIntoSnapshot(processSnapshot, output.result.data);
    }

    const previousOutput =
      outputs.length > 1 ? outputs[outputs.length - 2]! : null;

    if (output.result.status === 'success') {
      const crossResult = validateCrossModuleConsistency(
        moduleId,
        output,
        previousOutput,
        processSnapshot,
        processId
      );
      if (
        crossResult.validationItems.length > 0 ||
        crossResult.events.length > 0 ||
        crossResult.decisionMetadata.length > 0
      ) {
        crossValidationItems.push(...crossResult.validationItems);
        crossValidationEvents.push(...crossResult.events);
        crossValidationMetadata.push(...crossResult.decisionMetadata);
      }
      if (crossResult.hasBlocking) {
        haltedBy = moduleId;
        haltReasonType = 'CROSS_VALIDATION';
        const blockingItem = crossResult.validationItems.find(
          (item) => item.severity === ValidationSeverity.BLOCK
        );
        haltReasonCode = blockingItem?.code ?? 'CROSS_MODULE_VALIDATION_BLOCK';
        haltReasonMessage =
          blockingItem?.message ??
          `Bloqueio por validação cruzada no módulo ${moduleId}.`;
        if (typeof console !== 'undefined' && console.debug) {
          console.debug(
            `${ENGINE_LOG_PREFIX} Bloqueio por validação cruzada. módulo=${moduleId}`
          );
        }
        break;
      }

      const legalResult = validateLegalStructure(
        moduleId,
        output,
        processSnapshot,
        processId
      );
      if (
        legalResult.validationItems.length > 0 ||
        legalResult.events.length > 0 ||
        legalResult.decisionMetadata.length > 0
      ) {
        legalValidationItems.push(...legalResult.validationItems);
        legalValidationEvents.push(...legalResult.events);
        legalValidationMetadata.push(...legalResult.decisionMetadata);
      }
      if (legalResult.hasBlocking) {
        haltedBy = moduleId;
        haltReasonType = 'LEGAL_VALIDATION';
        const blockingItem = legalResult.validationItems.find(
          (item) => item.severity === ValidationSeverity.BLOCK
        );
        haltReasonCode = blockingItem?.code ?? 'LEGAL_VALIDATION_BLOCK';
        haltReasonMessage =
          blockingItem?.message ??
          `Bloqueio por validação jurídica no módulo ${moduleId}.`;
        if (typeof console !== 'undefined' && console.debug) {
          console.debug(
            `${ENGINE_LOG_PREFIX} Bloqueio por validação jurídica. módulo=${moduleId}`
          );
        }
        break;
      }
    }

    if (output.shouldHalt) {
      // Marca bloqueio por sinal explícito do módulo, mas permite que o próximo
      // módulo avalie a dependência e eventualmente reclassifique o motivo como
      // bloqueio por dependência, caso aplicável.
      haltedBy = output.moduleId;
      haltReasonType = 'MODULE_SIGNAL';
      const result = output.result;
      haltReasonCode = result?.codes?.[0] ?? 'MODULE_SIGNAL_HALT';
      haltReasonMessage =
        result?.message ??
        `Módulo ${output.moduleId} sinalizou interrupção do fluxo.`;
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(
          `${ENGINE_LOG_PREFIX} Interrupção do fluxo por módulo. haltedBy=${haltedBy}`
        );
      }
      // Não fazemos break aqui: o próximo módulo verá a dependência quebrada
      // via checkModuleDependency e poderá classificar adequadamente como
      // HALTED_BY_DEPENDENCY sem executar novos módulos.
    }
  }

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      `${ENGINE_LOG_PREFIX} Término da execução. processId=${processId} halted=${!!haltedBy}`
    );
  }

  const baseMetadata = buildEngineBaseMetadata(outputs);

  const validations = [
    ...aggregateValidationsFromOutputs(outputs),
    ...crossValidationItems,
    ...legalValidationItems,
  ];
  const events = aggregateEventsFromOutputs(outputs, processId);
  events.push(...crossValidationEvents);
  events.push(...legalValidationEvents);
  if (dependencyBlockEvent) {
    events.push(dependencyBlockEvent);
  }
  const decisionMetadata = [
    ...aggregateDecisionMetadata(outputs, dependencyBlockMetadata),
    ...crossValidationMetadata,
    ...legalValidationMetadata,
  ];
  const metadata: Record<string, unknown> = {
    ...baseMetadata,
    decisionMetadata,
    processSnapshot: deepCloneProcessSnapshot(processSnapshot),
    regimeBehavior,
  };
  const legalTrace: Record<string, unknown>[] = [];
  for (const dm of decisionMetadata) {
    const payload = (dm as unknown as { payload?: unknown }).payload;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const maybeLegalTrace = (payload as Record<string, unknown>)['legalTrace'];
      if (maybeLegalTrace && typeof maybeLegalTrace === 'object') {
        legalTrace.push(maybeLegalTrace as Record<string, unknown>);
      }
    }
  }
  if (legalTrace.length > 0) {
    metadata.legalTrace = legalTrace;
  }

  let halted = !!haltedBy;
  const allModulesSuccessful = outputs.every((o) => o.result.status === 'success');
  const success = !halted && allModulesSuccessful;

  // Invariante defensiva: não permitir cenário de failure sem halted.
  // Se algum módulo falhou mas o fluxo não foi marcado como interrompido,
  // promovemos esse cenário a halted por sinal de módulo.
  if (!halted && !allModulesSuccessful) {
    const firstFailed = outputs.find((o) => o.result.status !== 'success');
    if (firstFailed) {
      halted = true;
      haltedBy = firstFailed.moduleId;
      haltReasonType = 'MODULE_SIGNAL';
      const result = firstFailed.result;
      haltReasonCode = result?.codes?.[0] ?? 'MODULE_RESULT_FAILURE';
      haltReasonMessage =
        result?.message ?? `Módulo ${firstFailed.moduleId} retornou status ${result.status}.`;
    }
  }

  const status: ProcessStatus = halted ? 'halted' : success ? 'success' : 'failure';
  let finalStatus: AdministrativeFinalStatus;
  if (!halted && success) {
    finalStatus = 'SUCCESS';
  } else if (haltReasonType === 'DEPENDENCY') {
    finalStatus = 'HALTED_BY_DEPENDENCY';
  } else if (
    haltReasonType === 'CROSS_VALIDATION' ||
    haltReasonType === 'LEGAL_VALIDATION' ||
    haltReasonType === 'CLASSIFICATION_PREFLIGHT' ||
    haltReasonType === 'REGIME_BEHAVIOR_ENGINE'
  ) {
    finalStatus = 'HALTED_BY_VALIDATION';
  } else if (haltReasonType === 'MODULE_SIGNAL') {
    finalStatus = 'HALTED_BY_MODULE';
  } else {
    // Fallback defensivo: qualquer cenário não mapeado é interpretado como
    // interrupção por módulo, nunca como SUCCESS.
    finalStatus = 'HALTED_BY_MODULE';
  }

  const result: AdministrativeProcessResult = {
    success,
    status,
    outputs,
    moduleOutputs: outputs,
    validations,
    events,
    metadata,
    decisionMetadata,
    legalTrace,
    halted,
    haltedBy,
    haltedDetail:
      halted && haltedBy
        ? {
            moduleId: haltedBy,
            type:
              haltReasonType === 'DEPENDENCY'
                ? 'DEPENDENCY'
                : haltReasonType === 'CROSS_VALIDATION' ||
                    haltReasonType === 'LEGAL_VALIDATION' ||
                    haltReasonType === 'CLASSIFICATION_PREFLIGHT' ||
                    haltReasonType === 'REGIME_BEHAVIOR_ENGINE'
                  ? 'VALIDATION'
                  : 'MODULE',
            origin: haltReasonType ?? 'MODULE_SIGNAL',
            code: haltReasonCode,
            message: haltReasonMessage,
          }
        : undefined,
    finalStatus,
    executedModules: outputs.map((o) => o.moduleId),
    processSnapshot: deepCloneProcessSnapshot(processSnapshot),
  };

  return result;
}
