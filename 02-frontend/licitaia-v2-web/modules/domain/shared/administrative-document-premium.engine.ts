import type { AdministrativeDocumentModel, DocumentSection } from './administrative-document.types';
import type {
  AdministrativePremiumDocument,
  PremiumDocumentCrossCoherence,
  PremiumDocumentSection,
  PremiumWritingCompliance,
} from './administrative-document-premium.types';
import {
  PREMIUM_CONTROLLED_WRITING_PROHIBITED_TERMS,
  PREMIUM_DOCUMENT_KIND_BY_MODULE,
  PREMIUM_REQUIRED_CROSS_COHERENCE_CHECKS,
  PREMIUM_SECTION_RULES_BY_DOCUMENT,
} from './administrative-document-premium.rules';

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function formatControlledContent(input: string): string {
  return normalizeWhitespace(input);
}

function evaluateWritingCompliance(content: string): PremiumWritingCompliance {
  const normalized = content.toLowerCase();
  const prohibitedTermsFound = PREMIUM_CONTROLLED_WRITING_PROHIBITED_TERMS.filter((term) =>
    normalized.includes(term)
  );
  return {
    controlledLanguage: prohibitedTermsFound.length === 0,
    hasProhibitedTerms: prohibitedTermsFound.length > 0,
    prohibitedTermsFound,
  };
}

function computeCrossCoherence(
  requiredChecks: string[],
  sections: PremiumDocumentSection[]
): PremiumDocumentCrossCoherence {
  const declared = new Set<string>();
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

function withPerceptibleCoherence(
  sections: PremiumDocumentSection[],
  crossCoherence: PremiumDocumentCrossCoherence
): PremiumDocumentSection[] {
  return sections.map((section) => {
    if (section.structuralSectionType !== 'COHERENCE') return section;

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

function toPremiumSection(docId: string, section: DocumentSection, premiumKind: 'DFD' | 'ETP' | 'TR'): PremiumDocumentSection {
  const rule = PREMIUM_SECTION_RULES_BY_DOCUMENT[premiumKind][section.sectionType];
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

export function executeAdministrativeDocumentPremiumEngine(
  documents: AdministrativeDocumentModel[]
): AdministrativePremiumDocument[] {
  const premiumDocuments: AdministrativePremiumDocument[] = [];

  for (const document of documents) {
    const premiumKind = PREMIUM_DOCUMENT_KIND_BY_MODULE[document.moduleId];
    if (!premiumKind) continue;

    const sections = document.sections
      .map((section) => toPremiumSection(document.documentId, section, premiumKind))
      .sort((a, b) => a.order - b.order);

    const requiredChecks = PREMIUM_REQUIRED_CROSS_COHERENCE_CHECKS[premiumKind];
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
    if (m !== 0) return m;
    const t = a.targetType.localeCompare(b.targetType);
    if (t !== 0) return t;
    return a.targetId.localeCompare(b.targetId);
  });

  return premiumDocuments;
}
