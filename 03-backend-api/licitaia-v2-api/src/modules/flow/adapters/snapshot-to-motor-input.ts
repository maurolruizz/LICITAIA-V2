import type { AdministrativeProcessContext } from '../../../dto/administrative-process.types';
import type { OperationalStateContract } from './review-adapter.types';

type StepFieldsByStep = Record<string, Array<{ fieldId: string; value: unknown }>>;

function ensureNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`FLOW_ADAPTER_INVALID_${label.toUpperCase()}`);
  }
  return value.trim();
}

function readPersistedStepFields(state: OperationalStateContract): StepFieldsByStep {
  const raw = state._stepFieldsByStep;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('FLOW_ADAPTER_MISSING_STEP_FIELDS');
  }
  return raw as StepFieldsByStep;
}

function pickStepFieldValue(stepFieldsByStep: StepFieldsByStep, fieldId: string): unknown {
  for (const fields of Object.values(stepFieldsByStep)) {
    const found = fields.find((f) => f && typeof f === 'object' && (f as any).fieldId === fieldId);
    if (found) return (found as any).value;
  }
  return undefined;
}

function unwrapFlowFieldValue(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const rec = value as Record<string, unknown>;
  // FlowFieldValue (backend) e FieldValue (frontend) usam { valueType, value }
  if (typeof rec['valueType'] === 'string' && 'value' in rec) return rec['value'];
  return value;
}

function coerceText(value: unknown): string | undefined {
  const v = unwrapFlowFieldValue(value);
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function coerceNumber(value: unknown): number | undefined {
  const v = unwrapFlowFieldValue(value);
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim().replace(/,/g, '.');
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

/**
 * Adaptador puro: converte snapshot operacional do FlowController em input do motor administrativo.
 *
 * Política (explícita):
 * - phase do motor é amarrada ao fluxo v1 atual: este fluxo operacional representa o estágio PLANNING.
 * - payload produzido é compatível com mappers do motor (DFD/ETP/TR/PRICING) e carrega,
 *   quando possível, informações vindas de `_stepFieldsByStep`.
 *
 * Erros são lançados quando dados essenciais estão ausentes/inválidos.
 */
export function snapshotToMotorInput(
  state: OperationalStateContract,
  params: {
    processId: string;
    tenantId: string;
    userId: string;
    correlationId?: string;
  },
): AdministrativeProcessContext {
  const processId = ensureNonEmptyString(params.processId, 'processId');
  const tenantId = ensureNonEmptyString(params.tenantId, 'tenantId');
  const userId = ensureNonEmptyString(params.userId, 'userId');
  if (state.processId !== processId) {
    throw new Error('FLOW_ADAPTER_PROCESS_ID_MISMATCH');
  }
  if (state.flowVersion !== 'v1') {
    throw new Error('FLOW_ADAPTER_UNSUPPORTED_FLOW_VERSION');
  }

  const stepFieldsByStep = readPersistedStepFields(state);

  const legalRegime = coerceText(pickStepFieldValue(stepFieldsByStep, 'REG_LEGAL_REGIME'));
  const procurementStrategy = coerceText(pickStepFieldValue(stepFieldsByStep, 'REG_PROCUREMENT_STRATEGY'));
  const objectType = coerceText(pickStepFieldValue(stepFieldsByStep, 'DFD_OBJECT_TYPE'));
  const objectStructure = coerceText(pickStepFieldValue(stepFieldsByStep, 'DFD_OBJECT_STRUCTURE'));
  const etpStrategyNote = coerceText(pickStepFieldValue(stepFieldsByStep, 'ETP_STRATEGY_NOTE'));
  const trTermsNote = coerceText(pickStepFieldValue(stepFieldsByStep, 'TR_TERMS_NOTE'));
  const pricingBaseValue = coerceNumber(pickStepFieldValue(stepFieldsByStep, 'PRC_BASE_VALUE'));
  const operatorNote = coerceText(pickStepFieldValue(stepFieldsByStep, 'CTX_OPERATOR_NOTE'));

  const payload: Record<string, unknown> = {
    // Classificação compartilhada (usada por engines de estrutura documental e coerência)
    ...(legalRegime ? { legalRegime } : {}),
    ...(objectType ? { objectType } : {}),
    ...(objectStructure ? { objectStructure } : {}),
    // Estratégia de contratação (campo semântico aceito pelos módulos)
    ...(procurementStrategy ? { procurementStrategy } : {}),
    // Campos de nota (espalhados em módulos; mappers preservam additionalNotes)
    ...(operatorNote ? { additionalNotes: operatorNote } : {}),
  };

  // ETP: nota de estratégia como "solutionSummary" (campo esperado pelo ETP)
  if (etpStrategyNote) {
    payload['solutionSummary'] = etpStrategyNote;
  }

  // TR: nota de termos como "technicalRequirements" (campo esperado pelo TR)
  if (trTermsNote) {
    payload['technicalRequirements'] = trTermsNote;
  }

  // PRICING: o fluxo atual só captura um valor base; mapeamos para estimatedTotalValue.
  if (pricingBaseValue !== undefined) {
    payload['estimatedTotalValue'] = pricingBaseValue;
  }

  return {
    processId,
    tenantId,
    userId,
    phase: 'PLANNING',
    payload,
    ...(params.correlationId ? { correlationId: params.correlationId } : {}),
    execution: { source: 'standard_execution' },
  };
}

