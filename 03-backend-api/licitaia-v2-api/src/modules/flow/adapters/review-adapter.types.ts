export type ReviewResultFinalStatus =
  | 'SUCCESS'
  | 'HALTED_BY_VALIDATION'
  | 'HALTED_BY_DEPENDENCY'
  | 'HALTED_BY_MODULE';

export type ReviewResultContract = {
  phase: 'POST_REVIEW';
  finalStatus: ReviewResultFinalStatus;
  haltedDetail:
    | {
        type: 'DEPENDENCY' | 'VALIDATION' | 'MODULE';
        origin:
          | 'DEPENDENCY'
          | 'CROSS_VALIDATION'
          | 'LEGAL_VALIDATION'
          | 'MODULE_SIGNAL'
          | 'CLASSIFICATION_PREFLIGHT'
          | 'REGIME_BEHAVIOR_ENGINE';
        motorOpaqueSegments: readonly string[];
        haltedByModuleToken: string | null;
      }
    | null;
  validations: ReadonlyArray<{ issueTrace: readonly string[]; severity: 'ERROR' | 'BLOCK' }>;
  executedModules: readonly string[];
};

export interface OperationalStateContract {
  processId: string;
  flowVersion: string;
  // Dependência estrutural interna do FlowController persistido.
  _stepFieldsByStep?: Record<string, Array<{ fieldId: string; value: unknown }>>;
}

