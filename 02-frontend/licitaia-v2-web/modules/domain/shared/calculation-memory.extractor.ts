import type {
  CalculationMemoryEntry,
  CalculationMemoryParameter,
  CalculationTargetType,
  CalculationType,
  ExtractedCalculationMemory,
} from './calculation-memory.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function getText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

function normalizeCalculationType(value: unknown): CalculationType | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toUpperCase();
  if (v === 'CONSUMPTION') return 'CONSUMPTION';
  if (v === 'INSTITUTIONAL_SIZING') return 'INSTITUTIONAL_SIZING';
  return null;
}

function normalizeTargetType(value: unknown): CalculationTargetType | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toUpperCase();
  if (v === 'ITEM') return 'ITEM';
  if (v === 'LOT') return 'LOT';
  return null;
}

function normalizeParameter(raw: unknown): CalculationMemoryParameter | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const name = getText(rec.name);
  if (!name) return null;
  const valueRaw = rec.value;
  const value =
    typeof valueRaw === 'number'
      ? valueRaw
      : typeof valueRaw === 'string'
      ? valueRaw.trim()
      : valueRaw === undefined || valueRaw === null
      ? null
      : String(valueRaw).trim();
  if (value === null || value === '') return null;
  const unit = getText(rec.unit) || undefined;
  const description = getText(rec.description) || undefined;
  return { name, value: typeof value === 'number' ? value : String(value), unit, description };
}

function normalizeEntry(raw: unknown): CalculationMemoryEntry | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const calculationType = normalizeCalculationType(rec.calculationType);
  const targetType = normalizeTargetType(rec.targetType);
  const targetId = getText(rec.targetId);
  const formula = getText(rec.formula);
  const justification = getText(rec.justification);

  const resultRaw = rec.result;
  const result =
    typeof resultRaw === 'number'
      ? resultRaw
      : typeof resultRaw === 'string' && resultRaw.trim() !== ''
      ? Number(resultRaw)
      : Number.NaN;

  const paramsRaw = asArray(rec.parameters) ?? [];
  const parameters: CalculationMemoryParameter[] = [];
  for (const p of paramsRaw) {
    const np = normalizeParameter(p);
    if (np) parameters.push(np);
  }

  if (!calculationType || !targetType || !targetId) return null;
  if (!Number.isFinite(result)) return null;
  if (parameters.length === 0) return null;
  if (!formula) return null;
  if (!justification) return null;

  return {
    calculationType,
    targetType,
    targetId,
    parameters,
    formula,
    result,
    justification,
  };
}

/**
 * Extrai e normaliza a memória de cálculo do payload genérico.
 *
 * Política de retrocompatibilidade:
 * - ausência de memória de cálculo → retorna lista vazia
 * - aceita `calculationMemories` (array) ou `calculationMemory` (objeto único)
 * - nunca lança erro; validações estruturais ficam no validator.
 */
export function extractCalculationMemory(
  payload: Record<string, unknown> | null | undefined
): ExtractedCalculationMemory {
  const raw = payload ?? {};
  const memoriesRaw = asArray(raw['calculationMemories']);
  const singleRaw = asRecord(raw['calculationMemory']);

  const candidates: unknown[] = memoriesRaw ?? (singleRaw ? [singleRaw] : []);

  const entries: CalculationMemoryEntry[] = [];
  for (const c of candidates) {
    const e = normalizeEntry(c);
    if (e) entries.push(e);
  }

  const calculationTypes = Array.from(new Set(entries.map((e) => e.calculationType)));
  const calculationTargets = entries.map((e) => ({
    targetType: e.targetType,
    targetId: e.targetId,
  }));
  const consumptionCount = entries.filter((e) => e.calculationType === 'CONSUMPTION').length;
  const institutionalSizingCount = entries.filter((e) => e.calculationType === 'INSTITUTIONAL_SIZING').length;

  return {
    entries,
    count: entries.length,
    calculationTypes,
    calculationTargets,
    consumptionCount,
    institutionalSizingCount,
  };
}

