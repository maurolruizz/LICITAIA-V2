/**
 * Fase 31 — Motor de Consolidação de Documentos Administrativos.
 * Testes em Vitest (describe/it). Documento ancorado no trace.
 */

import { describe, it, expect } from 'vitest';
import { ModuleId } from '../../core/enums/module-id.enum';
import { executeAdministrativeDecisionTraceEngine } from './administrative-decision-trace.engine';
import { executeAdministrativeDecisionExplanationEngine } from './administrative-decision-explanation.engine';
import { executeAdministrativeDocumentEngine } from './administrative-document.engine';
import type { DocumentSectionType } from './administrative-document.types';
import { DOCUMENT_STRUCTURE_RULES } from './administrative-document-structure';

const SECTION_TYPES: DocumentSectionType[] = [
  'IDENTIFICATION',
  'NEED',
  'STRUCTURE',
  'CALCULATION',
  'JUSTIFICATION',
  'STRATEGY',
  'COHERENCE',
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
      justification: 'Justificativa de cálculo.',
    })),
  };
}

function needEntries(ids: string[]) {
  return {
    entries: ids.map((id) => ({
      targetType: 'item',
      targetId: id,
      problemDescription: 'Problema público.',
      administrativeNeed: 'Necessidade administrativa.',
      expectedOutcome: 'Resultado esperado.',
    })),
  };
}

function justificationEntries(ids: string[]) {
  return {
    entries: ids.map((id) => ({
      targetType: 'item',
      targetId: id,
      problemStatement: 'Justificativa com conteúdo.',
      administrativeNeed: 'Necessidade.',
      expectedOutcome: 'Resultado.',
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
        contractingJustification: 'Justificativa de estratégia.',
      },
    ],
  };
}

describe('Administrative Document Engine', () => {
  describe('documento por target', () => {
    it('gera documento por item quando existe trace do item', () => {
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
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const docItem = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1');
      expect(docItem).toBeDefined();
      expect(docItem!.targetType).toBe('item');
      expect(docItem!.targetId).toBe('i1');
      expect(docItem!.documentId).toMatch(/^DOC:/);
      expect(docItem!.moduleId).toBe(ModuleId.DFD);
    });

    it('gera documento por lote quando existe trace do lote', () => {
      const lotId = 'l1';
      const itemIds = ['i1', 'i2'];
      const structureLot = {
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
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureLot,
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
              problemDescription: 'Problema.',
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
            { targetType: 'process' as const, procurementModality: 'PREGAO', divisionStrategy: 'LOTS', contractingJustification: 'Estratégia.' },
          ],
        },
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const docLot = documents.find((d) => d.targetType === 'lot' && d.targetId === lotId);
      expect(docLot).toBeDefined();
      expect(docLot!.targetType).toBe('lot');
      expect(docLot!.targetId).toBe(lotId);
      expect(docLot!.documentId).toBe(`DOC:${ModuleId.DFD}:lot:${lotId}`);
    });

    it('gera documento por processo quando existe trace do processo', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1', 'i2']),
        calculationMemory: calcEntries(['i1', 'i2']),
        administrativeNeed: needEntries(['i1', 'i2']),
        administrativeJustification: justificationEntries(['i1', 'i2']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const docProcess = documents.find((d) => d.targetType === 'process');
      expect(docProcess).toBeDefined();
      expect(docProcess!.targetType).toBe('process');
      expect(docProcess!.targetId).toBe('process');
      expect(docProcess!.documentId).toBe(`DOC:${ModuleId.DFD}:process:process`);
    });
  });

  describe('7 seções obrigatórias', () => {
    it('documento possui exatamente 7 seções na ordem correta', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;
      expect(doc.sections).toHaveLength(7);
      const sectionTypes = doc.sections.map((s) => s.sectionType);
      for (const st of SECTION_TYPES) {
        expect(sectionTypes).toContain(st);
      }
      expect(doc.sections.map((s) => s.sectionType)).toEqual(SECTION_TYPES);
    });

    it('possui 7 seções mesmo sem NEED / JUSTIFICATION / CALCULATION (conteúdo vazio quando sem explanation)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: { entries: [] },
        administrativeNeed: { entries: [] },
        administrativeJustification: { entries: [] },
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations: ReturnType<typeof executeAdministrativeDecisionExplanationEngine> = [];
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      expect(documents.length).toBeGreaterThan(0);
      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1') ?? documents[0]!;
      expect(doc.sections).toHaveLength(7);
      expect(doc.sections.map((s) => s.sectionType)).toEqual(SECTION_TYPES);
      const identification = doc.sections.find((s) => s.sectionType === 'IDENTIFICATION')!;
      expect(identification.content).toBeTruthy();
      const contentSections = doc.sections.filter((s) => s.sectionType !== 'IDENTIFICATION');
      for (const sec of contentSections) {
        if (sec.sectionType !== 'COHERENCE') {
          expect(sec.content).toBe('');
        }
        expect(sec.supportingReferences).toEqual([]);
      }
    });

    it('possui 7 seções mesmo com payload mínimo (structure apenas, need/justification/calculation vazios)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: { entries: [] },
        administrativeNeed: { entries: [] },
        administrativeJustification: { entries: [] },
        procurementStrategy: { entries: [] },
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;
      expect(doc.sections).toHaveLength(7);
      for (const st of SECTION_TYPES) {
        const section = doc.sections.find((s) => s.sectionType === st);
        expect(section).toBeDefined();
        expect(section!.title.length).toBeGreaterThan(0);
        expect(section!.blockId.length).toBeGreaterThan(0);
      }
    });
  });

  describe('vínculo trace ↔ document', () => {
    it('para cada document existe trace correspondente (mesmo targetType + targetId) e moduleId do document = moduleId do trace', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1', 'i2']),
        calculationMemory: calcEntries(['i1', 'i2']),
        administrativeNeed: needEntries(['i1', 'i2']),
        administrativeJustification: justificationEntries(['i1', 'i2']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      for (const doc of documents) {
        const trace = traces.find((t) => t.targetType === doc.targetType && t.targetId === doc.targetId);
        expect(trace, `deve existir trace para document ${doc.documentId}`).toBeDefined();
        expect(doc.moduleId).toBe(trace!.moduleId);
        expect(doc.targetType).toBe(trace!.targetType);
        expect(doc.targetId).toBe(trace!.targetId);
      }
    });

    it('explanation usada pertence ao mesmo target do document (e do trace)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      for (const doc of documents) {
        const exp = explanations.find((e) => e.targetType === doc.targetType && e.targetId === doc.targetId);
        expect(doc.targetType).toBe(exp?.targetType ?? doc.targetType);
        expect(doc.targetId).toBe(exp?.targetId ?? doc.targetId);
      }
    });

    it('sem trace para um target não gera document (documento ancorado no trace)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documentsWithTraces = executeAdministrativeDocumentEngine(traces, explanations);
      const documentsSemTraces = executeAdministrativeDocumentEngine([], explanations);

      expect(documentsSemTraces).toHaveLength(0);
      expect(documentsWithTraces.length).toBeGreaterThan(0);
    });
  });

  describe('integridade e conteúdo', () => {
    it('supportingReferences das seções = do explanation block quando explanation existe', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);
      const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1')!;
      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;

      const contentSections = doc.sections.filter((s) => s.sectionType !== 'IDENTIFICATION');
      for (const section of contentSections) {
        const block = itemExp.explanationBlocks.find((b) => b.blockType === section.sectionType);
        if (block) {
          expect([...section.supportingReferences].sort()).toEqual([...block.supportingReferences].sort());
        }
        expect(section.sourcePaths.length).toBeGreaterThan(0);
        expect(section.sourceOfTruth.length).toBeGreaterThan(0);
      }
    });

    it('conteúdo das seções vem do explanation (IDENTIFICATION determinística do trace)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);
      const itemExp = explanations.find((e) => e.targetType === 'item' && e.targetId === 'i1')!;
      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;

      const idSection = doc.sections.find((s) => s.sectionType === 'IDENTIFICATION')!;
      expect(idSection.content).toContain('DFD');
      expect(idSection.content).toContain('item');
      expect(idSection.content).toContain('i1');

      const contentSections = doc.sections.filter((s) => s.sectionType !== 'IDENTIFICATION');
      for (const section of contentSections) {
        const block = itemExp.explanationBlocks.find((b) => b.blockType === section.sectionType);
        if (block && section.sectionType !== 'COHERENCE') {
          expect(section.content).toBe(block.description.trim());
        }
      }
    });
  });

  describe('determinismo', () => {
    it('mesma entrada produz mesmo documento e generatedAt estável', () => {
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
      const documentsA = executeAdministrativeDocumentEngine(tracesA, explanationsA);
      const documentsB = executeAdministrativeDocumentEngine(tracesB, explanationsB);

      expect(documentsA).toEqual(documentsB);
      const expectedGeneratedAt = new Date(0).toISOString();
      for (const doc of documentsA) {
        expect(doc.generatedAt).toBe(expectedGeneratedAt);
      }
    });
  });

  describe('herança de flags do trace', () => {
    it('hasInconsistency e hasIncomplete vêm do trace', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: true, issueTypes: ['CALCULATION_NEED_MISMATCH'] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const docComInconsistencia = documents.find((d) => d.hasInconsistency);
      expect(docComInconsistencia).toBeDefined();
      const traceCorrespondente = traces.find((t) => t.targetType === docComInconsistencia!.targetType && t.targetId === docComInconsistencia!.targetId);
      expect(traceCorrespondente!.hasInconsistency).toBe(true);
      expect(docComInconsistencia!.hasInconsistency).toBe(true);
    });

    it('hasIncomplete reflete isComplete do trace', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: { entries: [] },
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      const docItem = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1');
      expect(docItem).toBeDefined();
      expect(docItem!.hasIncomplete).toBe(true);
      const traceItem = traces.find((t) => t.targetType === 'item' && t.targetId === 'i1');
      expect(traceItem!.isComplete).toBe(false);
    });
  });

  describe('correspondência document ↔ explanation', () => {
    it('um document por trace; flags alinhadas ao trace (explanation derivada do trace)', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: calcEntries(['i1']),
        administrativeNeed: needEntries(['i1']),
        administrativeJustification: justificationEntries(['i1']),
        procurementStrategy: strategyProcess(),
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const explanations = executeAdministrativeDecisionExplanationEngine(traces);
      const documents = executeAdministrativeDocumentEngine(traces, explanations);

      expect(documents.length).toBe(traces.length);
      for (const doc of documents) {
        const exp = explanations.find((e) => e.targetType === doc.targetType && e.targetId === doc.targetId);
        expect(exp).toBeDefined();
        expect(doc.hasInconsistency).toBe(exp!.hasInconsistency);
        expect(doc.hasIncomplete).toBe(exp!.hasIncomplete);
        expect(doc.generatedAt).toBe(new Date(0).toISOString());
      }
    });
  });

  describe('ETAPA B — regras estruturais explícitas', () => {
    it('bloco obrigatório: DFD IDENTIFICATION permanece required', () => {
      const rule = DOCUMENT_STRUCTURE_RULES.DFD.IDENTIFICATION;
      const applicability = rule.getApplicability({
        legalRegime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        targetType: 'process',
        hasCalculationData: false,
        hasPricingData: false,
      });
      expect(applicability).toBe('required');
    });

    it('bloco condicional: DFD CALCULATION fica required quando há memória de cálculo', () => {
      const rule = DOCUMENT_STRUCTURE_RULES.DFD.CALCULATION;
      const applicability = rule.getApplicability({
        legalRegime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        targetType: 'item',
        hasCalculationData: true,
        hasPricingData: false,
      });
      expect(applicability).toBe('required');
    });

    it('bloco proibido: DFD CALCULATION fica prohibited em entrega única sem memória de cálculo', () => {
      const rule = DOCUMENT_STRUCTURE_RULES.DFD.CALCULATION;
      const applicability = rule.getApplicability({
        legalRegime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        targetType: 'item',
        hasCalculationData: false,
        hasPricingData: false,
      });
      expect(applicability).toBe('prohibited');
    });

    it('derivação via processSnapshot: seção NEED usa snapshot quando explanation não existe', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: { entries: [] },
        administrativeNeed: { entries: [] },
        administrativeJustification: { entries: [] },
        procurementStrategy: { entries: [] },
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });
      const documents = executeAdministrativeDocumentEngine(traces, [], {
        legalRegime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_PARCELADA',
        demandDescription: 'Demanda derivada do snapshot para teste.',
        administrativeObjective: 'Objetivo do snapshot para teste.',
      });

      const doc = documents.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;
      const need = doc.sections.find((s) => s.sectionType === 'NEED')!;
      expect(need.content).toContain('demandDescription=');
      expect(need.content).toContain('administrativeObjective=');
    });

    it('proibição de payload bruto downstream: sem snapshot não há preenchimento de fallback', () => {
      const traces = executeAdministrativeDecisionTraceEngine({
        structure: structureMultipleItems(['i1']),
        calculationMemory: { entries: [] },
        administrativeNeed: { entries: [] },
        administrativeJustification: { entries: [] },
        procurementStrategy: { entries: [] },
        documentConsistency: { hasIssues: false, issueTypes: [] },
      });

      const docsSemSnapshot = executeAdministrativeDocumentEngine(traces, []);
      const doc = docsSemSnapshot.find((d) => d.targetType === 'item' && d.targetId === 'i1')!;
      const need = doc.sections.find((s) => s.sectionType === 'NEED')!;
      expect(need.content).toBe('');
    });

    it('coerência DFD↔ETP↔TR↔PRICING está materializada nas regras de bloco', () => {
      expect(DOCUMENT_STRUCTURE_RULES.DFD.COHERENCE.coherenceChecks).toContain(
        'TRACE_EXPLANATION_DOCUMENT_ALIGNMENT'
      );
      expect(DOCUMENT_STRUCTURE_RULES.ETP.COHERENCE.coherenceChecks).toContain(
        'DFD_ETP_TR_COHERENCE'
      );
      expect(DOCUMENT_STRUCTURE_RULES.TR.CALCULATION.coherenceChecks).toContain(
        'TR_PRICING_ALIGNMENT'
      );
    });
  });
});
