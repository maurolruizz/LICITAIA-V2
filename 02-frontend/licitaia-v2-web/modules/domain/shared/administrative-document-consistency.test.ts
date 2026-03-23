/**
 * Testes do Motor de Consistência Documental Administrativa.
 * Fase 28 — Cenários obrigatórios: Need vs Structure, Calculation vs Need, Strategy vs Structure,
 * Justification vs Strategy, e caso totalmente consistente.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { executeAdministrativeDocumentConsistencyEngine } from './administrative-document-consistency.engine';
import { applyAdministrativeDocumentConsistencyValidations } from './administrative-document-consistency.validator';
import { ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES } from './administrative-document-consistency.types';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ExtractedCalculationMemory } from './calculation-memory.types';
import type { ExtractedAdministrativeNeed } from './administrative-need.types';
import type { ExtractedAdministrativeJustification } from './administrative-justification.types';
import type { ExtractedProcurementStrategy } from './procurement-strategy.types';
import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { validateDfdInput } from '../dfd/dfd.validators';

function structureSingleItem(): ExtractedProcurementStructure {
  return {
    structureType: 'single_item',
    structure: { structureType: 'single_item' },
    lotCount: 0,
    itemCount: 0,
  };
}

function structureMultipleItems(ids: string[] = ['i1', 'i2']): ExtractedProcurementStructure {
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

function structureLot(lotId = 'l1', itemIds: string[] = ['i1']): ExtractedProcurementStructure {
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

function emptyCalculation(): ExtractedCalculationMemory {
  return {
    entries: [],
    count: 0,
    calculationTypes: [],
    calculationTargets: [],
    consumptionCount: 0,
    institutionalSizingCount: 0,
  };
}

function emptyNeed(): ExtractedAdministrativeNeed {
  return {
    entries: [],
    count: 0,
    processNeedCount: 0,
    itemNeedCount: 0,
    lotNeedCount: 0,
    needWithoutProblemCount: 0,
    needWithoutOutcomeCount: 0,
  };
}

function emptyJustification(): ExtractedAdministrativeJustification {
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

function emptyStrategy(): ExtractedProcurementStrategy {
  return {
    entries: [],
    count: 0,
    processStrategyCount: 0,
    itemStrategyCount: 0,
    lotStrategyCount: 0,
    strategyWithoutModalityCount: 0,
    strategyWithoutJustificationCount: 0,
  };
}

describe('AdministrativeDocumentConsistency', () => {
  it('Cenário 1: regra removida não dispara (NEED_STRUCTURE_MISMATCH coberto pela Fase 26)', async () => {
  const structure = structureMultipleItems(['i1']);
  const need: ExtractedAdministrativeNeed = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i99',
        problemDescription: 'Problema público com descrição suficiente para o item.',
        expectedOutcome: 'Resultado esperado com descrição suficiente.',
      },
    ],
    count: 1,
    processNeedCount: 0,
    itemNeedCount: 1,
    lotNeedCount: 0,
    needWithoutProblemCount: 0,
    needWithoutOutcomeCount: 0,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structure,
    emptyCalculation(),
    need,
    emptyJustification(),
    emptyStrategy()
  );
  assert.equal(result.hasIssues, false, 'regra NEED_STRUCTURE_MISMATCH removida; Fase 26 cobre necessidade→estrutura; motor não emite inconsistência aqui.');
  assert.equal(result.totalIssues, 0);
  });

  it('Cenário 2: inconsistência Calculation vs Need', async () => {
  const structure = structureMultipleItems(['i1']);
  const need: ExtractedAdministrativeNeed = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Aumento de demanda de usuários e histórico de consumo mensal.',
        expectedOutcome: 'Atendimento à demanda com base em consumo.',
      },
    ],
    count: 1,
    processNeedCount: 0,
    itemNeedCount: 1,
    lotNeedCount: 0,
    needWithoutProblemCount: 0,
    needWithoutOutcomeCount: 0,
  };
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'INSTITUTIONAL_SIZING',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'workstations', value: 10 }],
        formula: 'workstations',
        result: 10,
        justification: 'Dimensionamento por postos de trabalho.',
      },
    ],
    count: 1,
    calculationTypes: ['INSTITUTIONAL_SIZING'],
    calculationTargets: [{ targetType: 'ITEM', targetId: 'i1' }],
    consumptionCount: 0,
    institutionalSizingCount: 1,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structure,
    calculation,
    need,
    emptyJustification(),
    emptyStrategy()
  );
  assert.equal(result.hasIssues, true);
  assert.ok(
    result.issues.some((i) => i.issueType === ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.CALCULATION_NEED_MISMATCH),
    'deve existir CALCULATION_NEED_MISMATCH'
  );
  const blockIssues = result.issues.filter((i) => i.severity === 'BLOCK');
  assert.ok(blockIssues.length >= 1, 'severidade BLOCK aplicada corretamente a CALCULATION_NEED_MISMATCH');
  });

  it('Cenário 3: inconsistência Strategy vs Structure (single_item + LOTS)', async () => {
  const structure = structureSingleItem();
  const strategy: ExtractedProcurementStrategy = {
    entries: [
      {
        targetType: 'process',
        procurementModality: 'PREGAO',
        divisionStrategy: 'LOTS',
        contractingJustification: 'Justificativa com tamanho mínimo suficiente para a estratégia.',
      },
    ],
    count: 1,
    processStrategyCount: 1,
    itemStrategyCount: 0,
    lotStrategyCount: 0,
    strategyWithoutModalityCount: 0,
    strategyWithoutJustificationCount: 0,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structure,
    emptyCalculation(),
    emptyNeed(),
    emptyJustification(),
    strategy
  );
  assert.equal(result.hasIssues, true);
  assert.ok(
    result.issues.some((i) => i.issueType === ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.STRATEGY_STRUCTURE_MISMATCH),
    'deve existir STRATEGY_STRUCTURE_MISMATCH'
  );
  });

  it('Cenário 4: inconsistência Justification vs Strategy (DISPENSA sem base legal)', async () => {
  const strategy: ExtractedProcurementStrategy = {
    entries: [
      {
        targetType: 'process',
        procurementModality: 'DISPENSA',
        contractingJustification: 'Aquisição urgente para atendimento à demanda interna sem citação legal.',
      },
    ],
    count: 1,
    processStrategyCount: 1,
    itemStrategyCount: 0,
    lotStrategyCount: 0,
    strategyWithoutModalityCount: 0,
    strategyWithoutJustificationCount: 0,
  };
  const justification: ExtractedAdministrativeJustification = {
    entries: [
      {
        targetType: 'process',
        problemStatement: 'Necessidade de aquisição para demanda interna com texto longo suficiente para validação mínima.',
        administrativeNeed: 'Atendimento à demanda com texto longo suficiente para validação mínima.',
      },
    ],
    count: 1,
    processJustificationCount: 1,
    itemJustificationCount: 0,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structureMultipleItems(['i1']),
    emptyCalculation(),
    emptyNeed(),
    justification,
    strategy
  );
  assert.equal(result.hasIssues, true);
  assert.ok(
    result.issues.some((i) => i.issueType === ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.JUSTIFICATION_STRATEGY_MISMATCH),
    'deve existir JUSTIFICATION_STRATEGY_MISMATCH'
  );
  const warningIssues = result.issues.filter((i) => i.severity === 'WARNING');
  assert.ok(warningIssues.length >= 1, 'severidade WARNING aplicada corretamente a JUSTIFICATION_STRATEGY_MISMATCH');
  });

  it('Cenário 5: caso totalmente consistente', async () => {
  const structure = structureMultipleItems(['i1']);
  const need: ExtractedAdministrativeNeed = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        problemDescription: 'Dimensionamento institucional por postos de trabalho e estrutura existente.',
        expectedOutcome: 'Cobertura dos postos com quantidade adequada.',
      },
    ],
    count: 1,
    processNeedCount: 0,
    itemNeedCount: 1,
    lotNeedCount: 0,
    needWithoutProblemCount: 0,
    needWithoutOutcomeCount: 0,
  };
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'INSTITUTIONAL_SIZING',
        targetType: 'ITEM',
        targetId: 'i1',
        parameters: [{ name: 'workstations', value: 5 }],
        formula: 'workstations',
        result: 5,
        justification: 'Dimensionamento por postos de trabalho.',
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
        administrativeNeed: 'Atendimento ao dimensionamento com base em postos e estrutura.',
        problemStatement: 'Necessidade de aquisição com justificativa alinhada à dispensa nos termos do art. 75 da Lei 14.133/2021.',
      },
    ],
    count: 1,
    processJustificationCount: 0,
    itemJustificationCount: 1,
    lotJustificationCount: 0,
    withLegalBasisCount: 0,
    missingCriticalFieldsCount: 0,
  };
  const strategy: ExtractedProcurementStrategy = {
    entries: [
      {
        targetType: 'item',
        targetId: 'i1',
        procurementModality: 'PREGAO',
        divisionStrategy: 'SINGLE_CONTRACT',
        contractingJustification: 'Justificativa com tamanho mínimo suficiente.',
      },
    ],
    count: 1,
    processStrategyCount: 0,
    itemStrategyCount: 1,
    lotStrategyCount: 0,
    strategyWithoutModalityCount: 0,
    strategyWithoutJustificationCount: 0,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structure,
    calculation,
    need,
    justification,
    strategy
  );
  assert.equal(result.hasIssues, false);
  assert.equal(result.totalIssues, 0);
  assert.equal(result.issues.length, 0);

  const items: ValidationItemContract[] = [];
  applyAdministrativeDocumentConsistencyValidations(result, items);
  assert.equal(items.length, 0);
  });

  it('Cenário 6: duplicação com validação anterior (Fase 26 emite NEED_TARGET_NOT_FOUND)', async () => {
  const payload: Record<string, unknown> = {
    demandDescription: 'Demanda de teste com texto suficiente.',
    hiringJustification: 'Justificativa com texto suficiente para validação.',
    administrativeObjective: 'Objetivo administrativo com texto suficiente.',
    requestingDepartment: 'Departamento X',
    requesterName: 'Nome do Responsável',
    requestDate: '2025-01-15',
    items: [{ id: 'i1', description: 'Item 1' }],
    administrativeNeeds: [
      {
        targetType: 'item',
        targetId: 'i99',
        problemDescription: 'Problema público com descrição suficiente para o item.',
        expectedOutcome: 'Resultado esperado com descrição suficiente.',
      },
    ],
  };
  const validation = validateDfdInput(payload);
  const needTargetNotFound = validation.items.some((i) => i.code === 'ADMINISTRATIVE_NEED_TARGET_NOT_FOUND');
  const docConsistencyNeedStructure = validation.items.some((i) => i.code === 'ADMIN_DOCUMENT_CONSISTENCY_NEED_STRUCTURE_MISMATCH');
  assert.ok(needTargetNotFound, 'validação anterior (Fase 26) deve emitir ADMINISTRATIVE_NEED_TARGET_NOT_FOUND.');
  assert.equal(docConsistencyNeedStructure, false, 'Fase 28 não deve emitir NEED_STRUCTURE_MISMATCH (regra removida).');
  });

  it('Cenário 7: múltiplas inconsistências no mesmo run', async () => {
  const structure = structureSingleItem();
  const need: ExtractedAdministrativeNeed = {
    entries: [
      {
        targetType: 'item',
        targetId: 'item1',
        problemDescription: 'Aumento de demanda e histórico de consumo mensal.',
        expectedOutcome: 'Atendimento à demanda.',
      },
    ],
    count: 1,
    processNeedCount: 0,
    itemNeedCount: 1,
    lotNeedCount: 0,
    needWithoutProblemCount: 0,
    needWithoutOutcomeCount: 0,
  };
  const calculation: ExtractedCalculationMemory = {
    entries: [
      {
        calculationType: 'INSTITUTIONAL_SIZING',
        targetType: 'ITEM',
        targetId: 'item1',
        parameters: [{ name: 'workstations', value: 5 }],
        formula: 'workstations',
        result: 5,
        justification: 'Dimensionamento por postos.',
      },
    ],
    count: 1,
    calculationTypes: ['INSTITUTIONAL_SIZING'],
    calculationTargets: [{ targetType: 'ITEM', targetId: 'item1' }],
    consumptionCount: 0,
    institutionalSizingCount: 1,
  };
  const strategy: ExtractedProcurementStrategy = {
    entries: [
      {
        targetType: 'process',
        procurementModality: 'PREGAO',
        divisionStrategy: 'LOTS',
        contractingJustification: 'Justificativa com tamanho mínimo.',
      },
    ],
    count: 1,
    processStrategyCount: 1,
    itemStrategyCount: 0,
    lotStrategyCount: 0,
    strategyWithoutModalityCount: 0,
    strategyWithoutJustificationCount: 0,
  };
  const result = executeAdministrativeDocumentConsistencyEngine(
    structure,
    calculation,
    need,
    emptyJustification(),
    strategy
  );
  assert.ok(result.totalIssues >= 2, 'deve haver pelo menos duas inconsistências (CALCULATION_NEED_MISMATCH e STRATEGY_STRUCTURE_MISMATCH).');
  assert.ok(result.issues.some((i) => i.issueType === ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.CALCULATION_NEED_MISMATCH));
  assert.ok(result.issues.some((i) => i.issueType === ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.STRATEGY_STRUCTURE_MISMATCH));
  });
});
