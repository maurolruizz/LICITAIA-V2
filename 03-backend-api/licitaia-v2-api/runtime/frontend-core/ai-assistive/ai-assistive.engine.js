"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAiAssistiveRefinement = executeAiAssistiveRefinement;
const ai_assistive_config_1 = require("./ai-assistive.config");
const ai_assistive_prompt_1 = require("./ai-assistive.prompt");
const ai_assistive_adapter_1 = require("./ai-assistive.adapter");
const ai_assistive_validation_1 = require("./ai-assistive.validation");
const ai_assistive_fallback_1 = require("./ai-assistive.fallback");
function executeAiAssistiveRefinement(request) {
    const documents = [];
    const auditTrail = [];
    for (const document of request.documents) {
        const outputSections = [];
        for (const section of document.sections) {
            const originalText = section.originalText;
            const isEligible = section.applicability === 'required' || section.applicability === 'conditional';
            if (!isEligible || !originalText.trim()) {
                const passthrough = {
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
            const candidate = ai_assistive_adapter_1.internalControlledRefinerAdapter.refineText(originalText);
            const semanticPreservationStatus = (0, ai_assistive_validation_1.validateSemanticPreservation)(originalText, candidate);
            const prohibitedContentCheckStatus = (0, ai_assistive_validation_1.validateProhibitedContent)(originalText, candidate);
            const accepted = semanticPreservationStatus === 'preserved' &&
                prohibitedContentCheckStatus === 'clean';
            if (!accepted) {
                const fallbackText = (0, ai_assistive_fallback_1.fallbackToOriginalText)(originalText);
                const fallbackReason = semanticPreservationStatus !== 'preserved'
                    ? 'SEMANTIC_PRESERVATION_FAILED'
                    : 'PROHIBITED_CONTENT_DETECTED';
                const fallbackSection = {
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
            const acceptedSection = {
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
        providerId: ai_assistive_adapter_1.internalControlledRefinerAdapter.providerId,
        modelVersion: ai_assistive_config_1.AI_ASSISTIVE_MODEL_VERSION,
        promptVersion: ai_assistive_prompt_1.AI_ASSISTIVE_PROMPT_VERSION,
        transformProfileVersion: ai_assistive_config_1.AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION,
        decisionInfluence: false,
        documents,
        auditTrail,
    };
}
