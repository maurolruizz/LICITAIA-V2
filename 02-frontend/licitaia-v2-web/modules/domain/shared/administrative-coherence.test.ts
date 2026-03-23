/**
 * Testes unitários: Motor de Coerência Administrativa (engine + validator).
 * Fase 25 — Integração entre justificativa, objeto e memória de cálculo.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { executeAdministrativeCoherenceEngine } from './administrative-coherence.engine';
import { applyAdministrativeCoherenceValidations } from './administrative-coherence.validator';
import { ADMINISTRATIVE_COHERENCE_ISSUE_TYPES } from './administrative-coherence.types';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ExtractedCalculationMemory } from './calculation-memory.types';
import type { ExtractedAdministrativeJustification } from './administrative-justification.types';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';

function extractedMultipleItems(ids: string[] = ['i1', 'i2']): ExtractedProcurementStructure {
  return {
    structureType: 'multiple_items',
    structure: {
      structureType: 'multiple_items',
      items: ids.map((id, i) => ({ id, description: `Item ${i + 1}` })),
    },
    lotCount: 0,
    itemCount: ids.length,
  };
}

function extractedLot(lotId = 'l1', itemIds: string[] = ['i1']): ExtractedProcurementStructure {
  return {
    structureType: 'lot',
    structure: {
      structureType: 'lot',
      lots: [
        {
          id: lotId,
          description: 'Lote 1',
          items: itemIds.map((id, i) => ({ id, description: `Item ${i + 1}` })),
        },
      ],
    },
    lotCount: 1,
    itemCount: itemIds.length,
  };
}

function emptyCalculationMemory(): ExtractedCalculationMemory {
  return {
    entries: [],
    count: 0,
    calculationTypes: [],
    calculationTargets: [],
    consumptionCount: 0,
    institutionalSizingCount: 0,
  };
}

function emptyAdministrativeJustification(): ExtractedAdministrativeJustification {
  return {
    entries: [],
    count: 0,
    processJustificationCount: 0,
    itemJustificationCount: 0,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };
}

describe('AdministrativeCoherence', () => {
  it('estrutura válida (sem incoerências)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'CONSUMPTION',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'monthlyAverage', value: 100 }],
        formula: 'monthlyAverage * 12',
        result: 1200,
        justification: 'Consumo histórico mensal para cobertura anual.',
      },
    ],
    count: 1,
    calculationTypes: ['CONSUMPTION'],
    calculationTargets: [{ targetType: 'ITEM', targetId: 'i1' }],
    consumptionCount: 1,
    institutionalSizingCount: 0,
  };
  const justification: ExtractedAdministrativeJustification = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        administrativeNeed: 'Demanda baseada em consumo histórico com cobertura anual.',
      },
    ],
    count: 1,
    processJustificationCount: 0,
    itemJustificationCount: 1,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };

  const result = executeAdministrativeCoherenceEngine(structure, calculation, justification);
  assert.equal(result.hasCoherenceIssues, false, '1: não deve haver incoerências');
  assert.equal(result.totalIssues, 0, '1: totalIssues deve ser 0');

  const items: ValidationItemContract[] = [];
  applyAdministrativeCoherenceValidations(result, items);
  assert.equal(items.length, 0, '1: validator não deve adicionar itens');
  });

  it('objeto sem justificativa (OBJECT_WITHOUT_JUSTIFICATION)', async () => {
  const structure = extractedMultipleItems(['i1', 'i2']);
  const justification: ExtractedAdministrativeJustification = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        administrativeNeed: 'Apenas item i1 possui justificativa com conteúdo mínimo para validação estrutural.',
      },
    ],
    count: 1,
    processJustificationCount: 0,
    itemJustificationCount: 1,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };

  const result = executeAdministrativeCoherenceEngine(
    structure,
    emptyCalculationMemory(),
    justification
  );
  assert.equal(result.hasCoherenceIssues, true, '2: deve haver incoerência (objeto sem justificativa)');
  assert.ok(
    result.issues.some(
      (i) =>
        i.type === ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.OBJECT_WITHOUT_JUSTIFICATION && i.targetId === 'i2'
    ),
    '2: deve existir issue OBJECT_WITHOUT_JUSTIFICATION para i2'
  );
  assert.equal(result.objectWithoutJustificationCount, 1, '2: objectWithoutJustificationCount = 1');

  const items: ValidationItemContract[] = [];
  applyAdministrativeCoherenceValidations(result, items);
  assert.ok(items.length >= 1, '2: validator deve adicionar pelo menos um item');
  assert.ok(
    items.some((i) => i.code.includes('OBJECT_WITHOUT_JUSTIFICATION')),
    '2: deve existir código ADMINISTRATIVE_COHERENCE_OBJECT_WITHOUT_JUSTIFICATION'
  );
  });

  it('cálculo sem justificativa (CALCULATION_WITHOUT_JUSTIFICATION)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'CONSUMPTION',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'monthlyAverage', value: 50 }],
        formula: 'monthlyAverage * 12',
        result: 600,
        justification: 'Memória de cálculo com justificativa mínima interna para o cálculo.',
      },
    ],
    count: 1,
    calculationTypes: ['CONSUMPTION'],
    calculationTargets: [{ targetType: 'ITEM', targetId: 'i1' }],
    consumptionCount: 1,
    institutionalSizingCount: 0,
  };
  const justification = emptyAdministrativeJustification();

  const result = executeAdministrativeCoherenceEngine(structure, calculation, justification);
  assert.equal(result.hasCoherenceIssues, true, '3: deve haver incoerência (cálculo sem justificativa)');
  assert.ok(
    result.issues.some(
      (i) =>
        i.type === ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.CALCULATION_WITHOUT_JUSTIFICATION && i.targetId === 'i1'
    ),
    '3: deve existir issue CALCULATION_WITHOUT_JUSTIFICATION para i1'
  );
  assert.equal(result.calculationWithoutJustificationCount, 1, '3: calculationWithoutJustificationCount = 1');
  });

  it('justificativa apontando item inexistente (JUSTIFICATION_TARGET_NOT_FOUND)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const justification: ExtractedAdministrativeJustification = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        administrativeNeed: 'Justificativa para item existente com conteúdo mínimo.',
      },
      {
        targetType: 'item',
        targetId: 'item-inexistente',
        administrativeNeed: 'Justificativa que aponta para item que não existe na estrutura do objeto.',
      },
    ],
    count: 2,
    processJustificationCount: 0,
    itemJustificationCount: 2,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };

  const result = executeAdministrativeCoherenceEngine(
    structure,
    emptyCalculationMemory(),
    justification
  );
  assert.equal(result.hasCoherenceIssues, true, '4: deve haver incoerência (justificativa target não encontrado)');
  assert.ok(
    result.issues.some(
      (i) =>
        i.type === ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.JUSTIFICATION_TARGET_NOT_FOUND &&
        i.targetId === 'item-inexistente'
    ),
    '4: deve existir issue JUSTIFICATION_TARGET_NOT_FOUND para item-inexistente'
  );
  assert.equal(result.justificationWithoutTargetCount, 1, '4: justificationWithoutTargetCount = 1');
  });

  it('mismatch cálculo vs justificativa (JUSTIFICATION_CALCULATION_MISMATCH)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'INSTITUTIONAL_SIZING',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'workstations', value: 10 }],
        formula: 'workstations * 2',
        result: 20,
        justification: 'Dimensionamento institucional por postos de trabalho.',
      },
    ],
    count: 1,
    calculationTypes: ['INSTITUTIONAL_SIZING'],
    calculationTargets: [{ targetType: 'ITEM', targetId: 'i1' }],
    consumptionCount: 0,
    institutionalSizingCount: 1,
  };
  const justification: ExtractedAdministrativeJustification = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemStatement: 'Demanda baseada em consumo histórico dos últimos doze meses.',
        administrativeNeed: 'Atendimento ao consumo mensal com base em histórico.',
      },
    ],
    count: 1,
    processJustificationCount: 0,
    itemJustificationCount: 1,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };

  const result = executeAdministrativeCoherenceEngine(structure, calculation, justification);
  assert.equal(result.hasCoherenceIssues, true, '5: deve haver incoerência (mismatch justificativa vs cálculo)');
  assert.ok(
    result.issues.some(
      (i) =>
        i.type === ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.JUSTIFICATION_CALCULATION_MISMATCH && i.targetId === 'i1'
    ),
    '5: deve existir issue JUSTIFICATION_CALCULATION_MISMATCH para i1'
  );
  assert.equal(result.justificationCalculationMismatchCount, 1, '5: justificationCalculationMismatchCount = 1');

  const items: ValidationItemContract[] = [];
  applyAdministrativeCoherenceValidations(result, items);
  assert.ok(items.some((i) => i.code.includes('JUSTIFICATION_CALCULATION_MISMATCH')), '5: validator deve emitir código de mismatch');
  assert.equal(items[0]!.severity, ValidationSeverity.BLOCK, '5: severidade do issue de coerência deve ser BLOCK');
  });

  it('validator sem issues não adiciona itens', async () => {
  const result = executeAdministrativeCoherenceEngine(
    extractedMultipleItems([]),
    emptyCalculationMemory(),
    emptyAdministrativeJustification()
  );
  const items: ValidationItemContract[] = [];
  applyAdministrativeCoherenceValidations(result, items);
  assert.equal(items.length, 0, 'validator sem issues: não adiciona itens');
  });
});
