"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAdministrativeDocumentPremiumEngine = executeAdministrativeDocumentPremiumEngine;
const administrative_document_premium_rules_1 = require("./administrative-document-premium.rules");
function normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
}
function formatControlledContent(input) {
    return normalizeWhitespace(input);
}
function evaluateWritingCompliance(content) {
    const normalized = content.toLowerCase();
    const prohibitedTermsFound = administrative_document_premium_rules_1.PREMIUM_CONTROLLED_WRITING_PROHIBITED_TERMS.filter((term) => normalized.includes(term));
    return {
        controlledLanguage: prohibitedTermsFound.length === 0,
        hasProhibitedTerms: prohibitedTermsFound.length > 0,
        prohibitedTermsFound,
    };
}
function computeCrossCoherence(requiredChecks, sections) {
    const declared = new Set();
    for (const section of sections) {
        for (const check of section.traceability.coherenceChecks) {
            declared.add(check);
        }
    }
    const matchedChecks = requiredChecks.filter((check) => declared.has(check));
    const missingChecks = requiredChecks.filter((check) => !declared.has(check));
    return {
        requiredChecks,
        matchedChecks,
        missingChecks,
    };
}
function withPerceptibleCoherence(sections, crossCoherence) {
    return sections.map((section) => {
        if (section.structuralSectionType !== 'COHERENCE')
            return section;
        const matched = crossCoherence.matchedChecks.join(',');
        const missing = crossCoherence.missingChecks.join(',');
        const coherenceSummary = `matchedChecks=${matched || 'none'} | missingChecks=${missing || 'none'}`;
        const content = section.content ? `${section.content} | ${coherenceSummary}` : coherenceSummary;
        return {
            ...section,
            content,
            writingCompliance: evaluateWritingCompliance(content),
        };
    });
}
function toPremiumSection(docId, section, premiumKind) {
    const rule = administrative_document_premium_rules_1.PREMIUM_SECTION_RULES_BY_DOCUMENT[premiumKind][section.sectionType];
    const content = section.applicability === 'prohibited' || section.applicability === 'not_applicable'
        ? ''
        : formatControlledContent(section.content);
    return {
        order: rule.order,
        sectionId: `${docId}:${rule.order}:${section.blockId}`,
        title: rule.title,
        subtitle: rule.subtitle,
        structuralSectionType: section.sectionType,
        applicability: section.applicability,
        content,
        traceability: {
            structuralBlockId: section.blockId,
            sourceOfTruth: [...section.sourceOfTruth],
            sourcePaths: [...section.sourcePaths],
            coherenceChecks: [...section.coherenceChecks],
            premiumRuleId: rule.premiumRuleId,
        },
        writingCompliance: evaluateWritingCompliance(content),
    };
}
function executeAdministrativeDocumentPremiumEngine(documents) {
    const premiumDocuments = [];
    for (const document of documents) {
        const premiumKind = administrative_document_premium_rules_1.PREMIUM_DOCUMENT_KIND_BY_MODULE[document.moduleId];
        if (!premiumKind)
            continue;
        const sections = document.sections
            .map((section) => toPremiumSection(document.documentId, section, premiumKind))
            .sort((a, b) => a.order - b.order);
        const requiredChecks = administrative_document_premium_rules_1.PREMIUM_REQUIRED_CROSS_COHERENCE_CHECKS[premiumKind];
        const crossCoherence = computeCrossCoherence(requiredChecks, sections);
        const perceptibleSections = withPerceptibleCoherence(sections, crossCoherence);
        premiumDocuments.push({
            premiumDocumentId: `PREMIUM:${document.moduleId}:${document.targetType}:${document.targetId}`,
            moduleId: document.moduleId,
            premiumKind,
            targetType: document.targetType,
            targetId: document.targetId,
            sections: perceptibleSections,
            crossCoherence,
            structuralDocumentRef: {
                documentId: document.documentId,
                generatedAt: document.generatedAt,
                hasInconsistency: document.hasInconsistency,
                hasIncomplete: document.hasIncomplete,
            },
            generatedAt: document.generatedAt,
        });
    }
    premiumDocuments.sort((a, b) => {
        const m = a.moduleId.localeCompare(b.moduleId);
        if (m !== 0)
            return m;
        const t = a.targetType.localeCompare(b.targetType);
        if (t !== 0)
            return t;
        return a.targetId.localeCompare(b.targetId);
    });
    return premiumDocuments;
}
