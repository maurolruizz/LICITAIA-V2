import type { ModuleId } from '../../core/enums/module-id.enum';
import type { AdministrativeDocumentModel } from './administrative-document.types';

export type PremiumDocumentKind = 'DFD' | 'ETP' | 'TR';

export interface PremiumSectionTraceability {
  structuralBlockId: string;
  sourceOfTruth: string[];
  sourcePaths: string[];
  coherenceChecks: string[];
  premiumRuleId: string;
}

export interface PremiumWritingCompliance {
  controlledLanguage: boolean;
  hasProhibitedTerms: boolean;
  prohibitedTermsFound: string[];
}

export interface PremiumDocumentSection {
  order: number;
  sectionId: string;
  title: string;
  subtitle: string;
  structuralSectionType: string;
  applicability: 'required' | 'conditional' | 'prohibited' | 'not_applicable';
  content: string;
  traceability: PremiumSectionTraceability;
  writingCompliance: PremiumWritingCompliance;
}

export interface PremiumDocumentCrossCoherence {
  requiredChecks: string[];
  matchedChecks: string[];
  missingChecks: string[];
}

export interface AdministrativePremiumDocument {
  premiumDocumentId: string;
  moduleId: ModuleId;
  premiumKind: PremiumDocumentKind;
  targetType: 'process' | 'item' | 'lot';
  targetId: string;
  sections: PremiumDocumentSection[];
  crossCoherence: PremiumDocumentCrossCoherence;
  structuralDocumentRef: Pick<AdministrativeDocumentModel, 'documentId' | 'generatedAt' | 'hasInconsistency' | 'hasIncomplete'>;
  generatedAt: string;
}
