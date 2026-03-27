"use strict";
/**
 * Serviço central do motor administrativo LICITAIA V2.
 * Pipeline DFD → ETP → TR → PRICING com travas de dependência entre módulos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAdministrativeProcess = runAdministrativeProcess;
const module_id_enum_1 = require("../core/enums/module-id.enum");
const event_type_enum_1 = require("../core/enums/event-type.enum");
const validation_severity_enum_1 = require("../core/enums/validation-severity.enum");
const decision_origin_enum_1 = require("../core/enums/decision-origin.enum");
const validation_result_factory_1 = require("../core/factories/validation-result.factory");
const administrative_event_factory_1 = require("../core/factories/administrative-event.factory");
const decision_metadata_factory_1 = require("../core/factories/decision-metadata.factory");
const module_registry_1 = require("../registry/module.registry");
const flow_registry_1 = require("./flow-registry");
const flow_dispatcher_1 = require("./flow-dispatcher");
const module_dependency_1 = require("./module-dependency");
const validators_1 = require("../shared/validators");
const process_snapshot_utils_1 = require("./process-snapshot.utils");
const classification_preflight_1 = require("./classification-preflight");
const ENGINE_LOG_PREFIX = '[AdministrativeProcessEngine]';
function buildModuleInput(context, moduleId) {
    return {
        moduleId,
        phase: context.phase,
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
function aggregateValidationsFromOutputs(outputs) {
    const items = [];
    for (const out of outputs) {
        const { result } = out;
        if (result.status === 'success')
            continue;
        const severity = result.status === 'blocked' ? validation_severity_enum_1.ValidationSeverity.BLOCK : validation_severity_enum_1.ValidationSeverity.ERROR;
        const code = result.codes?.[0] ?? 'MODULE_RESULT';
        const message = result.message ?? `Módulo ${out.moduleId} retornou ${result.status}`;
        items.push((0, validation_result_factory_1.createValidationItem)(code, message, severity, {
            details: { moduleId: out.moduleId },
        }));
    }
    return items;
}
function aggregateEventsFromOutputs(outputs, processId) {
    const aggregated = [];
    for (const out of outputs) {
        if (out.events?.length) {
            aggregated.push(...out.events);
        }
        aggregated.push((0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.COMPLIANCE, out.moduleId, 'MODULE_EXECUTED', `Módulo ${out.moduleId} executado`, { processId }));
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
function buildEngineBaseMetadata(outputs) {
    const modulesMetadata = {};
    const keyOwners = {};
    for (const out of outputs) {
        const raw = out.metadata;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            continue;
        const moduleId = String(out.moduleId);
        const safe = raw;
        if (!modulesMetadata[moduleId]) {
            modulesMetadata[moduleId] = {};
        }
        for (const [key, value] of Object.entries(safe)) {
            modulesMetadata[moduleId][key] = value;
            if (!keyOwners[key]) {
                keyOwners[key] = new Set();
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
const PIPELINE_ORDER = [
    module_id_enum_1.ModuleId.DFD,
    module_id_enum_1.ModuleId.ETP,
    module_id_enum_1.ModuleId.TR,
    module_id_enum_1.ModuleId.PRICING,
];
function getOrderedModulesForPhase(phase) {
    const fromRegistry = (0, flow_registry_1.getModulesForPhase)(phase);
    return PIPELINE_ORDER.filter((id) => fromRegistry.includes(id));
}
/**
 * Agrega todos os metadados de decisão dos outputs e do motor (bloqueio por dependência)
 * em um único array, padrão oficial do resultado do processo.
 */
function aggregateDecisionMetadata(outputs, dependencyBlockMetadata) {
    const list = [];
    for (const out of outputs) {
        const dm = out.metadata?.decisionMetadata;
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
async function runAdministrativeProcess(context) {
    (0, module_registry_1.initializeModuleRegistry)();
    const processId = context.processId;
    const phase = context.phase;
    if (typeof console !== 'undefined' && console.debug) {
        console.debug(`${ENGINE_LOG_PREFIX} Início da execução do motor. processId=${processId} phase=${phase}`);
    }
    const orderedModuleIds = getOrderedModulesForPhase(phase);
    const outputs = [];
    const crossValidationItems = [];
    const crossValidationEvents = [];
    const crossValidationMetadata = [];
    const legalValidationItems = [];
    const legalValidationEvents = [];
    const legalValidationMetadata = [];
    let haltedBy;
    let dependencyBlockEvent;
    let dependencyBlockMetadata;
    let haltReasonType;
    let haltReasonCode;
    let haltReasonMessage;
    const processSnapshot = (0, process_snapshot_utils_1.deepCloneProcessSnapshot)(context.payload ?? {});
    const preflight = (0, classification_preflight_1.runClassificationPreflight)(processSnapshot);
    if (preflight.ok === false) {
        const preflightItem = (0, validation_result_factory_1.createValidationItem)(preflight.code, preflight.message, validation_severity_enum_1.ValidationSeverity.BLOCK, { details: { phase: 'CLASSIFICATION_PREFLIGHT' } });
        const preflightDm = (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.SYSTEM, {
            ruleId: preflight.code,
            rationale: preflight.message,
            payload: { phase: 'CLASSIFICATION_PREFLIGHT', processId },
        });
        const preflightEvent = (0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.VALIDATION, module_id_enum_1.ModuleId.DFD, 'CLASSIFICATION_PREFLIGHT_BLOCK', preflight.message, { processId, payload: { code: preflight.code } });
        return {
            success: false,
            status: 'halted',
            outputs: [],
            moduleOutputs: [],
            validations: [preflightItem],
            events: [preflightEvent],
            metadata: {
                processSnapshot: (0, process_snapshot_utils_1.deepCloneProcessSnapshot)(processSnapshot),
                decisionMetadata: [preflightDm],
            },
            decisionMetadata: [preflightDm],
            legalTrace: [],
            halted: true,
            haltedBy: module_id_enum_1.ModuleId.DFD,
            haltedDetail: {
                moduleId: module_id_enum_1.ModuleId.DFD,
                type: 'VALIDATION',
                origin: 'CLASSIFICATION_PREFLIGHT',
                code: preflight.code,
                message: preflight.message,
            },
            finalStatus: 'HALTED_BY_VALIDATION',
            executedModules: [],
            processSnapshot: (0, process_snapshot_utils_1.deepCloneProcessSnapshot)(processSnapshot),
        };
    }
    for (const moduleId of orderedModuleIds) {
        const dependencyCheck = (0, module_dependency_1.checkModuleDependency)(moduleId, outputs);
        if (dependencyCheck.satisfied === false) {
            dependencyBlockEvent = (0, administrative_event_factory_1.createAdministrativeEvent)(event_type_enum_1.EventType.COMPLIANCE, moduleId, dependencyCheck.code, dependencyCheck.message, {
                processId,
                payload: {
                    dependentModule: dependencyCheck.dependentModule,
                    phase,
                },
            });
            dependencyBlockMetadata = (0, decision_metadata_factory_1.createDecisionMetadata)(decision_origin_enum_1.DecisionOrigin.SYSTEM, {
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
            if (haltReasonType === undefined ||
                haltReasonType === 'MODULE_SIGNAL' ||
                haltReasonType === 'DEPENDENCY') {
                haltedBy = moduleId;
                haltReasonType = 'DEPENDENCY';
                haltReasonCode = dependencyCheck.code;
                haltReasonMessage = dependencyCheck.message;
            }
            if (typeof console !== 'undefined' && console.debug) {
                console.debug(`${ENGINE_LOG_PREFIX} Bloqueio por dependência. módulo=${moduleId} dependente=${dependencyCheck.dependentModule}`);
            }
            break;
        }
        if (typeof console !== 'undefined' && console.debug) {
            console.debug(`${ENGINE_LOG_PREFIX} Início da execução do módulo: ${moduleId}`);
        }
        const input = buildModuleInput(context, moduleId);
        const output = await (0, flow_dispatcher_1.dispatchModule)(moduleId, input);
        outputs.push(output);
        if (output.result.status === 'success') {
            (0, process_snapshot_utils_1.mergeModuleSuccessDataIntoSnapshot)(processSnapshot, output.result.data);
        }
        const previousOutput = outputs.length > 1 ? outputs[outputs.length - 2] : null;
        if (output.result.status === 'success') {
            const crossResult = (0, validators_1.validateCrossModuleConsistency)(moduleId, output, previousOutput, processSnapshot, processId);
            if (crossResult.validationItems.length > 0 ||
                crossResult.events.length > 0 ||
                crossResult.decisionMetadata.length > 0) {
                crossValidationItems.push(...crossResult.validationItems);
                crossValidationEvents.push(...crossResult.events);
                crossValidationMetadata.push(...crossResult.decisionMetadata);
            }
            if (crossResult.hasBlocking) {
                haltedBy = moduleId;
                haltReasonType = 'CROSS_VALIDATION';
                const blockingItem = crossResult.validationItems.find((item) => item.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
                haltReasonCode = blockingItem?.code ?? 'CROSS_MODULE_VALIDATION_BLOCK';
                haltReasonMessage =
                    blockingItem?.message ??
                        `Bloqueio por validação cruzada no módulo ${moduleId}.`;
                if (typeof console !== 'undefined' && console.debug) {
                    console.debug(`${ENGINE_LOG_PREFIX} Bloqueio por validação cruzada. módulo=${moduleId}`);
                }
                break;
            }
            const legalResult = (0, validators_1.validateLegalStructure)(moduleId, output, processSnapshot, processId);
            if (legalResult.validationItems.length > 0 ||
                legalResult.events.length > 0 ||
                legalResult.decisionMetadata.length > 0) {
                legalValidationItems.push(...legalResult.validationItems);
                legalValidationEvents.push(...legalResult.events);
                legalValidationMetadata.push(...legalResult.decisionMetadata);
            }
            if (legalResult.hasBlocking) {
                haltedBy = moduleId;
                haltReasonType = 'LEGAL_VALIDATION';
                const blockingItem = legalResult.validationItems.find((item) => item.severity === validation_severity_enum_1.ValidationSeverity.BLOCK);
                haltReasonCode = blockingItem?.code ?? 'LEGAL_VALIDATION_BLOCK';
                haltReasonMessage =
                    blockingItem?.message ??
                        `Bloqueio por validação jurídica no módulo ${moduleId}.`;
                if (typeof console !== 'undefined' && console.debug) {
                    console.debug(`${ENGINE_LOG_PREFIX} Bloqueio por validação jurídica. módulo=${moduleId}`);
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
                console.debug(`${ENGINE_LOG_PREFIX} Interrupção do fluxo por módulo. haltedBy=${haltedBy}`);
            }
            // Não fazemos break aqui: o próximo módulo verá a dependência quebrada
            // via checkModuleDependency e poderá classificar adequadamente como
            // HALTED_BY_DEPENDENCY sem executar novos módulos.
        }
    }
    if (typeof console !== 'undefined' && console.debug) {
        console.debug(`${ENGINE_LOG_PREFIX} Término da execução. processId=${processId} halted=${!!haltedBy}`);
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
    const metadata = {
        ...baseMetadata,
        decisionMetadata,
        processSnapshot: (0, process_snapshot_utils_1.deepCloneProcessSnapshot)(processSnapshot),
    };
    const legalTrace = [];
    for (const dm of decisionMetadata) {
        const payload = dm.payload;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            const maybeLegalTrace = payload['legalTrace'];
            if (maybeLegalTrace && typeof maybeLegalTrace === 'object') {
                legalTrace.push(maybeLegalTrace);
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
    const status = halted ? 'halted' : success ? 'success' : 'failure';
    let finalStatus;
    if (!halted && success) {
        finalStatus = 'SUCCESS';
    }
    else if (haltReasonType === 'DEPENDENCY') {
        finalStatus = 'HALTED_BY_DEPENDENCY';
    }
    else if (haltReasonType === 'CROSS_VALIDATION' ||
        haltReasonType === 'LEGAL_VALIDATION' ||
        haltReasonType === 'CLASSIFICATION_PREFLIGHT') {
        finalStatus = 'HALTED_BY_VALIDATION';
    }
    else if (haltReasonType === 'MODULE_SIGNAL') {
        finalStatus = 'HALTED_BY_MODULE';
    }
    else {
        // Fallback defensivo: qualquer cenário não mapeado é interpretado como
        // interrupção por módulo, nunca como SUCCESS.
        finalStatus = 'HALTED_BY_MODULE';
    }
    const result = {
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
        haltedDetail: halted && haltedBy
            ? {
                moduleId: haltedBy,
                type: haltReasonType === 'DEPENDENCY'
                    ? 'DEPENDENCY'
                    : haltReasonType === 'CROSS_VALIDATION' ||
                        haltReasonType === 'LEGAL_VALIDATION' ||
                        haltReasonType === 'CLASSIFICATION_PREFLIGHT'
                        ? 'VALIDATION'
                        : 'MODULE',
                origin: haltReasonType ?? 'MODULE_SIGNAL',
                code: haltReasonCode,
                message: haltReasonMessage,
            }
            : undefined,
        finalStatus,
        executedModules: outputs.map((o) => o.moduleId),
        processSnapshot: (0, process_snapshot_utils_1.deepCloneProcessSnapshot)(processSnapshot),
    };
    return result;
}
