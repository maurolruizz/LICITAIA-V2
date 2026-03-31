export const FLOW_STEP_ORDER = [
  'INIT',
  'CONTEXT',
  'REGIME',
  'DFD',
  'ETP',
  'TR',
  'PRICING',
  'REVIEW',
  'OUTPUT',
] as const;

export type FlowStep = (typeof FLOW_STEP_ORDER)[number];
export type FlowVersion = 'v1';
export type StepStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'INVALIDATED';
export type AllowedAction =
  | 'EDIT_CURRENT_STEP'
  | 'SAVE_CURRENT_STEP'
  | 'ADVANCE_TO_NEXT_STEP'
  | 'RETURN_TO_PREVIOUS_STEP'
  | 'TRIGGER_REVIEW'
  | 'VIEW_OUTPUT';
export type NextRequiredAction =
  | 'FILL_REQUIRED_FIELDS'
  | 'RESOLVE_BLOCKINGS'
  | 'RUN_REVIEW'
  | 'VIEW_RESULT';
export type BlockingSeverity = 'HARD' | 'SOFT';
export type BlockingOrigin = 'MOTOR' | 'FLUXO' | 'UI';
export type CorrectionAction =
  | 'RELOAD_STATE_FROM_SERVER'
  | 'RETURN_TO_PREVIOUS_STEP'
  | 'FILL_REQUIRED_FIELDS'
  | 'TRIGGER_REVIEW'
  | 'VIEW_OUTPUT';
export type RenderToken = string;

export type FlowBlockingCode =
  | 'FLOW_INVALID_TRANSITION'
  | 'FLOW_REVIEW_NOT_AVAILABLE'
  | 'FLOW_OUTPUT_NOT_AVAILABLE'
  | 'FLOW_REGIME_FROZEN'
  | 'FLOW_INVALIDATED_DOWNSTREAM';
export type UiBlockingCode = 'UI_STATE_STALE' | 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND';
export type MotorBlockingCode =
  | 'MOTOR_HALTED_BY_VALIDATION'
  | 'MOTOR_HALTED_BY_DEPENDENCY'
  | 'MOTOR_HALTED_BY_MODULE'
  | 'MOTOR_CLASSIFICATION_PREFLIGHT';
export type BlockingReasonCode = FlowBlockingCode | UiBlockingCode | MotorBlockingCode;

export type FlowInvalidationReasonCode =
  | 'INVALIDATION_EXPLICIT_SEGMENT_RESET'
  | 'INVALIDATION_REGIME_OR_CONTEXT_REOPEN';

export type MessageKey =
  | 'CONDUCAO_STEP_INIT'
  | 'CONDUCAO_STEP_CONTEXT'
  | 'CONDUCAO_STEP_REGIME'
  | 'CONDUCAO_STEP_DFD'
  | 'CONDUCAO_STEP_ETP'
  | 'CONDUCAO_STEP_TR'
  | 'CONDUCAO_STEP_PRICING'
  | 'CONDUCAO_STEP_REVIEW'
  | 'CONDUCAO_STEP_OUTPUT'
  | 'CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS'
  | 'CONDUCAO_INSTRUCTION_RESOLVE_BLOCKINGS'
  | 'CONDUCAO_INSTRUCTION_RUN_REVIEW'
  | 'CONDUCAO_INSTRUCTION_VIEW_RESULT'
  | 'BLOCKING_STATE_INVALID_TRANSITION'
  | 'BLOCKING_STATE_REVIEW_NOT_AVAILABLE'
  | 'BLOCKING_STATE_OUTPUT_NOT_AVAILABLE'
  | 'BLOCKING_STATE_REGIME_FROZEN'
  | 'BLOCKING_STATE_INVALIDATED_DOWNSTREAM'
  | 'BLOCKING_UI_STATE_STALE'
  | 'BLOCKING_UI_RENDER_TOKEN_MISMATCH'
  | 'BLOCKING_MOTOR_HALTED_BY_VALIDATION'
  | 'BLOCKING_MOTOR_HALTED_BY_DEPENDENCY'
  | 'BLOCKING_MOTOR_HALTED_BY_MODULE'
  | 'BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT'
  | 'CONDUCAO_FIELD_LABEL_INIT_CONFIRM'
  | 'CONDUCAO_FIELD_HELP_INIT_CONFIRM'
  | 'CONDUCAO_FIELD_LABEL_CTX_TENANT_SLUG'
  | 'CONDUCAO_FIELD_HELP_CTX_TENANT_SLUG'
  | 'CONDUCAO_FIELD_LABEL_CTX_OPERATOR_NOTE'
  | 'CONDUCAO_FIELD_HELP_CTX_OPERATOR_NOTE'
  | 'CONDUCAO_FIELD_LABEL_REG_LEGAL_REGIME'
  | 'CONDUCAO_FIELD_HELP_REG_LEGAL_REGIME'
  | 'CONDUCAO_FIELD_LABEL_REG_PROCUREMENT_STRATEGY'
  | 'CONDUCAO_FIELD_HELP_REG_PROCUREMENT_STRATEGY'
  | 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_TYPE'
  | 'CONDUCAO_FIELD_HELP_DFD_OBJECT_TYPE'
  | 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_STRUCTURE'
  | 'CONDUCAO_FIELD_HELP_DFD_OBJECT_STRUCTURE'
  | 'CONDUCAO_FIELD_LABEL_ETP_STRATEGY_NOTE'
  | 'CONDUCAO_FIELD_HELP_ETP_STRATEGY_NOTE'
  | 'CONDUCAO_FIELD_LABEL_TR_TERMS_NOTE'
  | 'CONDUCAO_FIELD_HELP_TR_TERMS_NOTE'
  | 'CONDUCAO_FIELD_LABEL_PRC_BASE_VALUE'
  | 'CONDUCAO_FIELD_HELP_PRC_BASE_VALUE'
  | 'REVIEW_PANEL_TITLE'
  | 'REVIEW_PANEL_INSTRUCTION_PRE_EXEC'
  | 'REVIEW_PANEL_INSTRUCTION_POST_EXEC'
  | 'REVIEW_BLOCK_STATIC_SUMMARY'
  | 'REVIEW_BLOCK_OUTCOME_LINE'
  | 'REVIEW_BLOCK_MODULES_LINE'
  | 'REVIEW_TRIGGER_PRIMARY_LABEL'
  | 'OUTPUT_PANEL_TITLE'
  | 'OUTPUT_PANEL_INSTRUCTION_VIEW'
  | 'OUTPUT_BLOCK_RESULT_SUMMARY'
  | 'ERROR_STATE_STALE'
  | 'ERROR_RENDER_TOKEN_MISMATCH';

export type FieldValue =
  | { valueType: 'STRING'; value: string }
  | { valueType: 'NUMBER'; value: number }
  | { valueType: 'BOOLEAN'; value: boolean };

export type StepFieldId =
  | 'INIT_CONFIRM'
  | 'CTX_TENANT_SLUG'
  | 'CTX_OPERATOR_NOTE'
  | 'REG_LEGAL_REGIME'
  | 'REG_PROCUREMENT_STRATEGY'
  | 'DFD_OBJECT_TYPE'
  | 'DFD_OBJECT_STRUCTURE'
  | 'ETP_STRATEGY_NOTE'
  | 'TR_TERMS_NOTE'
  | 'PRC_BASE_VALUE';

export interface StepFieldState {
  fieldId: StepFieldId;
  value: FieldValue | null;
  isValid: boolean | null;
  validationTrace: readonly string[] | null;
}

export type ConductionFormId =
  | 'FORM_COND_INIT_V1'
  | 'FORM_COND_CONTEXT_V1'
  | 'FORM_COND_REGIME_V1'
  | 'FORM_COND_DFD_V1'
  | 'FORM_COND_ETP_V1'
  | 'FORM_COND_TR_V1'
  | 'FORM_COND_PRICING_V1';

export type StepFieldSpec =
  | {
      fieldId: StepFieldId;
      fieldType: 'STRING';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    }
  | {
      fieldId: StepFieldId;
      fieldType: 'NUMBER';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    }
  | {
      fieldId: StepFieldId;
      fieldType: 'BOOLEAN';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    };

export interface StepSnapshot {
  step: FlowStep;
  status: StepStatus;
  version: number;
  snapshotHash: string;
  producedAt: string;
  producedBy: 'USER_ACTION' | 'SYSTEM_TRANSITION';
  frozenFields: {
    legalRegimeFrozen: boolean;
    procurementStrategyFrozen: boolean;
  };
}

export type ReviewResultFinalStatus =
  | 'SUCCESS'
  | 'HALTED_BY_VALIDATION'
  | 'HALTED_BY_DEPENDENCY'
  | 'HALTED_BY_MODULE';

export type ReviewResultContract =
  | { phase: 'PRE_REVIEW' }
  | {
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
      reviewSnapshotHash: string;
    };

export interface BlockingReason {
  code: BlockingReasonCode;
  severity: BlockingSeverity;
  step: FlowStep;
  origin: BlockingOrigin;
  messageKey: MessageKey;
  correctionAction: CorrectionAction;
  details:
    | {
        kind: 'STATE_STALE';
        expectedRenderToken: RenderToken;
        currentRenderToken: RenderToken;
        serverRevision: number;
      }
    | {
        kind: 'RENDER_TOKEN_MISMATCH_ON_COMMAND';
        expectedRenderToken: RenderToken;
        currentRenderToken: RenderToken;
        serverRevision: number;
      }
    | { kind: 'FLOW_INVALID_TRANSITION'; fromStep: FlowStep; toStep: FlowStep }
    | { kind: 'FLOW_REVIEW_NOT_AVAILABLE'; currentStep: FlowStep }
    | { kind: 'FLOW_OUTPUT_NOT_AVAILABLE'; currentStep: FlowStep }
    | {
        kind: 'FLOW_REGIME_FROZEN';
        frozenAfterStep: FlowStep;
        attemptedField: 'REG_LEGAL_REGIME' | 'REG_PROCUREMENT_STRATEGY';
      }
    | { kind: 'FLOW_INVALIDATED_DOWNSTREAM'; invalidatedSteps: FlowStep[]; reasonCode: FlowInvalidationReasonCode }
    | {
        kind: 'MOTOR_HALTED_BY_VALIDATION';
        motorOpaqueHaltSegments: readonly string[];
        haltedByModuleToken: string | null;
      }
    | {
        kind: 'MOTOR_HALTED_BY_DEPENDENCY';
        motorOpaqueHaltSegments: readonly string[];
        haltedByModuleToken: string | null;
        dependencySegments: readonly string[];
      }
    | {
        kind: 'MOTOR_HALTED_BY_MODULE';
        motorOpaqueHaltSegments: readonly string[];
        haltedByModuleToken: string | null;
      }
    | { kind: 'MOTOR_CLASSIFICATION_PREFLIGHT'; preflightSegments: readonly string[] };
}

export interface ImmutableHistoryItem {
  revision: number;
  type:
    | 'STEP_SAVED'
    | 'STEP_ADVANCED'
    | 'STEP_RETURNED'
    | 'STEP_INVALIDATED'
    | 'REVIEW_EXECUTED'
    | 'OUTPUT_EXPOSED';
  step: FlowStep;
  timestamp: string;
  metadataHash: string;
}

export interface OperationalStateContract {
  schemaVersion: string;
  fieldCatalogVersion: string;
  processId: string;
  flowVersion: FlowVersion;
  revision: number;
  generatedAt: string;
  stepOrder: [FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep];
  currentStep: FlowStep;
  stepStatusMap: Record<FlowStep, StepStatus>;
  allowedActions: AllowedAction[];
  nextRequiredAction: NextRequiredAction;
  activeBlockings: BlockingReason[];
  snapshots: Record<FlowStep, StepSnapshot | null>;
  immutableHistory: ReadonlyArray<ImmutableHistoryItem>;
  reviewResult: ReviewResultContract;
  currentStepForm: CurrentStepFormContract;
  renderToken: RenderToken;
}

export interface StepFormConductionContract {
  mode: 'CONDUCTION_STEP_FORM';
  step: Exclude<FlowStep, 'REVIEW' | 'OUTPUT'>;
  formId: ConductionFormId;
  stepTitleMessageKey: MessageKey;
  stepInstructionMessageKey: MessageKey;
  fields: ReadonlyArray<{
    spec: StepFieldSpec;
    state: StepFieldState;
  }>;
}

export interface ReviewPanelContract {
  mode: 'REVIEW_PANEL';
  step: 'REVIEW';
  formId: 'FORM_REVIEW_PANEL_V1';
  stepTitleMessageKey: 'REVIEW_PANEL_TITLE' | 'CONDUCAO_STEP_REVIEW';
  stepInstructionMessageKey: 'REVIEW_PANEL_INSTRUCTION_PRE_EXEC' | 'REVIEW_PANEL_INSTRUCTION_POST_EXEC';
  reviewExecutionPhase: 'PRE_REVIEW' | 'POST_REVIEW';
  readOnlyBlocks: ReadonlyArray<
    | { blockKind: 'STATIC_SECTION'; sectionTitleMessageKey: 'REVIEW_BLOCK_STATIC_SUMMARY' }
    | {
        blockKind: 'KEY_VALUE';
        rowId: 'REVIEW_ROW_OUTCOME';
        labelMessageKey: 'REVIEW_BLOCK_OUTCOME_LINE';
        valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
      }
    | {
        blockKind: 'KEY_VALUE';
        rowId: 'REVIEW_ROW_MODULES';
        labelMessageKey: 'REVIEW_BLOCK_MODULES_LINE';
        valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
      }
  >;
  reviewTriggerControl: {
    visible: boolean;
    disabled: boolean;
    labelMessageKey: 'REVIEW_TRIGGER_PRIMARY_LABEL';
  };
}

export interface OutputPanelContract {
  mode: 'OUTPUT_PANEL';
  step: 'OUTPUT';
  formId: 'FORM_OUTPUT_PANEL_V1';
  stepTitleMessageKey: 'OUTPUT_PANEL_TITLE' | 'CONDUCAO_STEP_OUTPUT';
  stepInstructionMessageKey: 'OUTPUT_PANEL_INSTRUCTION_VIEW';
  readOnlyBlocks: ReadonlyArray<
    | { blockKind: 'STATIC_SECTION'; sectionTitleMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY' }
    | {
        blockKind: 'KEY_VALUE';
        rowId: 'OUTPUT_ROW_SUMMARY';
        labelMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY';
        valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
      }
  >;
}

export type CurrentStepFormContract = StepFormConductionContract | ReviewPanelContract | OutputPanelContract;

export interface FlowCommandGuard {
  expectedRevision: number;
  expectedRenderToken: RenderToken;
}

export interface ReviewExecutionResult {
  finalStatus: ReviewResultFinalStatus;
  haltedDetail?:
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
  reviewSnapshotHash: string;
}

