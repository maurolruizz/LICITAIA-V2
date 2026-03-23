/**
 * Fase 30 — Motor de Explicabilidade Consolidada da Decisão Administrativa.
 * Testes em Vitest (describe/it).
 */

import { describe, it, expect } from 'vitest';
import { ModuleId } from '../../core/enums/module-id.enum';
import { executeAdministrativeDecisionTraceEngine } from './administrative-decision-trace.engine';
import { executeAdministrativeDecisionExplanationEngine } from './administrative-decision-explanation.engine';
import type { ExplanationBlockType } from './administrative-decision-explanation.types';

const BLOCK_TYPES: ExplanationBlockType[] = [
  'NEED',
  'STRUCTURE',
  'CALCULATION',
  'JUSTIFICATION',
  'COHERENCE',
  'STRATEGY',
];

function structureMultipleItems(ids: string[] = ['i1', 'i2']) {
  return {
    moduleId: ModuleId.DFD,
    structureType: 'multiple_items',
    structure: {
      structureType: 'multiple_items',
      items: ids.map((id, i) => ({ id, description: `Item ${i + 1}` })),
    },
    lotCount: 0,
    itemCount: ids.length,
  };
}

function calcEntries(ids: string[]) {
  return {
    entries: ids.map((id, i) => ({
      calculationType: 'CONSUMPTION',
      targetType: 'ITEM',
      targetId: id,
      result: i + 1,
      formula: 'result',
      justification: 'Justificativa de cálculo com conteúdo.',
    })),
  };
}

function needEntries(ids: string[]) {
  return {
    entries: ids.map((id) => ({
      targetType: 'item',
      targetId: id,
      problemDescription: 'Problema público com descrição suficiente.',
      administrativeNeed: 'Necessidade administrativa com conteúdo.',
      expectedOutcome: 'Resultado esperado com conteúdo.',
    })),
  };
}

function justificationEntries(ids: string[]) {
  return {
    entries: ids.map((id) => ({
      targetType: 'item',
      targetId: id,
      problemStatement: 'Justificativa com conteúdo suficiente.',
      administrativeNeed: 'Necessidade administrativa reiterada.',
      expectedOutcome: 'Resultado esperado.',
      legalBasis: 'Base legal.',
    })),
  };
}

function strategyProcess() {
  return {
    entries: [
      {
        targetType: 'process',
        procurementModality: 'PREGAO',
        divisionStrategy: 'SINGLE_CONTRACT',
        contractingJustification: 'Justificativa de estratégia com conteúdo suficiente.',
      },
    ],
  };
}

function structureLot(lotId: string, itemIds: string[]) {
  return {
    moduleId: ModuleId.DFD,
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

describe('Administrative Decision Explanation Engine', () => {
  it('explicação por item com 6 blocos e supportingReferences', () => {
    const ids = ['i1'];
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(ids),
      calculationMemory: calcEntries(ids),
      administrativeNeed: needEntries(ids),
      administrativeJustification: justificationEntries(ids),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1');
    expect(itemExp).toBeDefined();
    expect(itemExp!.targetType).toBe('item');
    expect(itemExp!.targetId).toBe('i1');
    expect(itemExp!.explanationId).toMatch(/^EXPLAIN:/);
    expect(itemExp!.explanationBlocks.length).toBe(6);
    const blockTypes = itemExp!.explanationBlocks.map((b) => b.blockType);
    for (const bt of BLOCK_TYPES) {
      expect(blockTypes).toContain(bt);
    }
    for (const block of itemExp!.explanationBlocks) {
      expect(typeof block.title === 'string' && block.title.length > 0).toBe(true);
      expect(typeof block.description === 'string').toBe(true);
      expect(Array.isArray(block.supportingReferences)).toBe(true);
    }
  });

  it('explicação por processo com 6 blocos', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1', 'i2']),
      calculationMemory: calcEntries(['i1', 'i2']),
      administrativeNeed: needEntries(['i1', 'i2']),
      administrativeJustification: justificationEntries(['i1', 'i2']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    const processExp = explanations.find((e) => e.targetType === 'process');
    expect(processExp).toBeDefined();
    expect(processExp!.targetType).toBe('process');
    expect(processExp!.targetId).toBe('process');
    expect(processExp!.explanationBlocks.length).toBe(6);
  });

  it('explicação por lote com 6 blocos', () => {
    const lotId = 'l1';
    const itemIds = ['i1', 'i2'];
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureLot(lotId, itemIds),
      calculationMemory: {
        entries: [
          ...itemIds.map((id, i) => ({
            calculationType: 'CONSUMPTION' as const,
            targetType: 'ITEM' as const,
            targetId: id,
            result: i + 1,
            formula: 'result',
            justification: 'Justificativa.',
          })),
          {
            calculationType: 'CONSUMPTION' as const,
            targetType: 'LOT' as const,
            targetId: lotId,
            result: 2,
            formula: 'sum',
            justification: 'Justificativa lote.',
          },
        ],
      },
      administrativeNeed: {
        entries: [
          ...itemIds.map((id) => ({
            targetType: 'item' as const,
            targetId: id,
            problemDescription: 'Problema com conteúdo.',
            expectedOutcome: 'Resultado.',
          })),
          { targetType: 'lot' as const, targetId: lotId, problemDescription: 'Necessidade do lote.', expectedOutcome: 'Resultado.' },
        ],
      },
      administrativeJustification: {
        entries: [
          ...itemIds.map((id) => ({
            targetType: 'item' as const,
            targetId: id,
            problemStatement: 'Justificativa item.',
            expectedOutcome: 'Resultado.',
          })),
          { targetType: 'lot' as const, targetId: lotId, problemStatement: 'Justificativa lote.', expectedOutcome: 'Resultado.' },
        ],
      },
      procurementStrategy: {
        entries: [
          { targetType: 'process' as const, procurementModality: 'PREGAO', divisionStrategy: 'LOTS', contractingJustification: 'Estratégia com conteúdo.' },
        ],
      },
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    const lotExp = explanations.find((e) => e.targetType === 'lot' && e.targetId === lotId);
    expect(lotExp).toBeDefined();
    expect(lotExp!.targetType).toBe('lot');
    expect(lotExp!.targetId).toBe(lotId);
    expect(lotExp!.explanationBlocks.length).toBe(6);
  });

  it('integridade explicação lote: supportingReferences em trace.supportingElements', () => {
    const lotId = 'l1';
    const itemIds = ['i1', 'i2'];
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureLot(lotId, itemIds),
      calculationMemory: {
        entries: [
          ...itemIds.map((id, i) => ({
            calculationType: 'CONSUMPTION' as const,
            targetType: 'ITEM' as const,
            targetId: id,
            result: i + 1,
            formula: 'result',
            justification: 'Justificativa.',
          })),
          {
            calculationType: 'CONSUMPTION' as const,
            targetType: 'LOT' as const,
            targetId: lotId,
            result: 2,
            formula: 'sum',
            justification: 'Justificativa lote.',
          },
        ],
      },
      administrativeNeed: {
        entries: [
          ...itemIds.map((id) => ({
            targetType: 'item' as const,
            targetId: id,
            problemDescription: 'Problema com conteúdo.',
            expectedOutcome: 'Resultado.',
          })),
          { targetType: 'lot' as const, targetId: lotId, problemDescription: 'Necessidade do lote.', expectedOutcome: 'Resultado.' },
        ],
      },
      administrativeJustification: {
        entries: [
          ...itemIds.map((id) => ({
            targetType: 'item' as const,
            targetId: id,
            problemStatement: 'Justificativa item.',
            expectedOutcome: 'Resultado.',
          })),
          { targetType: 'lot' as const, targetId: lotId, problemStatement: 'Justificativa lote.', expectedOutcome: 'Resultado.' },
        ],
      },
      procurementStrategy: {
        entries: [
          { targetType: 'process' as const, procurementModality: 'PREGAO', divisionStrategy: 'LOTS', contractingJustification: 'Estratégia com conteúdo.' },
        ],
      },
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    const lotTrace = traces.find((t) => t.targetType === 'lot' && t.targetId === lotId);
    const lotExp = explanations.find((e) => e.targetType === 'lot' && e.targetId === lotId);
    expect(lotExp).toBeDefined();
    expect(lotExp!.explanationBlocks.length).toBe(6);
    expect(lotTrace).toBeDefined();
    const lotElementIds = new Set(lotTrace!.supportingElements.map((e) => e.id));

    for (let i = 0; i < lotExp!.explanationBlocks.length; i++) {
      const block = lotExp!.explanationBlocks[i]!;
      const step = lotTrace!.decisionSteps[i]!;
      expect(block.supportingReferences.length).toBeGreaterThan(0);
      for (const ref of block.supportingReferences) {
        expect(lotElementIds.has(ref)).toBe(true);
      }
      expect(block.blockType).toBe(step.stepType);
      expect([...block.supportingReferences].sort()).toEqual([...step.supportingElementIds].sort());
    }
  });

  it('hasInconsistency herdado do trace', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: true, issueTypes: ['CALCULATION_NEED_MISMATCH'] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    expect(explanations.length).toBeGreaterThan(0);
    expect(explanations.some((e) => e.hasInconsistency === true)).toBe(true);
    for (const e of explanations.filter((x) => x.hasInconsistency)) {
      expect(e.hasInconsistency).toBe(true);
    }
  });

  it('hasIncomplete quando trace isComplete=false', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: { entries: [] },
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);

    const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1');
    expect(itemExp).toBeDefined();
    expect(itemExp!.hasIncomplete).toBe(true);
  });

  it('determinismo: mesma entrada gera mesma explicação', () => {
    const input = {
      structure: structureMultipleItems(['i1', 'i2']),
      calculationMemory: calcEntries(['i1', 'i2']),
      administrativeNeed: needEntries(['i1', 'i2']),
      administrativeJustification: justificationEntries(['i1', 'i2']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    };
    const tracesA = executeAdministrativeDecisionTraceEngine(input);
    const tracesB = executeAdministrativeDecisionTraceEngine(input);
    const explanationsA = executeAdministrativeDecisionExplanationEngine(tracesA);
    const explanationsB = executeAdministrativeDecisionExplanationEngine(tracesB);
    expect(explanationsA).toEqual(explanationsB);
  });

  it('supportingReferences existem em trace.supportingElements', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);
    const itemTrace = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1')!;
    const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1')!;
    const elementIds = new Set(itemTrace.supportingElements.map((e) => e.id));

    for (const block of itemExp.explanationBlocks) {
      for (const ref of block.supportingReferences) {
        expect(elementIds.has(ref)).toBe(true);
      }
    }
  });

  it('blocos correspondem aos steps e supportingReferences = supportingElementIds', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);
    const itemTrace = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1')!;
    const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1')!;

    expect(itemExp.explanationBlocks.length).toBe(itemTrace.decisionSteps.length);
    for (let i = 0; i < itemTrace.decisionSteps.length; i++) {
      const step = itemTrace.decisionSteps[i]!;
      const block = itemExp.explanationBlocks[i]!;
      expect(block.blockType).toBe(step.stepType);
      expect(
        block.description.includes(step.description) || step.description.includes(block.title)
      ).toBe(true);
      expect([...block.supportingReferences].sort()).toEqual([...step.supportingElementIds].sort());
    }
  });

  it('description do bloco deriva do step (não inventado)', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);
    const itemTrace = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1')!;
    const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1')!;

    for (const block of itemExp.explanationBlocks) {
      expect(typeof block.description === 'string').toBe(true);
      const fromStep = itemTrace.decisionSteps.find((s) => s.stepType === block.blockType);
      expect(fromStep).toBeDefined();
      expect(block.description.indexOf(fromStep!.description) >= 0).toBe(true);
    }
    expect(itemExp.summary.length).toBeGreaterThan(0);
  });

  it('generatedAt estável (epoch)', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const explanations = executeAdministrativeDecisionExplanationEngine(traces);
    const expected = new Date(0).toISOString();
    for (const e of explanations) {
      expect(e.generatedAt).toBe(expected);
    }
  });
});
