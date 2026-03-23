import assert from 'node:assert/strict';

// Importa diretamente o núcleo real (módulos) usado pelo runner da Fase 35.
import { extractAdministrativeNeed } from '../../../02-frontend/licitaia-v2-web/modules/domain/shared/administrative-need.extractor';
import { extractProcurementStructure } from '../../../02-frontend/licitaia-v2-web/modules/domain/shared/object-structure.extractor';
import { applyProcurementStrategyValidations } from '../../../02-frontend/licitaia-v2-web/modules/domain/shared/procurement-strategy.validator';
import type { ValidationItemContract } from '../../../02-frontend/licitaia-v2-web/modules/core/contracts/validation.contract';

function runNeedFallbackAuditabilityChecks(): void {
  const payloadWithoutNeedsButWithJustification = {
    // ausência explícita de administrativeNeed(s)
    administrativeJustifications: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemStatement: 'Problema público mínimo com rastreabilidade suficiente.',
        administrativeNeed: 'Necessidade administrativa mínima (derivável).',
        expectedOutcome: 'Resultado esperado mínimo (derivável).',
      },
    ],
  } as Record<string, unknown>;

  const extracted = extractAdministrativeNeed(payloadWithoutNeedsButWithJustification);
  assert.equal(extracted.fallbackApplied, true, 'fallbackApplied deve ser true quando houver derivação');
  assert.equal(extracted.nativeCount, 0, 'nativeCount deve ser 0 quando não houver NEED no payload');
  assert.equal(extracted.derivedFallbackCount, 1, 'derivedFallbackCount deve refletir as entries derivadas');
  assert.equal(extracted.count, 1, 'count deve refletir as entries derivadas');

  const e = extracted.entries[0]!;
  assert.equal(e.origin?.kind, 'DERIVED_FALLBACK', 'entry derivada deve ser marcada como DERIVED_FALLBACK');
  assert.equal(
    e.origin?.derivedFrom,
    'administrativeJustifications',
    'entry derivada deve preservar origem inequívoca (administrativeJustifications)'
  );
  assert.equal(
    e.origin?.mappedFields.problemDescriptionFrom,
    'problemStatement',
    'mapeamento de campos deve ser explícito'
  );

  const payloadTrulyWithoutNeedAndWithoutJustification = {} as Record<string, unknown>;
  const extractedEmpty = extractAdministrativeNeed(payloadTrulyWithoutNeedAndWithoutJustification);
  assert.equal(extractedEmpty.fallbackApplied, false, 'fallbackApplied deve ser false quando não houver fonte para derivar');
  assert.equal(extractedEmpty.count, 0, 'count deve ser 0 quando não houver NEED nem JUSTIFICATION');
}

/** Caso misto obrigatório: administrativeNeeds (array) + administrativeNeed (objeto único) simultâneos. */
function runMixedCaseNativeOriginChecks(): void {
  const payloadMixed: Record<string, unknown> = {
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Problema item 1 com descrição suficiente para validação.',
        administrativeNeed: 'Necessidade item 1.',
        expectedOutcome: 'Resultado esperado item 1.',
      },
      {
        targetType: 'item',
        targetId: 'i2',
        problemDescription: 'Problema item 2 com descrição suficiente para validação.',
        administrativeNeed: 'Necessidade item 2.',
        expectedOutcome: 'Resultado esperado item 2.',
      },
    ],
    administrativeNeed: {
      targetType: 'process',
      problemDescription: 'Problema em nível de processo com descrição suficiente.',
      administrativeNeed: 'Necessidade processo.',
      expectedOutcome: 'Resultado esperado processo.',
    },
  };

  const extracted = extractAdministrativeNeed(payloadMixed);
  assert.equal(extracted.count, 3, 'deve haver 3 entries (2 do array + 1 single)');
  assert.equal(extracted.nativeCount, 3, 'nativeCount deve ser 3');
  assert.equal(extracted.derivedFallbackCount, 0, 'derivedFallbackCount deve ser 0 no caso misto nativo');
  assert.equal(extracted.fallbackApplied, false, 'fallbackApplied deve ser false quando há NEED nativa');

  const fromArray0 = extracted.entries[0]!;
  const fromArray1 = extracted.entries[1]!;
  const fromSingle = extracted.entries[2]!;

  assert.equal(fromArray0.origin?.kind, 'NATIVE', 'entry 0 deve ser NATIVE');
  assert.equal(fromArray0.origin?.sourceField, 'administrativeNeeds', 'entry 0 deve vir de administrativeNeeds');
  assert.equal((fromArray0.origin as any)?.sourceIndex, 0, 'entry 0 deve ter sourceIndex 0');

  assert.equal(fromArray1.origin?.kind, 'NATIVE', 'entry 1 deve ser NATIVE');
  assert.equal(fromArray1.origin?.sourceField, 'administrativeNeeds', 'entry 1 deve vir de administrativeNeeds');
  assert.equal((fromArray1.origin as any)?.sourceIndex, 1, 'entry 1 deve ter sourceIndex 1');

  assert.equal(fromSingle.origin?.kind, 'NATIVE', 'entry 2 (single) deve ser NATIVE');
  assert.equal(fromSingle.origin?.sourceField, 'administrativeNeed', 'entry 2 deve vir de administrativeNeed (objeto único)');
  assert.equal(fromSingle.targetType, 'process', 'entry 2 deve ser a do processo (single)');

  const hasIncorrectOrigin = extracted.entries.some(
    (entry, idx) =>
      (idx < 2 && (entry.origin as any)?.sourceField !== 'administrativeNeeds') ||
      (idx === 2 && (entry.origin as any)?.sourceField !== 'administrativeNeed')
  );
  assert.equal(hasIncorrectOrigin, false, 'nenhuma entry deve ter origem incorreta');
}

function runProcurementStrategyCalibrationChecks(): void {
  const structure = extractProcurementStructure({
    items: [
      { id: 'i1', description: 'Item 1', quantity: 1, unit: 'un' },
      { id: 'i2', description: 'Item 2', quantity: 1, unit: 'un' },
    ],
  } as any);

  const items: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(
    structure,
    [
      {
        targetType: 'process',
        procurementModality: 'DISPENSA',
        competitionStrategy: 'DIRECT_SELECTION',
        divisionStrategy: 'MULTIPLE_ITEMS',
        contractingJustification: 'Justificativa com tamanho mínimo para não bloquear por ausência.',
      } as any,
    ],
    items
  );

  assert.ok(
    !items.some((i) => i.code === 'PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY'),
    'Estratégia process-level não deve gerar OBJECT_WITHOUT_STRATEGY para itens'
  );

  const itemsNoStrategy: ValidationItemContract[] = [];
  applyProcurementStrategyValidations(structure, [], itemsNoStrategy);
  assert.ok(
    itemsNoStrategy.some((i) => i.code === 'PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY'),
    'Sem estratégia alguma, deve bloquear OBJECT_WITHOUT_STRATEGY'
  );
}

export function runPhase36NucleusRegressionTests(): void {
  runNeedFallbackAuditabilityChecks();
  runMixedCaseNativeOriginChecks();
  runProcurementStrategyCalibrationChecks();
}

runPhase36NucleusRegressionTests();

