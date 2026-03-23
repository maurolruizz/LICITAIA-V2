import { describe, expect, it } from 'vitest';
import { executeAiAssistiveRefinement } from './ai-assistive.engine';
import {
  AI_ASSISTIVE_MODEL_VERSION,
  AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
} from './ai-assistive.config';
import { AI_ASSISTIVE_PROMPT_VERSION } from './ai-assistive.prompt';
import { internalControlledRefinerAdapter } from './ai-assistive.adapter';

describe('AI Assistive Engine', () => {
  it('refina somente secoes permitidas com determinismo e sem influencia decisoria', () => {
    const result = executeAiAssistiveRefinement({
      processSnapshotId: 'snapshot-1',
      transformProfileVersion: AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
      aiModelVersion: AI_ASSISTIVE_MODEL_VERSION,
      promptVersion: AI_ASSISTIVE_PROMPT_VERSION,
      documents: [
        {
          premiumDocumentId: 'PREMIUM:DFD:process:1',
          documentId: 'DOC:DFD:process:1',
          moduleId: 'DFD',
          premiumKind: 'DFD',
          targetType: 'process',
          targetId: '1',
          generatedAt: new Date(0).toISOString(),
          sections: [
            {
              sectionId: 'S1',
              blockId: 'DFD_NEED',
              structuralSectionType: 'NEED',
              applicability: 'required',
              sourceOfTruth: ['PROCESS_SNAPSHOT'],
              coherenceChecks: ['DFD_ETP_NEED_ALIGNMENT'],
              originalText: '  necessidade   formalizada  ',
            },
            {
              sectionId: 'S2',
              blockId: 'DFD_CALCULATION',
              structuralSectionType: 'CALCULATION',
              applicability: 'prohibited',
              sourceOfTruth: ['CALCULATION_MEMORY'],
              coherenceChecks: ['TR_PRICING_ALIGNMENT'],
              originalText: '',
            },
          ],
        },
      ],
    });

    expect(result.deterministic).toBe(true);
    expect(result.decisionInfluence).toBe(false);
    expect(result.documents[0]?.sections[0]?.refinedText).toBe('necessidade formalizada');
    expect(result.documents[0]?.sections[1]?.refinedText).toBe('');
  });

  it('faz fallback ao original quando preservacao semantica falha', () => {
    const originalRefine = internalControlledRefinerAdapter.refineText;
    try {
      internalControlledRefinerAdapter.refineText = () => 'texto alterado sem equivalencia';
      const result = executeAiAssistiveRefinement({
        processSnapshotId: 'snapshot-2',
        transformProfileVersion: AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
        aiModelVersion: AI_ASSISTIVE_MODEL_VERSION,
        promptVersion: AI_ASSISTIVE_PROMPT_VERSION,
        documents: [
          {
            premiumDocumentId: 'PREMIUM:ETP:process:2',
            documentId: 'DOC:ETP:process:2',
            moduleId: 'ETP',
            premiumKind: 'ETP',
            targetType: 'process',
            targetId: '2',
            generatedAt: new Date(0).toISOString(),
            sections: [
              {
                sectionId: 'S3',
                blockId: 'ETP_NEED',
                structuralSectionType: 'NEED',
                applicability: 'required',
                sourceOfTruth: ['PROCESS_SNAPSHOT'],
                coherenceChecks: [],
                originalText: 'texto original',
              },
            ],
          },
        ],
      });

      const section = result.documents[0]?.sections[0];
      expect(section?.accepted).toBe(false);
      expect(section?.fallbackApplied).toBe(true);
      expect(section?.refinedText).toBe('texto original');
      expect(section?.fallbackReason).toBe('SEMANTIC_PRESERVATION_FAILED');
    } finally {
      internalControlledRefinerAdapter.refineText = originalRefine;
    }
  });
});
