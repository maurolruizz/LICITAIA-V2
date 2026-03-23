/**
 * Testes unitários: Motor de Necessidade Administrativa (extractor + validator).
 * Fase 26 — Problema público, necessidade administrativa, resultado esperado.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { extractAdministrativeNeed } from './administrative-need.extractor';
import { applyAdministrativeNeedValidations } from './administrative-need.validator';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { buildAdministrativeNeedMetadata } from '../../shared/metadata/metadata-composer';

const MIN_LEN = 20;

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

describe('AdministrativeNeed', () => {
  it('necessidade válida', async () => {
  const payload = {
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Falta de equipamentos para atendimento à demanda atual da equipe.',
        administrativeNeed: 'Aquisição de notebooks para desenvolvimento.',
        expectedOutcome: 'Atendimento à demanda com equipamentos adequados e rastreabilidade.',
      },
    ],
  };
  const extracted = extractAdministrativeNeed(payload);
  assert.equal(extracted.count, 1);
  assert.equal(extracted.needWithoutProblemCount, 0);
  assert.equal(extracted.needWithoutOutcomeCount, 0);

  const structure = extractedMultipleItems(['i1']);
  const items: ValidationItemContract[] = [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items);
  assert.equal(items.length, 0, '1: necessidade válida não deve gerar itens de validação');

  const meta = buildAdministrativeNeedMetadata(extracted, structure);
  assert.equal(meta.administrativeNeed.hasAdministrativeNeed, true);
  assert.equal(meta.administrativeNeed.totalNeeds, 1);
  assert.equal(meta.administrativeNeed.objectWithoutNeedCount, 0);
  });

  it('item sem necessidade (OBJECT_WITHOUT_NEED)', async () => {
  const structure = extractedMultipleItems(['i1', 'i2']);
  const extracted = extractAdministrativeNeed({
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Problema público com descrição suficiente para o item i1.',
        expectedOutcome: 'Resultado esperado com descrição suficiente para o item i1.',
      },
    ],
  });
  const items: ValidationItemContract[] = [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'ADMINISTRATIVE_NEED_OBJECT_WITHOUT_NEED'), '2: deve existir OBJECT_WITHOUT_NEED para i2');
  assert.ok(items.some((i) => i.message.includes('i2')), '2: mensagem deve mencionar item i2');
  });

  it('necessidade sem problema (NEED_WITHOUT_PROBLEM)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractAdministrativeNeed({
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Curto',
        expectedOutcome: 'Resultado esperado com descrição suficiente para validação mínima.',
      },
    ],
  });
  assert.equal(extracted.needWithoutProblemCount, 1);
  const items: ValidationItemContract[] = [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'ADMINISTRATIVE_NEED_WITHOUT_PROBLEM'), '3: deve existir NEED_WITHOUT_PROBLEM');
  });

  it('necessidade sem resultado esperado (NEED_WITHOUT_EXPECTED_OUTCOME)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractAdministrativeNeed({
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Problema público com descrição suficiente para validação.',
        expectedOutcome: '',
      },
    ],
  });
  assert.equal(extracted.needWithoutOutcomeCount, 1);
  const items: ValidationItemContract[] = [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'ADMINISTRATIVE_NEED_WITHOUT_EXPECTED_OUTCOME'), '4: deve existir NEED_WITHOUT_EXPECTED_OUTCOME');
  });

  it('necessidade apontando item inexistente (NEED_TARGET_NOT_FOUND)', async () => {
  const structure = extractedMultipleItems(['i1']);
  const extracted = extractAdministrativeNeed({
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'item-inexistente',
        problemDescription: 'Problema público com descrição suficiente para validação.',
        expectedOutcome: 'Resultado esperado com descrição suficiente para validação.',
      },
    ],
  });
  const items: ValidationItemContract[] = [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items);
  assert.ok(items.some((i) => i.code === 'ADMINISTRATIVE_NEED_TARGET_NOT_FOUND'), '5: deve existir NEED_TARGET_NOT_FOUND');
  assert.ok(items.some((i) => i.message.includes('item-inexistente')), '5: mensagem deve mencionar item inexistente');
  });

  it('need contém campos de estratégia (ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS)', async () => {
  const payload = {
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Problema público com descrição suficiente para validação mínima.',
        expectedOutcome: 'Resultado esperado com descrição suficiente para validação.',
        procurementModality: 'PREGAO',
      },
    ],
  };
  const extracted = extractAdministrativeNeed(payload);
  const structure = extractedMultipleItems(['i1']);
  const items: ValidationItemContract[] = [];
  const rawNeedEntries = Array.isArray(payload.administrativeNeeds) ? payload.administrativeNeeds : [];
  applyAdministrativeNeedValidations(structure, extracted.entries, items, rawNeedEntries);
  assert.ok(items.some((i) => i.code === 'ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS'), '6: deve existir ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS');
  });

  it('extractor: single and array', async () => {
  const outNull = extractAdministrativeNeed(null);
  assert.equal(outNull.count, 0);
  assert.deepEqual(outNull.entries, []);

  const single = extractAdministrativeNeed({
    administrativeNeed: {
      targetType: 'process',
      problemDescription: 'Problema público com descrição mínima suficiente.',
      expectedOutcome: 'Resultado esperado com descrição mínima suficiente.',
    },
  });
  assert.equal(single.count, 1);
  assert.equal(single.entries[0]!.targetType, 'process');
  assert.equal(single.processNeedCount, 1);

  const arr = extractAdministrativeNeed({
    administrativeNeeds: [
      { targetType: 'item', targetId: 'i1', problemDescription: 'A'.repeat(MIN_LEN), expectedOutcome: 'B'.repeat(MIN_LEN) },
      { targetType: 'item', targetId: 'i2', problemDescription: 'C'.repeat(MIN_LEN), expectedOutcome: 'D'.repeat(MIN_LEN) },
    ],
  });
  assert.equal(arr.count, 2);
  assert.equal(arr.itemNeedCount, 2);
  });
});
