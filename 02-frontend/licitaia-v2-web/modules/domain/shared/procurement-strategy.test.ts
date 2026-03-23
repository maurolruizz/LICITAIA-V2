/**
 * Testes unitários: Motor de Estratégia de Contratação (extractor + validator).
 * Fase 27 — Decisão sobre como a contratação será conduzida.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { extractProcurementStrategy } from './procurement-strategy.extractor';
import { applyProcurementStrategyValidations } from './procurement-strategy.validator';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { buildProcurementStrategyMetadata } from '../../shared/metadata/metadata-composer';

const MIN_JUSTIFICATION = 20;

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
      lots: [{ id: lotId, description: 'Lote 1', items: itemIds.map((id, i) => ({ id, description: `Item ${i + 1}` })) }],
    },
    lotCount: 1,
    itemCount: itemIds.length,
  };
}

const validJustification = 'Aquisição por dispensa nos termos do art. 75 da Lei 14.133/2021.';

describe('ProcurementStrategy', () => {
  it('estratégia válida', async () => {
  const payload = {
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'DISPENSA',
        contractingJustification: validJustification,
        competitionStrategy: 'DIRECT_SELECTION',
      },
    ],
  };
  const extracted = extractProcurementStrategy(payload);
  assert.equal(extracted.count, 1);
  assert.equal(extracted.strategyWithoutModalityCount, 0);
  assert.equal(extracted.strategyWithoutJustificationCount, 0);

  const structure = extractedMultipleItems(['i1']);
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.equal(items.length, 0, '1: estratégia válida não deve gerar itens de validação');

  const meta = buildProcurementStrategyMetadata(extracted, structure);
  assert.equal(meta.procurementStrategy.hasStrategy, true);
  assert.equal(meta.procurementStrategy.totalStrategies, 1);
  assert.equal(meta.procurementStrategy.objectWithoutStrategyCount, 0);
  assert.equal(meta.procurementStrategy.strategyWithoutModalityCount, 0);
  assert.equal(meta.procurementStrategy.strategyWithoutJustificationCount, 0);
  });

  it('item sem estratégia (OBJECT_WITHOUT_STRATEGY)', async () => {
  const structure = extractedMultipleItems(['i1', 'i2']);
  const extracted = extractProcurementStrategy({
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'PREGAO',
        contractingJustification: 'Justificativa com tamanho mínimo suficiente para o item i1.',
      },
    ],
  });
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY'), '2: deve existir OBJECT_WITHOUT_STRATEGY para i2');
  assert.ok(items.some((i) => i.message.includes('i2')), '2: mensagem deve mencionar item i2');
  });

  it('estratégia sem modalidade (STRATEGY_WITHOUT_MODALITY)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractProcurementStrategy({
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        contractingJustification: validJustification,
      },
    ],
  });
  assert.equal(extracted.strategyWithoutModalityCount, 1);
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_WITHOUT_MODALITY'), '3: deve existir STRATEGY_WITHOUT_MODALITY');
  });

  it('estratégia sem justificativa (STRATEGY_WITHOUT_JUSTIFICATION)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractProcurementStrategy({
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'PREGAO',
        contractingJustification: 'Curto',
      },
    ],
  });
  assert.equal(extracted.strategyWithoutJustificationCount, 1);
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION'), '4: deve existir STRATEGY_WITHOUT_JUSTIFICATION');
  });

  it('modalidade incompatível com abordagem (MODALITY_INCOMPATIBLE_WITH_APPROACH)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractProcurementStrategy({
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'DISPENSA',
        contractingJustification: validJustification,
        competitionStrategy: 'OPEN_COMPETITION',
      },
    ],
  });
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH'), '5: deve existir MODALITY_INCOMPATIBLE_WITH_APPROACH');
  assert.ok(items.some((i) => i.message.includes('DISPENSA') && i.message.includes('OPEN_COMPETITION')), '5: mensagem deve mencionar DISPENSA e OPEN_COMPETITION');
  });

  it('extractor: single and array', async () => {
  const outNull = extractProcurementStrategy(null);
  assert.equal(outNull.count, 0);
  assert.deepEqual(outNull.entries, []);

  const single = extractProcurementStrategy({
    procurementStrategy: {
      targetType: 'process',
      procurementModality: 'CONCORRENCIA',
      contractingJustification: 'A'.repeat(MIN_JUSTIFICATION),
    },
  });
  assert.equal(single.count, 1);
  assert.equal(single.entries[0]!.targetType, 'process');
  assert.equal(single.processStrategyCount, 1);

  const arr = extractProcurementStrategy({
    procurementStrategies: [
      { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'B'.repeat(MIN_JUSTIFICATION) },
      { targetType: 'item', targetId: 'i2', procurementModality: 'DISPENSA', contractingJustification: 'C'.repeat(MIN_JUSTIFICATION) },
    ],
  });
  assert.equal(arr.count, 2);
  assert.equal(arr.itemStrategyCount, 2);
  });

  it('estratégia apontando item inexistente (TARGET_NOT_FOUND)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractProcurementStrategy({
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'item-inexistente',
        procurementModality: 'PREGAO',
        contractingJustification: validJustification,
      },
    ],
  });
  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_TARGET_NOT_FOUND'), '6: deve existir TARGET_NOT_FOUND');
  assert.ok(items.some((i) => i.message.includes('item-inexistente')), '6: mensagem deve mencionar item inexistente');
  });

  it('estratégia contém campos de necessidade (PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS)', async () => {
  const payload = {
    procurementStrategies: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'PREGAO',
        contractingJustification: validJustification,
        problemDescription: 'Problema público indevidamente no bloco de estratégia.',
      },
    ],
  };
  const extracted = extractProcurementStrategy(payload);
  const structure = extractedMultipleItems(['i1']);
  const items: ValidationItemContract[] = [];
  const rawStrategyEntries = Array.isArray(payload.procurementStrategies) ? payload.procurementStrategies : [];
  applyProcurementStrategyValidations(structure, extracted.entries, items, rawStrategyEntries);
  assert.ok(items.some((i) => i.code === 'PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS'), '7: deve existir PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS');
  });
});
