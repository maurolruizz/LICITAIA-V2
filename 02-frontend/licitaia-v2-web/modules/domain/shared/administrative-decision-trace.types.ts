import type { ModuleId } from '../../core/enums/module-id.enum';

export type DecisionStepType =
  | 'NEED'
  | 'STRUCTURE'
  | 'CALCULATION'
  | 'JUSTIFICATION'
  | 'COHERENCE'
  | 'STRATEGY';

export interface AdministrativeDecisionStep {
  stepType: DecisionStepType;
  description: string;
  sourceReference: string;
  supportingElementIds: string[];
}

export type SupportingElementType =
  | 'need'
  | 'structure'
  | 'calculation'
  | 'justification'
  | 'strategy'
  | 'coherence';

export interface SupportingElement {
  id: string;
  type: SupportingElementType;
  referenceId: string;
  sourceReference: string;
  excerpt: string;
}

export interface AdministrativeDecisionTrace {
  traceId: string;
  moduleId: ModuleId;
  targetType: 'process' | 'item' | 'lot';
  targetId: string;
  decisionSummary: string;
  decisionSteps: AdministrativeDecisionStep[];
  supportingElements: SupportingElement[];
  hasInconsistency: boolean;
  inconsistencyReasons?: string[];
  isComplete: boolean;
  generatedAt: string;
}

