/**
 * Testes unitários: memória de cálculo (extractor + validator).
 * Fase 23 — Consolidação estrutural da memória de cálculo.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { extractCalculationMemory } from './calculation-memory.extractor';
import { applyCalculationMemoryValidations } from './calculation-memory.validator';
import type { CalculationMemoryEntry } from './calculation-memory.types';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';

function validConsumptionEntry(overrides?: Partial<CalculationMemoryEntry>): CalculationMemoryEntry {
  return {
    calculationType: 'CONSUMPTION',
    targetType: 'ITEM',
    targetId: 'i1',
    parameters: [{ name: 'monthlyAverage', value: 100, unit: 'un', description: 'Média mensal' }],
    formula: 'monthlyAverage * 12',
    result: 1200,
    justification: 'Consumo histórico mensal médio multiplicado por doze meses para cobertura anual.',
    ...overrides,
  };
}

function validSizingEntry(overrides?: Partial<CalculationMemoryEntry>): CalculationMemoryEntry {
  return {
    calculationType: 'INSTITUTIONAL_SIZING',
    targetType: 'ITEM',
    targetId: 'i1',
    parameters: [{ name: 'workstations', value: 10 }, { name: 'technicalReserve', value: 2 }],
    formula: 'workstations + technicalReserve',
    result: 12,
    justification: 'Dimensionamento por postos de trabalho mais reserva técnica institucional.',
    ...overrides,
  };
}

function extractedMultipleItems(): ExtractedProcurementStructure {
  return {
    structureType: 'multiple_items',
    structure: { structureType: 'multiple_items', items: [{ id: 'i1', description: 'Item 1' }, { id: 'i2', description: 'Item 2' }] },
    lotCount: 0,
    itemCount: 2,
  };
}

function extractedLot(): ExtractedProcurementStructure {
  return {
    structureType: 'lot',
    structure: {
      structureType: 'lot',
      lots: [{ id: 'l1', description: 'Lote 1', items: [{ id: 'i1', description: 'Item 1' }] }],
    },
    lotCount: 1,
    itemCount: 1,
  };
}

describe('CalculationMemory', () => {
  it('extractor: null payload', async () => {
  const outNull = extractCalculationMemory(null);
  assert.deepEqual(outNull.entries, []);
  assert.equal(outNull.count, 0);
  });

  it('extractor: empty payload', async () => {
  const outEmpty = extractCalculationMemory({});
  assert.equal(outEmpty.count, 0);
  assert.deepEqual(outEmpty.entries, []);
  });

  it('extractor: single calculationMemory', async () => {
  const payloadSingle = {
    calculationMemory: {
      calculationType: 'CONSUMPTION',
      targetType: 'ITEM',
      targetId: 'i1',
      parameters: [{ name: 'monthlyAverage', value: 100 }],
      formula: 'monthlyAverage * 12',
      result: 1200,
      justification: 'Consumo histórico mensal médio multiplicado por doze meses para cobertura anual.',
    },
  };
  const outSingle = extractCalculationMemory(payloadSingle);
  assert.equal(outSingle.count, 1);
  assert.equal(outSingle.entries[0]!.calculationType, 'CONSUMPTION');
  assert.equal(outSingle.entries[0]!.targetId, 'i1');
  assert.equal(outSingle.entries[0]!.result, 1200);
  });

  it('extractor: multiple calculationMemories', async () => {
  const payloadMultiple = {
    calculationMemories: [
      {
        calculationType: 'CONSUMPTION',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'monthlyAverage', value: 50 }],
        formula: 'monthlyAverage * 12',
        result: 600,
        justification: 'Consumo mensal médio vezes doze para cobertura anual completa.',
      },
      {
        calculationType: 'INSTITUTIONAL_SIZING',
        targetType: 'LOT',
        targetId: 'l1',
        parameters: [{ name: 'workstations', value: 5 }],
        formula: 'workstations',
        result: 5,
        justification: 'Dimensionamento institucional por postos de trabalho existentes.',
      },
    ],
  };
  const outMultiple = extractCalculationMemory(payloadMultiple);
  assert.equal(outMultiple.count, 2);
  assert.equal(outMultiple.consumptionCount, 1);
  assert.equal(outMultiple.institutionalSizingCount, 1);
  });

  it('extractor: invalid entries filtered', async () => {
  const payloadInvalid = {
    calculationMemories: [
      { calculationType: 'OTHER', targetType: 'ITEM', targetId: 'i1', parameters: [{ name: 'x', value: 1 }], formula: 'x', result: 1, justification: 'Justificativa mínima com mais de vinte caracteres.' },
      { calculationType: 'CONSUMPTION', targetType: 'ITEM', targetId: 'i1', parameters: [{ name: 'monthlyAverage', value: 10 }], formula: 'x', result: 0, justification: 'Justificativa mínima com mais de vinte caracteres.' },
      { calculationType: 'CONSUMPTION', targetType: 'ITEM', targetId: 'i1', parameters: [{ name: 'monthlyAverage', value: 10 }], formula: 'monthlyAverage * 12', result: 120, justification: 'Curta.' },
    ],
  };
  const outInvalid = extractCalculationMemory(payloadInvalid);
  assert.equal(outInvalid.count, 2);
  assert.ok(!outInvalid.entries.some((e) => e.calculationType === 'OTHER'));
  });

  it('validator: empty structure and entries', async () => {
  const itemsEmpty: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [], itemsEmpty);
  assert.equal(itemsEmpty.length, 0);
  });

  it('validator: valid consumption entry', async () => {
  const itemsValidConsumption: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [validConsumptionEntry()], itemsValidConsumption);
  const blockConsumption = itemsValidConsumption.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockConsumption.length, 0);
  });

  it('validator: valid sizing entry', async () => {
  const itemsValidSizing: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [validSizingEntry()], itemsValidSizing);
  const blockSizing = itemsValidSizing.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockSizing.length, 0);
  });

  it('validator: valid lot entry', async () => {
  const entryLot: CalculationMemoryEntry = { ...validSizingEntry(), targetType: 'LOT', targetId: 'l1' };
  const itemsValidLot: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedLot(), [entryLot], itemsValidLot);
  const blockLot = itemsValidLot.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockLot.length, 0);
  });

  it('validator: invalid target type', async () => {
  const itemsInvalidTargetType: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [{ ...validConsumptionEntry(), targetType: 'OTHER' as any }], itemsInvalidTargetType);
  assert.ok(itemsInvalidTargetType.some((i) => i.code === 'CALCULATION_MEMORY_TARGET_TYPE_INVALID'));
  });

  it('validator: invalid result', async () => {
  const itemsInvalidResult: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [validConsumptionEntry({ result: 0 })], itemsInvalidResult);
  assert.ok(itemsInvalidResult.some((i) => i.code === 'CALCULATION_MEMORY_RESULT_INVALID'));
  });

  it('validator: invalid justification length', async () => {
  const itemsInvalidJustification: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [validConsumptionEntry({ justification: 'Curta' })], itemsInvalidJustification);
  assert.ok(itemsInvalidJustification.some((i) => i.code === 'CALCULATION_MEMORY_JUSTIFICATION_MISSING'));
  });

  it('validator: target item not found', async () => {
  const itemsTargetItemNotFound: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedMultipleItems(), [validConsumptionEntry({ targetId: 'i99' })], itemsTargetItemNotFound);
  assert.ok(itemsTargetItemNotFound.some((i) => i.code === 'CALCULATION_MEMORY_TARGET_ITEM_NOT_FOUND'));
  });

  it('validator: target lot not found', async () => {
  const itemsTargetLotNotFound: ValidationItemContract[] = [];
  applyCalculationMemoryValidations(extractedLot(), [validConsumptionEntry({ targetType: 'LOT', targetId: 'l99' })], itemsTargetLotNotFound);
  assert.ok(itemsTargetLotNotFound.some((i) => i.code === 'CALCULATION_MEMORY_TARGET_LOT_NOT_FOUND'));
  });
});
