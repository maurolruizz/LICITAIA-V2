"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRegimeBehaviorEngine = runRegimeBehaviorEngine;
const regime_behavior_engine_codes_1 = require("./regime-behavior-engine.codes");
const regime_operational_matrix_1 = require("./regime-operational-matrix");
const regime_behavior_snapshot_util_1 = require("./regime-behavior-snapshot.util");
function isRecognizedRegime(r) {
    return (r === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.LICITACAO ||
        r === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.DISPENSA ||
        r === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE);
}
function resolveDecisionMode(input) {
    const src = input.execution?.source;
    if (src === regime_behavior_engine_codes_1.EXECUTION_SOURCE.PREFLIGHT) {
        return regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_MODE.BASIC;
    }
    return regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_MODE.FULL;
}
/**
 * Bloqueios normativos do regime.
 * Nota de fronteira: `runClassificationPreflight` já valida coerência estrutural classificação↔modalidade
 * antes deste motor; a checagem de modalidade aqui mantém o engine determinístico quando invocado isoladamente
 * e é idempotente quando o pré-voo de classificação já passou.
 */
function evaluateBlockingReasons(snapshot, regime) {
    const codes = [];
    if (!isRecognizedRegime(regime)) {
        codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_UNRECOGNIZED);
        return codes;
    }
    const modality = (0, regime_behavior_snapshot_util_1.getProcessProcurementModality)(snapshot);
    const modOk = (0, regime_behavior_snapshot_util_1.evaluateRegimeModalityCompatibility)(regime, modality);
    if (!modOk.ok) {
        codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE);
    }
    if (regime === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.DISPENSA || regime === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE) {
        if (!(0, regime_behavior_snapshot_util_1.hasMinimumLegalBasisSupport)(snapshot)) {
            codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE);
        }
    }
    if (regime === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.DISPENSA) {
        if ((0, regime_behavior_snapshot_util_1.isPricingExigibleForDispensa)(snapshot)) {
            if (!(0, regime_behavior_snapshot_util_1.hasAnyPricingPresence)(snapshot)) {
                codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE);
            }
            else if (!(0, regime_behavior_snapshot_util_1.hasMinimumPricingSupport)(snapshot)) {
                codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE);
            }
        }
    }
    if (regime === regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE) {
        if (!(0, regime_behavior_snapshot_util_1.hasInviabilitySupport)(snapshot)) {
            codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_INVIABILITY_SUPPORT_AUSENTE);
        }
        if ((0, regime_behavior_snapshot_util_1.isOrdinaryCompetitionIncompatibleWithInexigibility)(snapshot)) {
            codes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE);
        }
    }
    return codes;
}
function sortCodes(arr) {
    return [...arr].sort((a, b) => a.localeCompare(b));
}
/**
 * Motor normativo de regime: matriz operacional fechada, determinística e auditável.
 */
function runRegimeBehaviorEngine(input) {
    const decisionMode = resolveDecisionMode(input);
    const snapshot = input.processSnapshot;
    const regimeRaw = (0, regime_behavior_snapshot_util_1.getLegalRegimeRaw)(snapshot);
    const recognized = isRecognizedRegime(regimeRaw) ? regimeRaw : 'UNKNOWN';
    const matrix = recognized === 'UNKNOWN'
        ? (0, regime_operational_matrix_1.getOperationalMatrixForRegime)(regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.LICITACAO)
        : (0, regime_operational_matrix_1.getOperationalMatrixForRegime)(recognized);
    let blockingReasonCodes = evaluateBlockingReasons(snapshot, regimeRaw);
    const triggers = [
        regime_behavior_engine_codes_1.REGIME_BEHAVIOR_TRIGGER_CODES.MODE_RESOLVED,
        regime_behavior_engine_codes_1.REGIME_BEHAVIOR_TRIGGER_CODES.REGIME_RESOLVED,
        regime_behavior_engine_codes_1.REGIME_BEHAVIOR_TRIGGER_CODES.MATRIX_APPLIED,
        regime_behavior_engine_codes_1.REGIME_BEHAVIOR_TRIGGER_CODES.POLICY_EVALUATED,
    ];
    const warningCodes = [];
    if (decisionMode === regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_MODE.BASIC) {
        warningCodes.push(regime_behavior_engine_codes_1.REGIME_BEHAVIOR_WARNING_CODES.BASIC_MODE_NORMATIVE_SCOPE_REDUCED);
    }
    const preflightSafety = decisionMode === regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_MODE.BASIC
        ? {
            allowsOnlyBasicDecision: true,
            allowsFullOperationalDecision: false,
            restrictedCapabilities: [...regime_behavior_engine_codes_1.BASIC_MODE_RESTRICTED_CAPABILITY_IDS],
        }
        : {
            allowsOnlyBasicDecision: false,
            allowsFullOperationalDecision: true,
            restrictedCapabilities: [],
        };
    /** Em modo basic, não expande bloqueios além dos estruturais/fundamento/prévios já avaliados (mesma base factual). */
    const canProceed = blockingReasonCodes.length === 0;
    const status = !canProceed
        ? regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_STATUS.BLOCKED
        : decisionMode === regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_MODE.BASIC && warningCodes.length > 0
            ? regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_STATUS.DEGRADED
            : regime_behavior_engine_codes_1.REGIME_BEHAVIOR_DECISION_STATUS.OK;
    blockingReasonCodes = sortCodes(blockingReasonCodes);
    const appliedPolicies = sortCodes([
        'documentPolicy',
        'validationPolicy',
        'preBlockPolicy',
        'calculationPolicy',
        'strategyPolicy',
        'objectStructurePolicy',
    ]);
    const audit = {
        engineVersion: '1',
        recognizedRegime: recognized,
        decisionMode,
        appliedPolicies,
        triggers: sortCodes([...triggers]),
        blockingReasonCodes,
        warningCodes: sortCodes([...warningCodes]),
    };
    return {
        decision: {
            status,
            canProceed,
            blockingReasonCodes,
            warningCodes,
        },
        matrix,
        preflightSafety,
        audit,
    };
}
