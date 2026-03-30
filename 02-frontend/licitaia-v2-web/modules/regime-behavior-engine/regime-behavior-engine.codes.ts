/**
 * Códigos fechados do regime-behavior-engine (decisão normativa determinística).
 */

export const REGIME_BEHAVIOR_DECISION_MODE = {
  BASIC: 'basic',
  FULL: 'full',
} as const;

export type RegimeBehaviorDecisionMode =
  (typeof REGIME_BEHAVIOR_DECISION_MODE)[keyof typeof REGIME_BEHAVIOR_DECISION_MODE];

export const EXECUTION_SOURCE = {
  STANDARD_EXECUTION: 'standard_execution',
  PREFLIGHT: 'preflight',
} as const;

export type ExecutionSource = (typeof EXECUTION_SOURCE)[keyof typeof EXECUTION_SOURCE];

export const RECOGNIZED_LEGAL_REGIME = {
  LICITACAO: 'LICITACAO',
  DISPENSA: 'DISPENSA',
  INEXIGIBILIDADE: 'INEXIGIBILIDADE',
} as const;

export type RecognizedLegalRegime =
  (typeof RECOGNIZED_LEGAL_REGIME)[keyof typeof RECOGNIZED_LEGAL_REGIME];

/** Políticas de obrigatoriedade documental por módulo do pipeline. */
export const DOCUMENT_POLICY_LEVEL = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  CONDITIONAL_REQUIRED: 'conditional_required',
  REQUIRED_ADAPTED: 'required_adapted',
  NOT_APPLICABLE: 'not_applicable',
} as const;

export type DocumentPolicyLevel =
  (typeof DOCUMENT_POLICY_LEVEL)[keyof typeof DOCUMENT_POLICY_LEVEL];

export const REGIME_BEHAVIOR_DECISION_STATUS = {
  OK: 'ok',
  BLOCKED: 'blocked',
  DEGRADED: 'degraded',
} as const;

export type RegimeBehaviorDecisionStatus =
  (typeof REGIME_BEHAVIOR_DECISION_STATUS)[keyof typeof REGIME_BEHAVIOR_DECISION_STATUS];

/** Códigos de bloqueio normativo (motor). */
export const REGIME_BEHAVIOR_BLOCKING_REASON_CODES = {
  REGIME_UNRECOGNIZED: 'REGIME_UNRECOGNIZED',
  REGIME_MODALITY_INCOMPATIBLE: 'REGIME_MODALITY_INCOMPATIBLE',
  REGIME_FUNDAMENTO_MINIMO_AUSENTE: 'REGIME_FUNDAMENTO_MINIMO_AUSENTE',
  REGIME_PRICING_EXIGIDO_AUSENTE: 'REGIME_PRICING_EXIGIDO_AUSENTE',
  REGIME_PRICING_INSUFICIENTE: 'REGIME_PRICING_INSUFICIENTE',
  REGIME_INVIABILITY_SUPPORT_AUSENTE: 'REGIME_INVIABILITY_SUPPORT_AUSENTE',
  REGIME_ORDINARY_COMPETITION_INCOMPATIBLE: 'REGIME_ORDINARY_COMPETITION_INCOMPATIBLE',
} as const;

export type RegimeBehaviorBlockingReasonCode =
  (typeof REGIME_BEHAVIOR_BLOCKING_REASON_CODES)[keyof typeof REGIME_BEHAVIOR_BLOCKING_REASON_CODES];

export const REGIME_BEHAVIOR_WARNING_CODES = {
  BASIC_MODE_NORMATIVE_SCOPE_REDUCED: 'BASIC_MODE_NORMATIVE_SCOPE_REDUCED',
} as const;

export type RegimeBehaviorWarningCode =
  (typeof REGIME_BEHAVIOR_WARNING_CODES)[keyof typeof REGIME_BEHAVIOR_WARNING_CODES];

export const REGIME_BEHAVIOR_TRIGGER_CODES = {
  MATRIX_APPLIED: 'MATRIX_APPLIED',
  MODE_RESOLVED: 'MODE_RESOLVED',
  REGIME_RESOLVED: 'REGIME_RESOLVED',
  POLICY_EVALUATED: 'POLICY_EVALUATED',
} as const;

export type RegimeBehaviorTriggerCode =
  (typeof REGIME_BEHAVIOR_TRIGGER_CODES)[keyof typeof REGIME_BEHAVIOR_TRIGGER_CODES];

/** Capacidades não reivindicáveis em modo basic (preflight). */
export const BASIC_MODE_RESTRICTED_CAPABILITY_IDS = [
  'NORMATIVE_MATRIX_FULL_RESOLUTION',
  'CALCULATION_POLICY_FULL',
  'STRATEGY_POLICY_FULL',
  'OBJECT_STRUCTURE_POLICY_FULL',
] as const;
