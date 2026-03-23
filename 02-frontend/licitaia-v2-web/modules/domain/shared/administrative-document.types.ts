import type { ModuleId } from '../../core/enums/module-id.enum';

export type DocumentSectionType =
  | 'IDENTIFICATION'
  | 'NEED'
  | 'STRUCTURE'
  | 'CALCULATION'
  | 'JUSTIFICATION'
  | 'STRATEGY'
  | 'COHERENCE';

export interface DocumentSection {
  sectionType: DocumentSectionType;
  blockId: string;
  title: string;
  content: string;
  supportingReferences: string[];
  sourceOfTruth: DocumentSourceType[];
  sourcePaths: string[];
  coherenceChecks: string[];
  applicability: 'required' | 'conditional' | 'prohibited' | 'not_applicable';
}

export type DocumentSourceType =
  | 'PROCESS_SNAPSHOT'
  | 'DECISION_TRACE'
  | 'DECISION_EXPLANATION'
  | 'VALIDATION_RESULT'
  | 'CALCULATION_MEMORY'
  | 'DERIVED';

export interface AdministrativeDocumentModel {
  documentId: string;
  moduleId: ModuleId;
  targetType: 'process' | 'item' | 'lot';
  targetId: string;
  sections: DocumentSection[];
  hasInconsistency: boolean;
  hasIncomplete: boolean;
  generatedAt: string;
}
