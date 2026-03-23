export type AiAssistiveDocumentKind = 'DFD' | 'ETP' | 'TR';

export interface AiAssistiveInputSection {
  sectionId: string;
  blockId: string;
  structuralSectionType: string;
  applicability: 'required' | 'conditional' | 'prohibited' | 'not_applicable';
  sourceOfTruth: string[];
  coherenceChecks: string[];
  originalText: string;
}

export interface AiAssistiveInputDocument {
  premiumDocumentId: string;
  documentId: string;
  moduleId: string;
  premiumKind: AiAssistiveDocumentKind;
  targetType: 'process' | 'item' | 'lot';
  targetId: string;
  generatedAt: string;
  sections: AiAssistiveInputSection[];
}

export interface AiAssistiveRequestContract {
  processSnapshotId: string;
  transformProfileVersion: string;
  aiModelVersion: string;
  promptVersion: string;
  documents: AiAssistiveInputDocument[];
}

export interface AiAssistiveOutputSection {
  sectionId: string;
  refinedText: string;
  semanticPreservationStatus: 'preserved' | 'not_preserved';
  prohibitedContentCheckStatus: 'clean' | 'violated';
  accepted: boolean;
  fallbackApplied: boolean;
  fallbackReason?: string;
}

export interface AiAssistiveOutputDocument {
  premiumDocumentId: string;
  sections: AiAssistiveOutputSection[];
}

export interface AiAssistiveAuditEntry {
  processSnapshotId: string;
  premiumDocumentId: string;
  sectionId: string;
  aiModelVersion: string;
  promptVersion: string;
  accepted: boolean;
  fallbackApplied: boolean;
  semanticPreservationStatus: 'preserved' | 'not_preserved';
  prohibitedContentCheckStatus: 'clean' | 'violated';
  fallbackReason?: string;
}

export interface AiAssistiveResult {
  enabled: boolean;
  deterministic: true;
  providerId: string;
  modelVersion: string;
  promptVersion: string;
  transformProfileVersion: string;
  decisionInfluence: false;
  documents: AiAssistiveOutputDocument[];
  auditTrail: AiAssistiveAuditEntry[];
}
