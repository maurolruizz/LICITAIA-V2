import { describe, it, expect } from 'vitest';
import { ModuleId } from '../../core/enums/module-id.enum';
import { executeAdministrativeDecisionTraceEngine } from './administrative-decision-trace.engine';

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

describe('Administrative Decision Trace Engine', () => {
  it('trace completo por item com evidências e steps', () => {
    const ids = ['i1'];
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(ids),
      calculationMemory: calcEntries(ids),
      administrativeNeed: needEntries(ids),
      administrativeJustification: justificationEntries(ids),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });

    const itemTrace = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1');
    expect(itemTrace).toBeDefined();
    expect(itemTrace!.isComplete).toBe(true);
    expect(itemTrace!.decisionSteps).toHaveLength(6);
    const elementIds = new Set(itemTrace!.supportingElements.map((e) => e.id));
    for (const step of itemTrace!.decisionSteps) {
      expect(Array.isArray(step.supportingElementIds) && step.supportingElementIds.length > 0).toBe(true);
      expect(step.sourceReference.length).toBeGreaterThan(0);
      for (const id of step.supportingElementIds) {
        expect(elementIds.has(id)).toBe(true);
      }
    }
    for (const el of itemTrace!.supportingElements) {
      expect(el.referenceId.length > 0 && el.sourceReference.length > 0).toBe(true);
    }
  });

  it('trace por processo com 6 steps', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1', 'i2']),
      calculationMemory: calcEntries(['i1', 'i2']),
      administrativeNeed: needEntries(['i1', 'i2']),
      administrativeJustification: justificationEntries(['i1', 'i2']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });

    const processTrace = traces.find((t) => t.targetType === 'process');
    expect(processTrace).toBeDefined();
    expect(processTrace!.decisionSteps.length).toBe(6);
  });

  it('múltiplos itens geram trace por item', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1', 'i2']),
      calculationMemory: calcEntries(['i1', 'i2']),
      administrativeNeed: needEntries(['i1', 'i2']),
      administrativeJustification: justificationEntries(['i1', 'i2']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const itemTraces = traces.filter((t) => t.targetType === 'item');
    expect(itemTraces.length).toBe(2);
  });

  it('ausência de justificativa marca isComplete=false', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: { entries: [] },
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    });
    const itemTrace = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1');
    expect(itemTrace).toBeDefined();
    expect(itemTrace!.isComplete).toBe(false);
  });

  it('documentConsistency com issues marca hasInconsistency nos traces', () => {
    const traces = executeAdministrativeDecisionTraceEngine({
      structure: structureMultipleItems(['i1']),
      calculationMemory: calcEntries(['i1']),
      administrativeNeed: needEntries(['i1']),
      administrativeJustification: justificationEntries(['i1']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: true, issueTypes: ['CALCULATION_NEED_MISMATCH'] },
    });
    expect(traces.every((t) => t.hasInconsistency === true)).toBe(true);
    expect(traces.every((t) => Array.isArray(t.inconsistencyReasons) && t.inconsistencyReasons!.length > 0)).toBe(true);
  });

  it('determinismo: mesma entrada gera mesmo trace', () => {
    const input = {
      structure: structureMultipleItems(['i1', 'i2']),
      calculationMemory: calcEntries(['i1', 'i2']),
      administrativeNeed: needEntries(['i1', 'i2']),
      administrativeJustification: justificationEntries(['i1', 'i2']),
      procurementStrategy: strategyProcess(),
      documentConsistency: { hasIssues: false, issueTypes: [] },
    };
    const a = executeAdministrativeDecisionTraceEngine(input);
    const b = executeAdministrativeDecisionTraceEngine(input);
    expect(a).toEqual(b);
  });

  it('trace por lote com steps e supportingElements', () => {
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

    const lotTrace = traces.find((t) => t.targetType === 'lot' && t.targetId === lotId);
    expect(lotTrace).toBeDefined();
    expect(lotTrace!.decisionSteps.length).toBe(6);
    const lotElementIds = new Set(lotTrace!.supportingElements.map((e) => e.id));
    for (const step of lotTrace!.decisionSteps) {
      expect(step.supportingElementIds.length).toBeGreaterThan(0);
      for (const id of step.supportingElementIds) {
        expect(lotElementIds.has(id)).toBe(true);
      }
    }
    const itemTracesFromLot = traces.filter((t) => t.targetType === 'item' && itemIds.includes(t.targetId));
    expect(itemTracesFromLot.length).toBe(2);
  });
});
