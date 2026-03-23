import assert from 'node:assert/strict';
import type { AdministrativeProcessResult } from '../dto/administrative-process.types';
import { applyAiAssistiveLayer } from '../modules/ai-assistive/ai-assistive.service';
import { buildEngineResponse } from '../factories/process-run-response.factory';

function baseEngineResult(overrides?: Partial<AdministrativeProcessResult>): AdministrativeProcessResult {
  const base: AdministrativeProcessResult = {
    success: true,
    status: 'success',
    finalStatus: 'SUCCESS',
    halted: false,
    events: [],
    validations: [],
    metadata: {},
    processSnapshot: { processId: 'P-001' },
    outputs: [
      {
        moduleId: 'DFD',
        metadata: {
          premiumDocuments: [
            {
              premiumDocumentId: 'PREMIUM:DFD:process:P-001',
              moduleId: 'DFD',
              premiumKind: 'DFD',
              targetType: 'process',
              targetId: 'P-001',
              generatedAt: new Date(0).toISOString(),
              structuralDocumentRef: { documentId: 'DOC:DFD:process:P-001' },
              sections: [
                {
                  sectionId: 'S1',
                  structuralSectionType: 'NEED',
                  applicability: 'required',
                  content: 'necessidade institucional validada',
                  traceability: {
                    structuralBlockId: 'DFD_NEED',
                    sourceOfTruth: ['PROCESS_SNAPSHOT'],
                    coherenceChecks: ['DFD_ETP_NEED_ALIGNMENT'],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  return {
    ...base,
    ...(overrides ?? {}),
    metadata: {
      ...base.metadata,
      ...((overrides?.metadata as Record<string, unknown> | undefined) ?? {}),
    },
  };
}

function run(): void {
  const originalFlag = process.env['AI_ASSISTIVE_ENABLED'];
  const originalForcedFail = process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'];

  try {
    process.env['AI_ASSISTIVE_ENABLED'] = 'true';

    const successWithAi = applyAiAssistiveLayer(baseEngineResult());
    const aiMeta1 = (successWithAi.metadata['aiAssistive'] as Record<string, unknown>) ?? {};
    assert.equal(aiMeta1['enabled'], true);
    assert.equal(aiMeta1['decisionInfluence'], false);
    assert.ok(Array.isArray(aiMeta1['documents']));

    const responseWithAi = buildEngineResponse(successWithAi);
    assert.equal(responseWithAi.success, true);
    assert.equal(responseWithAi.process.finalStatus, 'SUCCESS');
    assert.ok((responseWithAi.result.metadata as Record<string, unknown>)['aiAssistive']);

    const haltedResult = applyAiAssistiveLayer(
      baseEngineResult({
        success: false,
        status: 'halted',
        finalStatus: 'HALTED_BY_VALIDATION',
        halted: true,
      })
    );
    const aiMeta2 = (haltedResult.metadata['aiAssistive'] as Record<string, unknown>) ?? {};
    assert.equal(aiMeta2['enabled'], false);
    assert.equal(aiMeta2['reason'], 'SKIPPED_NON_SUCCESS_STATUS');

    const noPremiumResult = applyAiAssistiveLayer(
      baseEngineResult({
        outputs: [{ moduleId: 'DFD', metadata: {} }],
      })
    );
    const aiMeta3 = (noPremiumResult.metadata['aiAssistive'] as Record<string, unknown>) ?? {};
    assert.equal(aiMeta3['enabled'], false);
    assert.equal(aiMeta3['reason'], 'SKIPPED_NO_PREMIUM_DOCUMENTS');

    process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'] = 'true';
    const providerFailResult = applyAiAssistiveLayer(baseEngineResult());
    const aiMetaProviderFail =
      (providerFailResult.metadata['aiAssistive'] as Record<string, unknown>) ?? {};
    assert.equal(aiMetaProviderFail['enabled'], false);
    assert.equal(aiMetaProviderFail['reason'], 'FALLBACK_PROVIDER_FAILURE');
    delete process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'];

    process.env['AI_ASSISTIVE_ENABLED'] = 'false';
    const disabledResult = applyAiAssistiveLayer(baseEngineResult());
    const aiMeta4 = (disabledResult.metadata['aiAssistive'] as Record<string, unknown>) ?? {};
    assert.equal(aiMeta4['enabled'], false);
    assert.equal(aiMeta4['reason'], 'DISABLED_BY_ENV');

    const responseWithoutAi = buildEngineResponse(disabledResult);
    assert.equal(responseWithoutAi.success, true);
    assert.ok('process' in responseWithoutAi);
    assert.ok('result' in responseWithoutAi);
    assert.ok('events' in responseWithoutAi);
    assert.ok('metadata' in responseWithoutAi);
    assert.ok('validations' in responseWithoutAi);
  } finally {
    if (originalForcedFail === undefined) {
      delete process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'];
    } else {
      process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'] = originalForcedFail;
    }
    if (originalFlag === undefined) {
      delete process.env['AI_ASSISTIVE_ENABLED'];
    } else {
      process.env['AI_ASSISTIVE_ENABLED'] = originalFlag;
    }
  }
}

run();
console.log('[ETAPA-D-F2-PROOF] OK');
