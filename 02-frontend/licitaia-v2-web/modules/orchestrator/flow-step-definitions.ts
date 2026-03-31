import type { ConductionFormId, FlowStep, MessageKey, StepFieldId, StepFieldSpec } from './flow-controller.types';
import { FLOW_STEP_ORDER } from './flow-controller.types';

const STEP_FIELDS: Record<FlowStep, StepFieldId[]> = {
  INIT: ['INIT_CONFIRM'],
  CONTEXT: ['CTX_TENANT_SLUG', 'CTX_OPERATOR_NOTE'],
  REGIME: ['REG_LEGAL_REGIME', 'REG_PROCUREMENT_STRATEGY'],
  DFD: ['DFD_OBJECT_TYPE', 'DFD_OBJECT_STRUCTURE'],
  ETP: ['ETP_STRATEGY_NOTE'],
  TR: ['TR_TERMS_NOTE'],
  PRICING: ['PRC_BASE_VALUE'],
  REVIEW: [],
  OUTPUT: [],
};

const CONDUCTION_FORM_ID_BY_STEP: Record<Exclude<FlowStep, 'REVIEW' | 'OUTPUT'>, ConductionFormId> = {
  INIT: 'FORM_COND_INIT_V1',
  CONTEXT: 'FORM_COND_CONTEXT_V1',
  REGIME: 'FORM_COND_REGIME_V1',
  DFD: 'FORM_COND_DFD_V1',
  ETP: 'FORM_COND_ETP_V1',
  TR: 'FORM_COND_TR_V1',
  PRICING: 'FORM_COND_PRICING_V1',
};

const STEP_TITLE_KEY_BY_STEP: Record<FlowStep, MessageKey> = {
  INIT: 'CONDUCAO_STEP_INIT',
  CONTEXT: 'CONDUCAO_STEP_CONTEXT',
  REGIME: 'CONDUCAO_STEP_REGIME',
  DFD: 'CONDUCAO_STEP_DFD',
  ETP: 'CONDUCAO_STEP_ETP',
  TR: 'CONDUCAO_STEP_TR',
  PRICING: 'CONDUCAO_STEP_PRICING',
  REVIEW: 'CONDUCAO_STEP_REVIEW',
  OUTPUT: 'CONDUCAO_STEP_OUTPUT',
};

const FIELD_SPEC_BY_ID: Record<StepFieldId, StepFieldSpec> = {
  INIT_CONFIRM: {
    fieldId: 'INIT_CONFIRM',
    fieldType: 'BOOLEAN',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_INIT_CONFIRM',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_INIT_CONFIRM',
  },
  CTX_TENANT_SLUG: {
    fieldId: 'CTX_TENANT_SLUG',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_CTX_TENANT_SLUG',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_CTX_TENANT_SLUG',
  },
  CTX_OPERATOR_NOTE: {
    fieldId: 'CTX_OPERATOR_NOTE',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_CTX_OPERATOR_NOTE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_CTX_OPERATOR_NOTE',
  },
  REG_LEGAL_REGIME: {
    fieldId: 'REG_LEGAL_REGIME',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_REG_LEGAL_REGIME',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_REG_LEGAL_REGIME',
  },
  REG_PROCUREMENT_STRATEGY: {
    fieldId: 'REG_PROCUREMENT_STRATEGY',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_REG_PROCUREMENT_STRATEGY',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_REG_PROCUREMENT_STRATEGY',
  },
  DFD_OBJECT_TYPE: {
    fieldId: 'DFD_OBJECT_TYPE',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_TYPE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_DFD_OBJECT_TYPE',
  },
  DFD_OBJECT_STRUCTURE: {
    fieldId: 'DFD_OBJECT_STRUCTURE',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_STRUCTURE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_DFD_OBJECT_STRUCTURE',
  },
  ETP_STRATEGY_NOTE: {
    fieldId: 'ETP_STRATEGY_NOTE',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_ETP_STRATEGY_NOTE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_ETP_STRATEGY_NOTE',
  },
  TR_TERMS_NOTE: {
    fieldId: 'TR_TERMS_NOTE',
    fieldType: 'STRING',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_TR_TERMS_NOTE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_TR_TERMS_NOTE',
  },
  PRC_BASE_VALUE: {
    fieldId: 'PRC_BASE_VALUE',
    fieldType: 'NUMBER',
    required: true,
    labelMessageKey: 'CONDUCAO_FIELD_LABEL_PRC_BASE_VALUE',
    helpMessageKey: 'CONDUCAO_FIELD_HELP_PRC_BASE_VALUE',
  },
};

export function getStepIndex(step: FlowStep): number {
  return FLOW_STEP_ORDER.indexOf(step);
}

export function getPreviousStep(step: FlowStep): FlowStep | null {
  const idx = getStepIndex(step);
  if (idx <= 0) return null;
  return FLOW_STEP_ORDER[idx - 1] ?? null;
}

export function getNextStep(step: FlowStep): FlowStep | null {
  const idx = getStepIndex(step);
  if (idx < 0 || idx >= FLOW_STEP_ORDER.length - 1) return null;
  return FLOW_STEP_ORDER[idx + 1] ?? null;
}

export function getDownstreamSteps(step: FlowStep): FlowStep[] {
  const idx = getStepIndex(step);
  if (idx < 0) return [];
  return FLOW_STEP_ORDER.slice(idx + 1);
}

export function getRequiredFieldsForStep(step: FlowStep): StepFieldId[] {
  return STEP_FIELDS[step];
}

export function getConductionFormIdForStep(step: Exclude<FlowStep, 'REVIEW' | 'OUTPUT'>): ConductionFormId {
  return CONDUCTION_FORM_ID_BY_STEP[step];
}

export function getStepTitleMessageKey(step: FlowStep): MessageKey {
  return STEP_TITLE_KEY_BY_STEP[step];
}

export function getStepFieldSpec(fieldId: StepFieldId): StepFieldSpec {
  return FIELD_SPEC_BY_ID[fieldId];
}

