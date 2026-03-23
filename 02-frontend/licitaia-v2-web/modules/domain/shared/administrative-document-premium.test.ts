import { describe, expect, it } from 'vitest';
import { ModuleId } from '../../core/enums/module-id.enum';
import type { AdministrativeDocumentModel } from './administrative-document.types';
import { executeAdministrativeDocumentPremiumEngine } from './administrative-document-premium.engine';

function buildDocument(
  moduleId: ModuleId,
  blockPrefix: 'DFD' | 'ETP' | 'TR',
  targetId: string,
  calcApplicability: 'required' | 'conditional' | 'prohibited' | 'not_applicable' = 'required'
): AdministrativeDocumentModel {
  return {
    documentId: `DOC:${moduleId}:process:${targetId}`,
    moduleId,
    targetType: 'process',
    targetId,
    hasInconsistency: false,
    hasIncomplete: false,
    generatedAt: new Date(0).toISOString(),
    sections: [
      {
        sectionType: 'IDENTIFICATION',
        blockId: `${blockPrefix}_IDENTIFICACAO`,
        title: `${blockPrefix}_IDENTIFICACAO`,
        content: 'identificacao oficial',
        supportingReferences: [],
        sourceOfTruth: ['PROCESS_SNAPSHOT'],
        sourcePaths: ['requestingDepartment'],
        coherenceChecks: ['DFD_ETP_CLASSIFICATION_ALIGNMENT'],
        applicability: 'required',
      },
      {
        sectionType: 'NEED',
        blockId: `${blockPrefix}_NEED`,
        title: `${blockPrefix}_NEED`,
        content: 'necessidade formalizada',
        supportingReferences: [],
        sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
        sourcePaths: ['demandDescription'],
        coherenceChecks: ['DFD_ETP_NEED_ALIGNMENT', 'ETP_TR_OBJECT_ALIGNMENT'],
        applicability: 'required',
      },
      {
        sectionType: 'STRUCTURE',
        blockId: `${blockPrefix}_STRUCTURE`,
        title: `${blockPrefix}_STRUCTURE`,
        content: 'estrutura do objeto',
        supportingReferences: [],
        sourceOfTruth: ['PROCESS_SNAPSHOT', 'DERIVED'],
        sourcePaths: ['objectStructure'],
        coherenceChecks: ['STRUCTURE_CLASSIFICATION_CONSISTENCY'],
        applicability: 'required',
      },
      {
        sectionType: 'CALCULATION',
        blockId: `${blockPrefix}_CALCULATION`,
        title: `${blockPrefix}_CALCULATION`,
        content: 'calculo referencial talvez com memoria',
        supportingReferences: [],
        sourceOfTruth: ['CALCULATION_MEMORY'],
        sourcePaths: ['calculationMemory'],
        coherenceChecks: ['TR_PRICING_ALIGNMENT'],
        applicability: calcApplicability,
      },
      {
        sectionType: 'JUSTIFICATION',
        blockId: `${blockPrefix}_JUSTIFICATION`,
        title: `${blockPrefix}_JUSTIFICATION`,
        content: 'justificativa tecnica formal',
        supportingReferences: [],
        sourceOfTruth: ['PROCESS_SNAPSHOT'],
        sourcePaths: ['technicalJustification'],
        coherenceChecks: ['JUSTIFICATION_NEED_CONSISTENCY'],
        applicability: 'required',
      },
      {
        sectionType: 'STRATEGY',
        blockId: `${blockPrefix}_STRATEGY`,
        title: `${blockPrefix}_STRATEGY`,
        content: 'estrategia de contratacao',
        supportingReferences: [],
        sourceOfTruth: ['PROCESS_SNAPSHOT'],
        sourcePaths: ['procurementStrategy'],
        coherenceChecks: ['STRATEGY_STRUCTURE_CONSISTENCY'],
        applicability: 'required',
      },
      {
        sectionType: 'COHERENCE',
        blockId: `${blockPrefix}_COHERENCE`,
        title: `${blockPrefix}_COHERENCE`,
        content: 'trace.hasInconsistency=false',
        supportingReferences: [],
        sourceOfTruth: ['DECISION_TRACE'],
        sourcePaths: ['trace.hasInconsistency'],
        coherenceChecks: ['TRACE_EXPLANATION_DOCUMENT_ALIGNMENT', 'DFD_ETP_TR_COHERENCE'],
        applicability: 'required',
      },
    ],
  };
}

describe('Administrative Document Premium Engine', () => {
  it('materializa transformacao estrutura -> premium com 7 secoes em ordem', () => {
    const docs = [buildDocument(ModuleId.DFD, 'DFD', 'process')];
    const premium = executeAdministrativeDocumentPremiumEngine(docs);

    expect(premium).toHaveLength(1);
    expect(premium[0]!.premiumKind).toBe('DFD');
    expect(premium[0]!.sections).toHaveLength(7);
    expect(premium[0]!.sections.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(premium[0]!.sections[0]!.traceability.structuralBlockId).toBe('DFD_IDENTIFICACAO');
  });

  it('preserva blocos proibidos e nao aplicaveis sem preencher conteudo', () => {
    const docs = [buildDocument(ModuleId.ETP, 'ETP', 'process', 'prohibited')];
    const premium = executeAdministrativeDocumentPremiumEngine(docs);
    const calc = premium[0]!.sections.find((s) => s.structuralSectionType === 'CALCULATION');

    expect(calc).toBeDefined();
    expect(calc!.applicability).toBe('prohibited');
    expect(calc!.content).toBe('');
  });

  it('garante rastreabilidade premium por secao com regra aplicada', () => {
    const docs = [buildDocument(ModuleId.ETP, 'ETP', 'process')];
    const premium = executeAdministrativeDocumentPremiumEngine(docs);
    const needSection = premium[0]!.sections.find((s) => s.structuralSectionType === 'NEED')!;

    expect(needSection.traceability.sourceOfTruth).toContain('DECISION_EXPLANATION');
    expect(needSection.traceability.sourcePaths).toContain('demandDescription');
    expect(needSection.traceability.premiumRuleId).toBe('ETP_PREMIUM_NECESSIDADE_E_RESULTADOS');
  });

  it('materializa coerencia interdocumental no TR incluindo vinculo com pricing', () => {
    const docs = [buildDocument(ModuleId.TR, 'TR', 'process')];
    const premium = executeAdministrativeDocumentPremiumEngine(docs);
    const tr = premium[0]!;

    expect(tr.crossCoherence.requiredChecks).toContain('TR_PRICING_ALIGNMENT');
    expect(tr.crossCoherence.matchedChecks).toContain('TR_PRICING_ALIGNMENT');
    expect(tr.crossCoherence.missingChecks).toEqual([]);
    const coherenceSection = tr.sections.find((s) => s.structuralSectionType === 'COHERENCE')!;
    expect(coherenceSection.content).toContain('matchedChecks=');
    expect(coherenceSection.content).toContain('missingChecks=none');
  });

  it('sinaliza missingChecks e torna lacuna perceptivel na secao de coerencia', () => {
    const doc = buildDocument(ModuleId.DFD, 'DFD', 'process');
    const needSection = doc.sections.find((s) => s.sectionType === 'NEED')!;
    needSection.coherenceChecks = ['DFD_ETP_NEED_ALIGNMENT'];
    const idSection = doc.sections.find((s) => s.sectionType === 'IDENTIFICATION')!;
    idSection.coherenceChecks = ['DFD_ETP_CLASSIFICATION_ALIGNMENT'];
    const coherenceSection = doc.sections.find((s) => s.sectionType === 'COHERENCE')!;
    coherenceSection.coherenceChecks = ['TRACE_EXPLANATION_DOCUMENT_ALIGNMENT'];

    const premium = executeAdministrativeDocumentPremiumEngine([doc]);
    const result = premium[0]!;
    const coherence = result.sections.find((s) => s.structuralSectionType === 'COHERENCE')!;

    expect(result.crossCoherence.missingChecks).toContain('DFD_ETP_TR_COHERENCE');
    expect(coherence.content).toContain('missingChecks=DFD_ETP_TR_COHERENCE');
  });

  it('aplica redacao controlada e sinaliza termos proibidos sem inventar conteudo', () => {
    const docs = [buildDocument(ModuleId.DFD, 'DFD', 'process')];
    const premium = executeAdministrativeDocumentPremiumEngine(docs);
    const calcSection = premium[0]!.sections.find((s) => s.structuralSectionType === 'CALCULATION')!;

    expect(calcSection.content).toBe('calculo referencial talvez com memoria');
    expect(calcSection.writingCompliance.controlledLanguage).toBe(false);
    expect(calcSection.writingCompliance.prohibitedTermsFound).toContain('talvez');
  });

  it('gera saidas premium reais para DFD, ETP e TR com vinculo estrutural completo', () => {
    const input = [
      buildDocument(ModuleId.DFD, 'DFD', 'p1'),
      buildDocument(ModuleId.ETP, 'ETP', 'p1'),
      buildDocument(ModuleId.TR, 'TR', 'p1'),
    ];
    const premium = executeAdministrativeDocumentPremiumEngine(input);

    expect(premium.map((d) => d.premiumKind).sort()).toEqual(['DFD', 'ETP', 'TR']);
    for (const doc of premium) {
      expect(doc.sections).toHaveLength(7);
      for (const section of doc.sections) {
        expect(section.traceability.structuralBlockId.length).toBeGreaterThan(0);
        expect(section.traceability.premiumRuleId.length).toBeGreaterThan(0);
        expect(section.traceability.sourceOfTruth.length).toBeGreaterThan(0);
        expect(section.traceability.sourcePaths.length).toBeGreaterThan(0);
      }
      const unknownSection = doc.sections.find((s) => !s.traceability.structuralBlockId);
      expect(unknownSection).toBeUndefined();
    }
  });
});
