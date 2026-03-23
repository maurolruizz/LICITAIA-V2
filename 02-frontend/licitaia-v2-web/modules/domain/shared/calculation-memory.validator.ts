import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { CalculationMemoryEntry, CalculationType } from './calculation-memory.types';

function getText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

function isFinitePositiveNumber(value: unknown): boolean {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0;
}

function collectValidItemIds(extracted: ExtractedProcurementStructure): Set<string> {
  const ids = new Set<string>();
  if (extracted.structureType === 'multiple_items') {
    for (const it of extracted.structure.items ?? []) ids.add(it.id);
  }
  if (extracted.structureType === 'lot') {
    for (const lot of extracted.structure.lots ?? []) {
      for (const it of lot.items ?? []) ids.add(it.id);
    }
  }
  return ids;
}

function collectValidLotIds(extracted: ExtractedProcurementStructure): Set<string> {
  const ids = new Set<string>();
  if (extracted.structureType === 'lot') {
    for (const lot of extracted.structure.lots ?? []) ids.add(lot.id);
  }
  return ids;
}

const CONSUMPTION_HINT_PARAMS = new Set([
  'historicalConsumption',
  'monthlyAverage',
  'frequency',
  'coveragePeriod',
  'technicalMargin',
]);

const SIZING_HINT_PARAMS = new Set([
  'operationalUnits',
  'workstations',
  'institutionalCapacity',
  'plannedExpansion',
  'technicalReserve',
]);

function hasAnyHintParam(entry: CalculationMemoryEntry, type: CalculationType): boolean {
  const names = new Set(entry.parameters.map((p) => p.name));
  const hints = type === 'CONSUMPTION' ? CONSUMPTION_HINT_PARAMS : SIZING_HINT_PARAMS;
  for (const h of hints) if (names.has(h)) return true;
  return false;
}

/**
 * Aplica travas estruturais mínimas para memória de cálculo, sem alterar contratos centrais.
 *
 * Política:
 * - se não houver entries → no-op (retrocompatível)
 * - se houver entries inválidas → BLOCK (a memória virou parte auditável do núcleo)
 */
export function applyCalculationMemoryValidations(
  extractedStructure: ExtractedProcurementStructure,
  entries: CalculationMemoryEntry[],
  items: ValidationItemContract[]
): void {
  if (!entries || entries.length === 0) return;

  const validItemIds = collectValidItemIds(extractedStructure);
  const validLotIds = collectValidLotIds(extractedStructure);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const idx = i + 1;

    if (e.calculationType !== 'CONSUMPTION' && e.calculationType !== 'INSTITUTIONAL_SIZING') {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_TYPE_INVALID',
          `Memória de cálculo #${idx} possui calculationType inválido.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (e.targetType !== 'ITEM' && e.targetType !== 'LOT') {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_TARGET_TYPE_INVALID',
          `Memória de cálculo #${idx} possui targetType inválido.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (getText(e.targetId).length === 0) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_TARGET_ID_MISSING',
          `Memória de cálculo #${idx} não possui targetId.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    } else if (e.targetType === 'ITEM' && validItemIds.size > 0 && !validItemIds.has(e.targetId)) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_TARGET_ITEM_NOT_FOUND',
          `Memória de cálculo #${idx} referencia item inexistente: ${e.targetId}.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    } else if (e.targetType === 'LOT' && validLotIds.size > 0 && !validLotIds.has(e.targetId)) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_TARGET_LOT_NOT_FOUND',
          `Memória de cálculo #${idx} referencia lote inexistente: ${e.targetId}.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (!Array.isArray(e.parameters) || e.parameters.length === 0) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_PARAMETERS_MISSING',
          `Memória de cálculo #${idx} não possui parâmetros.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    } else if (!e.parameters.every((p) => getText(p.name).length > 0 && getText(p.value).length > 0)) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_PARAMETERS_INVALID',
          `Memória de cálculo #${idx} possui parâmetros inválidos (name/value).`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (getText(e.formula).length < 3) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_FORMULA_MISSING',
          `Memória de cálculo #${idx} não possui fórmula auditável.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (!isFinitePositiveNumber(e.result)) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_RESULT_INVALID',
          `Memória de cálculo #${idx} não possui resultado numérico válido (> 0).`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (getText(e.justification).length < 20) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_JUSTIFICATION_MISSING',
          `Memória de cálculo #${idx} não possui justificativa administrativa mínima.`,
          ValidationSeverity.BLOCK,
          { field: 'calculationMemories' }
        )
      );
    }

    if (!hasAnyHintParam(e, e.calculationType)) {
      items.push(
        createValidationItem(
          'CALCULATION_MEMORY_PARAMETERS_INCOHERENT',
          `Memória de cálculo #${idx} não apresenta parâmetros típicos coerentes com ${e.calculationType}.`,
          ValidationSeverity.WARNING,
          { field: 'calculationMemories' }
        )
      );
    }
  }
}

