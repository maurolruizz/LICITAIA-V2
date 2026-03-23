/**
 * Compositor de metadados de decisão para auditoria.
 */

import type { DecisionMetadataContract } from '../../core/contracts/decision-metadata.contract';
import type { ExtractedProcurementStructure } from '../../domain/shared/object-structure.extractor';
import type { ExtractedCalculationMemory } from '../../domain/shared/calculation-memory.types';
import type { ExtractedAdministrativeJustification } from '../../domain/shared/administrative-justification.types';
import type { AdministrativeCoherenceResult } from '../../domain/shared/administrative-coherence.types';
import type { ExtractedAdministrativeNeed } from '../../domain/shared/administrative-need.types';
import type { ExtractedProcurementStrategy } from '../../domain/shared/procurement-strategy.types';
import type { AdministrativeDocumentConsistencyResult } from '../../domain/shared/administrative-document-consistency.types';
import type { AdministrativeDecisionTrace } from '../../domain/shared/administrative-decision-trace.types';
import type { AdministrativeDecisionExplanation } from '../../domain/shared/administrative-decision-explanation.types';
import type { AdministrativeDocumentModel } from '../../domain/shared/administrative-document.types';
import type { AdministrativePremiumDocument } from '../../domain/shared/administrative-document-premium.types';

export function composeMetadata(
  base: DecisionMetadataContract,
  extra: Partial<DecisionMetadataContract>
): DecisionMetadataContract {
  return {
    ...base,
    ...extra,
    payload: { ...(base.payload ?? {}), ...(extra.payload ?? {}) },
  };
}

export function mergeMetadataList(
  items: DecisionMetadataContract[]
): Record<string, unknown> {
  return items.reduce<Record<string, unknown>>((acc, item) => {
    if (item.payload) {
      return { ...acc, ...item.payload };
    }
    return acc;
  }, {});
}

export function buildObjectStructureMetadata(
  extracted: ExtractedProcurementStructure
): { objectStructureType: string; lotCount: number; itemCount: number } {
  return {
    objectStructureType: extracted.structureType,
    lotCount: extracted.lotCount,
    itemCount: extracted.itemCount,
  };
}

export function buildCalculationMemoryMetadata(
  extracted: ExtractedCalculationMemory
): {
  calculationMemory: {
    hasCalculationMemory: boolean;
    calculationMemoryCount: number;
    calculationTypes: string[];
    calculationTargets: { targetType: string; targetId: string }[];
    consumptionCalculationCount: number;
    institutionalSizingCalculationCount: number;
  };
} {
  return {
    calculationMemory: {
      hasCalculationMemory: extracted.count > 0,
      calculationMemoryCount: extracted.count,
      calculationTypes: extracted.calculationTypes,
      calculationTargets: extracted.calculationTargets,
      consumptionCalculationCount: extracted.consumptionCount,
      institutionalSizingCalculationCount: extracted.institutionalSizingCount,
    },
  };
}

export function buildAdministrativeJustificationMetadata(
  extracted: ExtractedAdministrativeJustification
): {
  administrativeJustification: {
    hasAdministrativeJustification: boolean;
    totalJustifications: number;
    processJustificationCount: number;
    itemJustificationCount: number;
    lotJustificationCount: number;
    withLegalBasisCount: number;
    missingCriticalFieldsCount: number;
  };
} {
  return {
    administrativeJustification: {
      hasAdministrativeJustification: extracted.count > 0,
      totalJustifications: extracted.count,
      processJustificationCount: extracted.processJustificationCount,
      itemJustificationCount: extracted.itemJustificationCount,
      lotJustificationCount: extracted.lotJustificationCount,
      withLegalBasisCount: extracted.withLegalBasisCount,
      missingCriticalFieldsCount: extracted.missingCriticalFieldsCount,
    },
  };
}

export function buildAdministrativeCoherenceMetadata(
  coherenceResult: AdministrativeCoherenceResult
): {
  administrativeCoherence: {
    hasCoherenceIssues: boolean;
    totalIssues: number;
    justificationWithoutTargetCount: number;
    objectWithoutJustificationCount: number;
    calculationWithoutJustificationCount: number;
    justificationCalculationMismatchCount: number;
  };
} {
  return {
    administrativeCoherence: {
      hasCoherenceIssues: coherenceResult.hasCoherenceIssues,
      totalIssues: coherenceResult.totalIssues,
      justificationWithoutTargetCount: coherenceResult.justificationWithoutTargetCount,
      objectWithoutJustificationCount: coherenceResult.objectWithoutJustificationCount,
      calculationWithoutJustificationCount: coherenceResult.calculationWithoutJustificationCount,
      justificationCalculationMismatchCount: coherenceResult.justificationCalculationMismatchCount,
    },
  };
}

function countObjectWithoutNeed(
  extractedNeed: ExtractedAdministrativeNeed,
  extractedStructure: ExtractedProcurementStructure
): number {
  const needItemIds = new Set<string>();
  const needLotIds = new Set<string>();
  for (const e of extractedNeed.entries) {
    if (e.targetType === 'item' && e.targetId) needItemIds.add(String(e.targetId).trim());
    if (e.targetType === 'lot' && e.targetId) needLotIds.add(String(e.targetId).trim());
  }
  let count = 0;
  if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
    for (const item of extractedStructure.structure.items) {
      if (!needItemIds.has(item.id)) count++;
    }
  }
  if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
    for (const lot of extractedStructure.structure.lots) {
      if (!needLotIds.has(lot.id)) count++;
    }
  }
  return count;
}

export function buildAdministrativeNeedMetadata(
  extractedNeed: ExtractedAdministrativeNeed,
  extractedStructure: ExtractedProcurementStructure
): {
  administrativeNeed: {
    hasAdministrativeNeed: boolean;
    totalNeeds: number;
    objectWithoutNeedCount: number;
    needWithoutProblemCount: number;
    needWithoutOutcomeCount: number;
  };
} {
  const objectWithoutNeedCount = countObjectWithoutNeed(extractedNeed, extractedStructure);
  return {
    administrativeNeed: {
      hasAdministrativeNeed: extractedNeed.count > 0,
      totalNeeds: extractedNeed.count,
      objectWithoutNeedCount,
      needWithoutProblemCount: extractedNeed.needWithoutProblemCount,
      needWithoutOutcomeCount: extractedNeed.needWithoutOutcomeCount,
    },
  };
}

function countObjectWithoutStrategy(
  extractedStrategy: ExtractedProcurementStrategy,
  extractedStructure: ExtractedProcurementStructure
): number {
  const strategyItemIds = new Set<string>();
  const strategyLotIds = new Set<string>();
  for (const e of extractedStrategy.entries) {
    if (e.targetType === 'item' && e.targetId) strategyItemIds.add(String(e.targetId).trim());
    if (e.targetType === 'lot' && e.targetId) strategyLotIds.add(String(e.targetId).trim());
  }
  let count = 0;
  if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
    for (const item of extractedStructure.structure.items) {
      if (!strategyItemIds.has(item.id)) count++;
    }
  }
  if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
    for (const lot of extractedStructure.structure.lots) {
      if (!strategyLotIds.has(lot.id)) count++;
    }
  }
  return count;
}

export function buildProcurementStrategyMetadata(
  extractedStrategy: ExtractedProcurementStrategy,
  extractedStructure: ExtractedProcurementStructure
): {
  procurementStrategy: {
    hasStrategy: boolean;
    totalStrategies: number;
    objectWithoutStrategyCount: number;
    strategyWithoutModalityCount: number;
    strategyWithoutJustificationCount: number;
  };
} {
  const objectWithoutStrategyCount = countObjectWithoutStrategy(extractedStrategy, extractedStructure);
  return {
    procurementStrategy: {
      hasStrategy: extractedStrategy.count > 0,
      totalStrategies: extractedStrategy.count,
      objectWithoutStrategyCount,
      strategyWithoutModalityCount: extractedStrategy.strategyWithoutModalityCount,
      strategyWithoutJustificationCount: extractedStrategy.strategyWithoutJustificationCount,
    },
  };
}

export function buildDocumentConsistencyMetadata(
  result: AdministrativeDocumentConsistencyResult
): {
  documentConsistency: {
    hasIssues: boolean;
    totalIssues: number;
    blockingIssues: number;
    warningIssues: number;
  };
} {
  return {
    documentConsistency: {
      hasIssues: result.hasIssues,
      totalIssues: result.totalIssues,
      blockingIssues: result.blockingIssues,
      warningIssues: result.warningIssues,
    },
  };
}

export function buildDecisionTraceMetadata(
  traces: AdministrativeDecisionTrace[]
): {
  decisionTrace: {
    hasTrace: boolean;
    totalTraces: number;
    tracesPerTargetType: {
      process: number;
      item: number;
      lot: number;
    };
    hasInconsistency: boolean;
    hasIncomplete: boolean;
  };
} {
  const safe = Array.isArray(traces) ? traces : [];
  const processCount = safe.filter((t) => t.targetType === 'process').length;
  const itemCount = safe.filter((t) => t.targetType === 'item').length;
  const lotCount = safe.filter((t) => t.targetType === 'lot').length;
  const hasInconsistency = safe.some((t) => t.hasInconsistency);
  const hasIncomplete = safe.some((t) => !t.isComplete);
  return {
    decisionTrace: {
      hasTrace: safe.length > 0,
      totalTraces: safe.length,
      tracesPerTargetType: {
        process: processCount,
        item: itemCount,
        lot: lotCount,
      },
      hasInconsistency,
      hasIncomplete,
    },
  };
}

export function buildDecisionExplanationMetadata(
  explanations: AdministrativeDecisionExplanation[]
): {
  decisionExplanation: {
    hasExplanation: boolean;
    totalExplanations: number;
    hasInconsistency: boolean;
    hasIncomplete: boolean;
  };
} {
  const safe = Array.isArray(explanations) ? explanations : [];
  const hasInconsistency = safe.some((e) => e.hasInconsistency);
  const hasIncomplete = safe.some((e) => e.hasIncomplete);
  return {
    decisionExplanation: {
      hasExplanation: safe.length > 0,
      totalExplanations: safe.length,
      hasInconsistency,
      hasIncomplete,
    },
  };
}

export function buildAdministrativeDocumentMetadata(
  documents: AdministrativeDocumentModel[]
): {
  document: {
    hasDocument: boolean;
    totalDocuments: number;
    hasInconsistency: boolean;
    hasIncomplete: boolean;
  };
} {
  const safe = Array.isArray(documents) ? documents : [];
  const hasInconsistency = safe.some((d) => d.hasInconsistency);
  const hasIncomplete = safe.some((d) => d.hasIncomplete);
  return {
    document: {
      hasDocument: safe.length > 0,
      totalDocuments: safe.length,
      hasInconsistency,
      hasIncomplete,
    },
  };
}

export function buildAdministrativePremiumDocumentMetadata(
  premiumDocuments: AdministrativePremiumDocument[]
): {
  premiumDocument: {
    hasPremiumDocument: boolean;
    totalPremiumDocuments: number;
    hasMissingCrossCoherenceChecks: boolean;
    sectionsWithWritingViolations: number;
  };
} {
  const safe = Array.isArray(premiumDocuments) ? premiumDocuments : [];
  const hasMissingCrossCoherenceChecks = safe.some((doc) => doc.crossCoherence.missingChecks.length > 0);
  const sectionsWithWritingViolations = safe.reduce((acc, doc) => {
    return (
      acc +
      doc.sections.filter(
        (section) => section.writingCompliance.hasProhibitedTerms || !section.writingCompliance.controlledLanguage
      ).length
    );
  }, 0);

  return {
    premiumDocument: {
      hasPremiumDocument: safe.length > 0,
      totalPremiumDocuments: safe.length,
      hasMissingCrossCoherenceChecks,
      sectionsWithWritingViolations,
    },
  };
}
