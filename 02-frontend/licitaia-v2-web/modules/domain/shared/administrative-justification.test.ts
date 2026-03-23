/**
 * Testes unitários: justificativa administrativa (extractor + validator).
 * Fase 24 — Consolidação da justificativa administrativa estruturada.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { extractAdministrativeJustification } from './administrative-justification.extractor';
import { applyAdministrativeJustificationValidations } from './administrative-justification.validator';
import type { AdministrativeJustificationEntry } from './administrative-justification.types';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { buildAdministrativeJustificationMetadata } from '../../shared/metadata/metadata-composer';

function validProcessJustification(overrides?: Partial<AdministrativeJustificationEntry>): AdministrativeJustificationEntry {
  return {
    targetType: 'process',
    problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico.',
    ...overrides,
  };
}

function validItemJustification(overrides?: Partial<AdministrativeJustificationEntry>): AdministrativeJustificationEntry {
  return {
    targetType: 'item',
    targetId: 'i1',
    administrativeNeed: 'Atendimento à demanda de consumo histórico mensal com cobertura anual e margem de segurança.',
    ...overrides,
  };
}

function validLotJustification(overrides?: Partial<AdministrativeJustificationEntry>): AdministrativeJustificationEntry {
  return {
    targetType: 'lot',
    targetId: 'l1',
    expectedOutcome: 'Entrega dos itens em lote único com ganho de escala e padronização dos processos de recebimento.',
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

describe('AdministrativeJustification', () => {
  it('extractor: null payload', async () => {
  const outNull = extractAdministrativeJustification(null);
  assert.deepEqual(outNull.entries, []);
  assert.equal(outNull.count, 0);
  });

  it('extractor: empty payload', async () => {
  const outEmpty = extractAdministrativeJustification({});
  assert.equal(outEmpty.count, 0);
  assert.deepEqual(outEmpty.entries, []);
  });

  it('extractor: process justification', async () => {
  const payloadProcess = {
    administrativeJustification: {
      targetType: 'process',
      problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico.',
    },
  };
  const outProcess = extractAdministrativeJustification(payloadProcess);
  assert.equal(outProcess.count, 1);
  assert.equal(outProcess.entries[0]!.targetType, 'process');
  assert.equal(outProcess.processJustificationCount, 1);
  });

  it('extractor: item justification', async () => {
  const payloadItem = {
    administrativeJustifications: [
      {
        targetType: 'item',
        targetId: 'i1',
        administrativeNeed: 'Atendimento à demanda de consumo histórico mensal com cobertura anual.',
      },
    ],
  };
  const outItem = extractAdministrativeJustification(payloadItem);
  assert.equal(outItem.count, 1);
  assert.equal(outItem.entries[0]!.targetType, 'item');
  assert.equal(outItem.entries[0]!.targetId, 'i1');
  assert.equal(outItem.itemJustificationCount, 1);
  });

  it('extractor: lot justification', async () => {
  const payloadLot = {
    administrativeJustifications: [
      {
        targetType: 'lot',
        targetId: 'l1',
        expectedOutcome: 'Entrega dos itens em lote único com ganho de escala e padronização.',
      },
    ],
  };
  const outLot = extractAdministrativeJustification(payloadLot);
  assert.equal(outLot.count, 1);
  assert.equal(outLot.entries[0]!.targetType, 'lot');
  assert.equal(outLot.lotJustificationCount, 1);
  });

  it('extractor: with legal basis', async () => {
  const payloadWithLegalBasis = {
    administrativeJustification: {
      targetType: 'process',
      problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico.',
      legalBasis: 'Lei 14.133/2021, art. 7º.',
    },
  };
  const outLegal = extractAdministrativeJustification(payloadWithLegalBasis);
  assert.equal(outLegal.withLegalBasisCount, 1);
  });

  it('extractor: missing critical fields count', async () => {
  const payloadNoMaterial = {
    administrativeJustifications: [
      { targetType: 'process', problemStatement: 'Curta.' },
    ],
  };
  const outNoMaterial = extractAdministrativeJustification(payloadNoMaterial);
  assert.equal(outNoMaterial.count, 1);
  assert.equal(outNoMaterial.missingCriticalFieldsCount, 1);
  });

  it('extractor: invalid targetType preserved for validator', async () => {
  const payloadInvalidTargetType = {
    administrativeJustifications: [
      { targetType: 'other', problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico.' },
    ],
  };
  const outInvalidType = extractAdministrativeJustification(payloadInvalidTargetType);
  assert.equal(outInvalidType.count, 1, 'extractor must preserve invalid targetType for validator to block');
  assert.equal(outInvalidType.entries[0]!.targetType, 'other');
  const itemsInvalidType: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), outInvalidType.entries, itemsInvalidType);
  assert.ok(itemsInvalidType.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_TYPE_INVALID'), 'validator must block invalid targetType');
  });

  it('extractor: item without targetId preserved for validator', async () => {
  const payloadItemWithoutTargetId = {
    administrativeJustifications: [
      { targetType: 'item', administrativeNeed: 'Atendimento à demanda de consumo histórico mensal com cobertura anual e margem de segurança.' },
    ],
  };
  const outItemNoId = extractAdministrativeJustification(payloadItemWithoutTargetId);
  assert.equal(outItemNoId.count, 1, 'extractor must preserve item without targetId for validator to block');
  assert.equal(outItemNoId.entries[0]!.targetId, undefined);
  const itemsItemNoId: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), outItemNoId.entries, itemsItemNoId);
  assert.ok(itemsItemNoId.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_ID_MISSING'), 'validator must block missing targetId for item');
  });

  it('validator: empty entries', async () => {
  const itemsEmpty: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [], itemsEmpty);
  assert.equal(itemsEmpty.length, 0);
  });

  it('validator: valid process justification', async () => {
  const itemsValidProcess: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [validProcessJustification()], itemsValidProcess);
  const blockProcess = itemsValidProcess.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockProcess.length, 0);
  });

  it('validator: valid item justification', async () => {
  const itemsValidItem: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [validItemJustification()], itemsValidItem);
  const blockItem = itemsValidItem.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockItem.length, 0);
  });

  it('validator: valid lot justification', async () => {
  const itemsValidLot: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedLot(), [validLotJustification()], itemsValidLot);
  const blockLot = itemsValidLot.filter((i) => i.severity === ValidationSeverity.BLOCK);
  assert.equal(blockLot.length, 0);
  });

  it('validator: invalid target type', async () => {
  const itemsInvalidTargetType: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [{ ...validProcessJustification(), targetType: 'other' as any }], itemsInvalidTargetType);
  assert.ok(itemsInvalidTargetType.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_TYPE_INVALID'));
  });

  it('validator: target id missing', async () => {
  const itemsTargetIdMissing: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [validItemJustification({ targetId: undefined })], itemsTargetIdMissing);
  assert.ok(itemsTargetIdMissing.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_ID_MISSING'));
  });

  it('validator: missing critical fields', async () => {
  const itemsMissingCritical: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [validProcessJustification({ problemStatement: 'Curta.', administrativeNeed: undefined, expectedOutcome: undefined })], itemsMissingCritical);
  assert.ok(itemsMissingCritical.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_MISSING_CRITICAL_FIELDS'));
  });

  it('validator: target item not found', async () => {
  const itemsTargetItemNotFound: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedMultipleItems(), [validItemJustification({ targetId: 'i99' })], itemsTargetItemNotFound);
  assert.ok(itemsTargetItemNotFound.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_ITEM_NOT_FOUND'));
  });

  it('validator: target lot not found', async () => {
  const itemsTargetLotNotFound: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(extractedLot(), [validLotJustification({ targetId: 'l99' })], itemsTargetLotNotFound);
  assert.ok(itemsTargetLotNotFound.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_LOT_NOT_FOUND'));
  });

  it('validator: justification contains strategy fields', async () => {
  const payloadJustificationWithStrategyFields = {
    administrativeJustifications: [
      {
        targetType: 'process',
        problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico.',
        procurementModality: 'PREGAO',
      },
    ],
  };
  const extractedWithStrategy = extractAdministrativeJustification(payloadJustificationWithStrategyFields);
  const rawJustificationEntries = Array.isArray(payloadJustificationWithStrategyFields.administrativeJustifications)
    ? payloadJustificationWithStrategyFields.administrativeJustifications
    : [];
  const itemsJustificationContainsStrategy: ValidationItemContract[] = [];
  applyAdministrativeJustificationValidations(
    extractedMultipleItems(),
    extractedWithStrategy.entries,
    itemsJustificationContainsStrategy,
    rawJustificationEntries
  );
  assert.ok(
    itemsJustificationContainsStrategy.some((i) => i.code === 'ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS'),
    'validator must block when justification contains strategy fields'
  );
  });

  it('metadata: buildAdministrativeJustificationMetadata', async () => {
  const extracted = extractAdministrativeJustification({
    administrativeJustifications: [
      { targetType: 'process', problemStatement: 'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico.' },
      { targetType: 'item', targetId: 'i1', administrativeNeed: 'Atendimento à demanda de consumo histórico mensal com cobertura anual.' },
    ],
  });
  const meta = buildAdministrativeJustificationMetadata(extracted);
  assert.equal(meta.administrativeJustification.hasAdministrativeJustification, true);
  assert.equal(meta.administrativeJustification.totalJustifications, 2);
  assert.equal(meta.administrativeJustification.processJustificationCount, 1);
  assert.equal(meta.administrativeJustification.itemJustificationCount, 1);
  assert.equal(meta.administrativeJustification.lotJustificationCount, 0);
  });
});
