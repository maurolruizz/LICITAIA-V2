import type { RegimeBehaviorEngineInput, RegimeBehaviorEngineOutput } from './regime-behavior-engine.types';
import {
  BASIC_MODE_RESTRICTED_CAPABILITY_IDS,
  EXECUTION_SOURCE,
  RECOGNIZED_LEGAL_REGIME,
  REGIME_BEHAVIOR_BLOCKING_REASON_CODES,
  REGIME_BEHAVIOR_DECISION_MODE,
  REGIME_BEHAVIOR_DECISION_STATUS,
  REGIME_BEHAVIOR_TRIGGER_CODES,
  REGIME_BEHAVIOR_WARNING_CODES,
  type RegimeBehaviorBlockingReasonCode,
  type RegimeBehaviorDecisionMode,
} from './regime-behavior-engine.codes';
import { getOperationalMatrixForRegime } from './regime-operational-matrix';
import {
  evaluateRegimeModalityCompatibility,
  getLegalRegimeRaw,
  getProcessProcurementModality,
  hasInviabilitySupport,
  hasAnyPricingPresence,
  hasMinimumLegalBasisSupport,
  hasMinimumPricingSupport,
  isOrdinaryCompetitionIncompatibleWithInexigibility,
  isPricingExigibleForDispensa,
} from './regime-behavior-snapshot.util';

function isRecognizedRegime(
  r: string
): r is (typeof RECOGNIZED_LEGAL_REGIME)[keyof typeof RECOGNIZED_LEGAL_REGIME] {
  return (
    r === RECOGNIZED_LEGAL_REGIME.LICITACAO ||
    r === RECOGNIZED_LEGAL_REGIME.DISPENSA ||
    r === RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE
  );
}

function resolveDecisionMode(input: RegimeBehaviorEngineInput): RegimeBehaviorDecisionMode {
  const src = input.execution?.source;
  if (src === EXECUTION_SOURCE.PREFLIGHT) {
    return REGIME_BEHAVIOR_DECISION_MODE.BASIC;
  }
  return REGIME_BEHAVIOR_DECISION_MODE.FULL;
}

/**
 * Bloqueios normativos do regime.
 * Nota de fronteira: `runClassificationPreflight` já valida coerência estrutural classificação↔modalidade
 * antes deste motor; a checagem de modalidade aqui mantém o engine determinístico quando invocado isoladamente
 * e é idempotente quando o pré-voo de classificação já passou.
 */
function evaluateBlockingReasons(
  snapshot: Record<string, unknown>,
  regime: string
): RegimeBehaviorBlockingReasonCode[] {
  const codes: RegimeBehaviorBlockingReasonCode[] = [];
  if (!isRecognizedRegime(regime)) {
    codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_UNRECOGNIZED);
    return codes;
  }

  const modality = getProcessProcurementModality(snapshot);
  const modOk = evaluateRegimeModalityCompatibility(regime, modality);
  if (!modOk.ok) {
    codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE);
  }

  if (regime === RECOGNIZED_LEGAL_REGIME.DISPENSA || regime === RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE) {
    if (!hasMinimumLegalBasisSupport(snapshot)) {
      codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE);
    }
  }

  if (regime === RECOGNIZED_LEGAL_REGIME.DISPENSA) {
    if (isPricingExigibleForDispensa(snapshot)) {
      if (!hasAnyPricingPresence(snapshot)) {
        codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE);
      } else if (!hasMinimumPricingSupport(snapshot)) {
        codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE);
      }
    }
  }

  if (regime === RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE) {
    if (!hasInviabilitySupport(snapshot)) {
      codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_INVIABILITY_SUPPORT_AUSENTE);
    }
    if (isOrdinaryCompetitionIncompatibleWithInexigibility(snapshot)) {
      codes.push(REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE);
    }
  }

  return codes;
}

function sortCodes<T extends string>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.localeCompare(b));
}

/**
 * Motor normativo de regime: matriz operacional fechada, determinística e auditável.
 */
export function runRegimeBehaviorEngine(input: RegimeBehaviorEngineInput): RegimeBehaviorEngineOutput {
  const decisionMode = resolveDecisionMode(input);
  const snapshot = input.processSnapshot;
  const regimeRaw = getLegalRegimeRaw(snapshot);
  const recognized = isRecognizedRegime(regimeRaw) ? regimeRaw : ('UNKNOWN' as const);

  const matrix =
    recognized === 'UNKNOWN'
      ? getOperationalMatrixForRegime(RECOGNIZED_LEGAL_REGIME.LICITACAO)
      : getOperationalMatrixForRegime(recognized);

  let blockingReasonCodes = evaluateBlockingReasons(snapshot, regimeRaw);

  const triggers: (typeof REGIME_BEHAVIOR_TRIGGER_CODES)[keyof typeof REGIME_BEHAVIOR_TRIGGER_CODES][] =
    [
      REGIME_BEHAVIOR_TRIGGER_CODES.MODE_RESOLVED,
      REGIME_BEHAVIOR_TRIGGER_CODES.REGIME_RESOLVED,
      REGIME_BEHAVIOR_TRIGGER_CODES.MATRIX_APPLIED,
      REGIME_BEHAVIOR_TRIGGER_CODES.POLICY_EVALUATED,
    ];

  const warningCodes: (typeof REGIME_BEHAVIOR_WARNING_CODES)[keyof typeof REGIME_BEHAVIOR_WARNING_CODES][] =
    [];

  if (decisionMode === REGIME_BEHAVIOR_DECISION_MODE.BASIC) {
    warningCodes.push(REGIME_BEHAVIOR_WARNING_CODES.BASIC_MODE_NORMATIVE_SCOPE_REDUCED);
  }

  const preflightSafety =
    decisionMode === REGIME_BEHAVIOR_DECISION_MODE.BASIC
      ? {
          allowsOnlyBasicDecision: true,
          allowsFullOperationalDecision: false,
          restrictedCapabilities: [...BASIC_MODE_RESTRICTED_CAPABILITY_IDS],
        }
      : {
          allowsOnlyBasicDecision: false,
          allowsFullOperationalDecision: true,
          restrictedCapabilities: [] as const,
        };

  /** Em modo basic, não expande bloqueios além dos estruturais/fundamento/prévios já avaliados (mesma base factual). */
  const canProceed = blockingReasonCodes.length === 0;
  const status = !canProceed
    ? REGIME_BEHAVIOR_DECISION_STATUS.BLOCKED
    : decisionMode === REGIME_BEHAVIOR_DECISION_MODE.BASIC && warningCodes.length > 0
      ? REGIME_BEHAVIOR_DECISION_STATUS.DEGRADED
      : REGIME_BEHAVIOR_DECISION_STATUS.OK;

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
    engineVersion: '1' as const,
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
