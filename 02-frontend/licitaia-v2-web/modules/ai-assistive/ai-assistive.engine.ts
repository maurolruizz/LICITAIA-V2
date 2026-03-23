import {
  AI_ASSISTIVE_MODEL_VERSION,
  AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
} from './ai-assistive.config';
import { AI_ASSISTIVE_PROMPT_VERSION } from './ai-assistive.prompt';
import { internalControlledRefinerAdapter } from './ai-assistive.adapter';
import { validateProhibitedContent, validateSemanticPreservation } from './ai-assistive.validation';
import { fallbackToOriginalText } from './ai-assistive.fallback';
import type {
  AiAssistiveAuditEntry,
  AiAssistiveOutputDocument,
  AiAssistiveOutputSection,
  AiAssistiveRequestContract,
  AiAssistiveResult,
} from './ai-assistive.types';

export function executeAiAssistiveRefinement(
  request: AiAssistiveRequestContract
): AiAssistiveResult {
  const documents: AiAssistiveOutputDocument[] = [];
  const auditTrail: AiAssistiveAuditEntry[] = [];

  for (const document of request.documents) {
    const outputSections: AiAssistiveOutputSection[] = [];
    for (const section of document.sections) {
      const originalText = section.originalText;
      const isEligible =
        section.applicability === 'required' || section.applicability === 'conditional';

      if (!isEligible || !originalText.trim()) {
        const passthrough: AiAssistiveOutputSection = {
          sectionId: section.sectionId,
          refinedText: originalText,
          semanticPreservationStatus: 'preserved',
          prohibitedContentCheckStatus: 'clean',
          accepted: true,
          fallbackApplied: false,
        };
        outputSections.push(passthrough);
        auditTrail.push({
          processSnapshotId: request.processSnapshotId,
          premiumDocumentId: document.premiumDocumentId,
          sectionId: section.sectionId,
          aiModelVersion: request.aiModelVersion,
          promptVersion: request.promptVersion,
          accepted: true,
          fallbackApplied: false,
          semanticPreservationStatus: 'preserved',
          prohibitedContentCheckStatus: 'clean',
        });
        continue;
      }

      const candidate = internalControlledRefinerAdapter.refineText(originalText);
      const semanticPreservationStatus = validateSemanticPreservation(originalText, candidate);
      const prohibitedContentCheckStatus = validateProhibitedContent(originalText, candidate);
      const accepted =
        semanticPreservationStatus === 'preserved' &&
        prohibitedContentCheckStatus === 'clean';

      if (!accepted) {
        const fallbackText = fallbackToOriginalText(originalText);
        const fallbackReason =
          semanticPreservationStatus !== 'preserved'
            ? 'SEMANTIC_PRESERVATION_FAILED'
            : 'PROHIBITED_CONTENT_DETECTED';
        const fallbackSection: AiAssistiveOutputSection = {
          sectionId: section.sectionId,
          refinedText: fallbackText,
          semanticPreservationStatus,
          prohibitedContentCheckStatus,
          accepted: false,
          fallbackApplied: true,
          fallbackReason,
        };
        outputSections.push(fallbackSection);
        auditTrail.push({
          processSnapshotId: request.processSnapshotId,
          premiumDocumentId: document.premiumDocumentId,
          sectionId: section.sectionId,
          aiModelVersion: request.aiModelVersion,
          promptVersion: request.promptVersion,
          accepted: false,
          fallbackApplied: true,
          semanticPreservationStatus,
          prohibitedContentCheckStatus,
          fallbackReason,
        });
        continue;
      }

      const acceptedSection: AiAssistiveOutputSection = {
        sectionId: section.sectionId,
        refinedText: candidate,
        semanticPreservationStatus,
        prohibitedContentCheckStatus,
        accepted: true,
        fallbackApplied: false,
      };
      outputSections.push(acceptedSection);
      auditTrail.push({
        processSnapshotId: request.processSnapshotId,
        premiumDocumentId: document.premiumDocumentId,
        sectionId: section.sectionId,
        aiModelVersion: request.aiModelVersion,
        promptVersion: request.promptVersion,
        accepted: true,
        fallbackApplied: false,
        semanticPreservationStatus,
        prohibitedContentCheckStatus,
      });
    }

    documents.push({
      premiumDocumentId: document.premiumDocumentId,
      sections: outputSections,
    });
  }

  return {
    enabled: true,
    deterministic: true,
    providerId: internalControlledRefinerAdapter.providerId,
    modelVersion: AI_ASSISTIVE_MODEL_VERSION,
    promptVersion: AI_ASSISTIVE_PROMPT_VERSION,
    transformProfileVersion: AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
    decisionInfluence: false,
    documents,
    auditTrail,
  };
}
