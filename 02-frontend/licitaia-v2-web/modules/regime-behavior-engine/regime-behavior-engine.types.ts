import type {
  DocumentPolicyLevel,
  ExecutionSource,
  RecognizedLegalRegime,
  RegimeBehaviorBlockingReasonCode,
  RegimeBehaviorDecisionMode,
  RegimeBehaviorDecisionStatus,
  RegimeBehaviorTriggerCode,
  RegimeBehaviorWarningCode,
} from './regime-behavior-engine.codes';

export interface RegimeBehaviorEngineInput {
  /** Snapshot já normalizado (mesmo objeto usado pelo motor). */
  processSnapshot: Record<string, unknown>;
  /** Origem da execução: ausente => standard_execution (compatibilidade). */
  execution?: { source: ExecutionSource };
}

export interface RegimeBehaviorDocumentPolicy {
  DFD: DocumentPolicyLevel;
  ETP: DocumentPolicyLevel;
  TR: DocumentPolicyLevel;
  PRICING: DocumentPolicyLevel;
}

export type ValidationPolicyScope = 'minimal' | 'full';

export interface RegimeBehaviorValidationPolicy {
  scope: ValidationPolicyScope;
  /** Códigos de validação obrigatória quando scope = full (fechado). */
  mandatoryValidationCodes: readonly string[];
}

export interface RegimeBehaviorPreBlockPolicy {
  /** Pré-condições objetivas que geram bloqueio antes da progressão plena. */
  structuralPreBlockCodes: readonly RegimeBehaviorBlockingReasonCode[];
}

export type CalculationPolicyMode = 'full_traceability' | 'basic_checks';

export interface RegimeBehaviorCalculationPolicy {
  mode: CalculationPolicyMode;
}

export type StrategyPolicyMode = 'competition_mandatory' | 'direct_selection' | 'inexigibility';

export interface RegimeBehaviorStrategyPolicy {
  mode: StrategyPolicyMode;
}

export type ObjectStructurePolicyMode = 'derive_from_snapshot' | 'single_item_focus';

export interface RegimeBehaviorObjectStructurePolicy {
  mode: ObjectStructurePolicyMode;
}

/** Matriz operacional fechada por regime. */
export interface RegimeOperationalMatrix {
  documentPolicy: RegimeBehaviorDocumentPolicy;
  validationPolicy: RegimeBehaviorValidationPolicy;
  preBlockPolicy: RegimeBehaviorPreBlockPolicy;
  calculationPolicy: RegimeBehaviorCalculationPolicy;
  strategyPolicy: RegimeBehaviorStrategyPolicy;
  objectStructurePolicy: RegimeBehaviorObjectStructurePolicy;
  /** Compatibilidades normativas declarativas (códigos fechados). */
  compatibilities: readonly string[];
  /** Incompatibilidades normativas declarativas (códigos fechados). */
  incompatibilities: readonly string[];
}

export interface RegimeBehaviorPreflightSafety {
  allowsOnlyBasicDecision: boolean;
  allowsFullOperationalDecision: boolean;
  restrictedCapabilities: readonly string[];
}

export interface RegimeBehaviorDecision {
  status: RegimeBehaviorDecisionStatus;
  canProceed: boolean;
  blockingReasonCodes: RegimeBehaviorBlockingReasonCode[];
  warningCodes: RegimeBehaviorWarningCode[];
}

export interface RegimeBehaviorAuditPayload {
  engineVersion: '1';
  recognizedRegime: RecognizedLegalRegime | 'UNKNOWN';
  decisionMode: RegimeBehaviorDecisionMode;
  appliedPolicies: readonly string[];
  triggers: RegimeBehaviorTriggerCode[];
  blockingReasonCodes: RegimeBehaviorBlockingReasonCode[];
  warningCodes: RegimeBehaviorWarningCode[];
}

export interface RegimeBehaviorEngineOutput {
  decision: RegimeBehaviorDecision;
  matrix: RegimeOperationalMatrix;
  preflightSafety: RegimeBehaviorPreflightSafety;
  audit: RegimeBehaviorAuditPayload;
}

/** Metadados anexados ao resultado do motor (consumo interno). */
export interface RegimeBehaviorEngineMetadataPayload {
  decision: RegimeBehaviorDecision;
  matrix: RegimeOperationalMatrix;
  preflightSafety: RegimeBehaviorPreflightSafety;
  audit: RegimeBehaviorAuditPayload;
}
