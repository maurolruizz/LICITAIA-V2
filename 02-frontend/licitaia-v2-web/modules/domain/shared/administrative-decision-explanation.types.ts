import type { AdministrativeDecisionTrace } from './administrative-decision-trace.types';

export type ExplanationTargetType = AdministrativeDecisionTrace['targetType'];

export type ExplanationBlockType =
  | 'NEED'
  | 'STRUCTURE'
  | 'CALCULATION'
  | 'JUSTIFICATION'
  | 'COHERENCE'
  | 'STRATEGY';

export interface ExplanationBlock {
  blockType: ExplanationBlockType;
  title: string;
  description: string;
  supportingReferences: string[];
}

export interface AdministrativeDecisionExplanation {
  explanationId: string;

  targetType: ExplanationTargetType;
  targetId: string;

  summary: string;

  explanationBlocks: ExplanationBlock[];

  hasInconsistency: boolean;
  hasIncomplete: boolean;

  generatedAt: string;
}

