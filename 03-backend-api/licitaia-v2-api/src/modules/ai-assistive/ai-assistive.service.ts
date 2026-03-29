import type { AdministrativeProcessResult } from '../../dto/administrative-process.types';
import { config } from '../../config/env';
import { logger } from '../../middleware/logger';
import { getFrontendCoreAssistive } from '../../lib/frontend-core-loader';

function getAssistiveFrontendCore(): ReturnType<typeof getFrontendCoreAssistive> {
  return getFrontendCoreAssistive();
}

type PremiumSectionRaw = {
  sectionId?: unknown;
  applicability?: unknown;
  content?: unknown;
  structuralSectionType?: unknown;
  traceability?: {
    structuralBlockId?: unknown;
    sourceOfTruth?: unknown;
    coherenceChecks?: unknown;
  };
};

type PremiumDocumentRaw = {
  premiumDocumentId?: unknown;
  moduleId?: unknown;
  premiumKind?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  generatedAt?: unknown;
  structuralDocumentRef?: {
    documentId?: unknown;
  };
  sections?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function extractPremiumDocuments(result: AdministrativeProcessResult): PremiumDocumentRaw[] {
  const outputs = Array.isArray(result['outputs']) ? (result['outputs'] as unknown[]) : [];
  const docs: PremiumDocumentRaw[] = [];
  for (const out of outputs) {
    const outputRecord = asRecord(out);
    const metadata = asRecord(outputRecord?.['metadata']);
    const premiumDocs = metadata?.['premiumDocuments'];
    if (!Array.isArray(premiumDocs)) continue;
    for (const doc of premiumDocs) {
      if (asRecord(doc)) docs.push(doc as PremiumDocumentRaw);
    }
  }
  return docs;
}

function mapAssistiveRequest(result: AdministrativeProcessResult): Record<string, unknown> {
  const processSnapshot = asRecord(result['processSnapshot']);
  const processId = typeof processSnapshot?.['processId'] === 'string' ? processSnapshot['processId'] : undefined;
  const snapshotId = processId ?? 'PROCESS_SNAPSHOT_FINAL';

  const docs = extractPremiumDocuments(result).map((doc) => {
    const sectionsRaw = Array.isArray(doc.sections) ? (doc.sections as PremiumSectionRaw[]) : [];
    return {
      premiumDocumentId:
        typeof doc.premiumDocumentId === 'string' ? doc.premiumDocumentId : 'PREMIUM:UNKNOWN',
      documentId:
        typeof doc.structuralDocumentRef?.documentId === 'string'
          ? doc.structuralDocumentRef.documentId
          : 'DOC:UNKNOWN',
      moduleId: typeof doc.moduleId === 'string' ? doc.moduleId : 'UNKNOWN',
      premiumKind: typeof doc.premiumKind === 'string' ? doc.premiumKind : 'DFD',
      targetType: doc.targetType === 'item' || doc.targetType === 'lot' ? doc.targetType : 'process',
      targetId: typeof doc.targetId === 'string' ? doc.targetId : 'process',
      generatedAt: typeof doc.generatedAt === 'string' ? doc.generatedAt : new Date(0).toISOString(),
      sections: sectionsRaw.map((section) => ({
        sectionId: typeof section.sectionId === 'string' ? section.sectionId : 'SECTION:UNKNOWN',
        blockId:
          typeof section.traceability?.structuralBlockId === 'string'
            ? section.traceability.structuralBlockId
            : 'BLOCK:UNKNOWN',
        structuralSectionType:
          typeof section.structuralSectionType === 'string'
            ? section.structuralSectionType
            : 'UNKNOWN',
        applicability:
          section.applicability === 'required' ||
          section.applicability === 'conditional' ||
          section.applicability === 'prohibited' ||
          section.applicability === 'not_applicable'
            ? section.applicability
            : 'not_applicable',
        sourceOfTruth: toStringArray(section.traceability?.sourceOfTruth),
        coherenceChecks: toStringArray(section.traceability?.coherenceChecks),
        originalText: typeof section.content === 'string' ? section.content : '',
      })),
    };
  });

  const core = getAssistiveFrontendCore();
  return {
    processSnapshotId: snapshotId,
    transformProfileVersion:
      core.AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION ?? 'ETAPA-D-F2-TRANSFORM-V1',
    aiModelVersion: core.AI_ASSISTIVE_MODEL_VERSION ?? 'assistive-deterministic-v1',
    promptVersion: core.AI_ASSISTIVE_PROMPT_VERSION ?? 'ETAPA-D-F2-V1',
    documents: docs,
  };
}

function buildDisabledAssistiveResult(reason: string): Record<string, unknown> {
  const core = getAssistiveFrontendCore();
  return {
    enabled: false,
    deterministic: true,
    providerId: 'internal-controlled-refiner',
    modelVersion: core.AI_ASSISTIVE_MODEL_VERSION ?? 'assistive-deterministic-v1',
    promptVersion: core.AI_ASSISTIVE_PROMPT_VERSION ?? 'ETAPA-D-F2-V1',
    transformProfileVersion:
      core.AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION ?? 'ETAPA-D-F2-TRANSFORM-V1',
    decisionInfluence: false,
    reason,
    documents: [],
    auditTrail: [],
  };
}

function isAiAssistiveEnabled(): boolean {
  const raw = process.env['AI_ASSISTIVE_ENABLED'];
  if (raw === undefined || raw.trim() === '') {
    return config.aiAssistiveEnabled;
  }
  return raw !== 'false';
}

export function applyAiAssistiveLayer(
  engineResult: AdministrativeProcessResult
): AdministrativeProcessResult {
  const baseMetadata = asRecord(engineResult.metadata) ?? {};

  if (!isAiAssistiveEnabled()) {
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: buildDisabledAssistiveResult('DISABLED_BY_ENV'),
      },
    };
  }

  if (engineResult.finalStatus !== 'SUCCESS' || engineResult.halted) {
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: buildDisabledAssistiveResult('SKIPPED_NON_SUCCESS_STATUS'),
      },
    };
  }

  const request = mapAssistiveRequest(engineResult);
  const documents = Array.isArray(request['documents']) ? request['documents'] : [];
  if (documents.length === 0) {
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: buildDisabledAssistiveResult('SKIPPED_NO_PREMIUM_DOCUMENTS'),
      },
    };
  }

  const execute = getAssistiveFrontendCore().executeAiAssistiveRefinement;
  if (typeof execute !== 'function') {
    logger.warn('[AI_ASSISTIVE] executeAiAssistiveRefinement indisponivel no nucleo src.');
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: buildDisabledAssistiveResult('SKIPPED_ENGINE_UNAVAILABLE'),
      },
    };
  }

  try {
    if (process.env['AI_ASSISTIVE_FORCE_FAILURE_FOR_PROOF'] === 'true') {
      throw new Error('FORCED_PROVIDER_FAILURE');
    }
    const aiAssistiveResult = execute(request);
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: aiAssistiveResult,
      },
    };
  } catch (error) {
    logger.warn(
      `[AI_ASSISTIVE] Falha na execução assistiva, fallback obrigatório aplicado: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return {
      ...engineResult,
      metadata: {
        ...baseMetadata,
        aiAssistive: buildDisabledAssistiveResult('FALLBACK_PROVIDER_FAILURE'),
      },
    };
  }
}
