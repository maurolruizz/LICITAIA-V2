"use strict";
/**
 * Compositor de metadados de decisão para auditoria.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeMetadata = composeMetadata;
exports.mergeMetadataList = mergeMetadataList;
exports.buildObjectStructureMetadata = buildObjectStructureMetadata;
exports.buildCalculationMemoryMetadata = buildCalculationMemoryMetadata;
exports.buildAdministrativeJustificationMetadata = buildAdministrativeJustificationMetadata;
exports.buildAdministrativeCoherenceMetadata = buildAdministrativeCoherenceMetadata;
exports.buildAdministrativeNeedMetadata = buildAdministrativeNeedMetadata;
exports.buildProcurementStrategyMetadata = buildProcurementStrategyMetadata;
exports.buildDocumentConsistencyMetadata = buildDocumentConsistencyMetadata;
exports.buildDecisionTraceMetadata = buildDecisionTraceMetadata;
exports.buildDecisionExplanationMetadata = buildDecisionExplanationMetadata;
exports.buildAdministrativeDocumentMetadata = buildAdministrativeDocumentMetadata;
exports.buildAdministrativePremiumDocumentMetadata = buildAdministrativePremiumDocumentMetadata;
function composeMetadata(base, extra) {
    return {
        ...base,
        ...extra,
        payload: { ...(base.payload ?? {}), ...(extra.payload ?? {}) },
    };
}
function mergeMetadataList(items) {
    return items.reduce((acc, item) => {
        if (item.payload) {
            return { ...acc, ...item.payload };
        }
        return acc;
    }, {});
}
function buildObjectStructureMetadata(extracted) {
    return {
        objectStructureType: extracted.structureType,
        lotCount: extracted.lotCount,
        itemCount: extracted.itemCount,
    };
}
function buildCalculationMemoryMetadata(extracted) {
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
function buildAdministrativeJustificationMetadata(extracted) {
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
function buildAdministrativeCoherenceMetadata(coherenceResult) {
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
function countObjectWithoutNeed(extractedNeed, extractedStructure) {
    const needItemIds = new Set();
    const needLotIds = new Set();
    for (const e of extractedNeed.entries) {
        if (e.targetType === 'item' && e.targetId)
            needItemIds.add(String(e.targetId).trim());
        if (e.targetType === 'lot' && e.targetId)
            needLotIds.add(String(e.targetId).trim());
    }
    let count = 0;
    if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
        for (const item of extractedStructure.structure.items) {
            if (!needItemIds.has(item.id))
                count++;
        }
    }
    if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
        for (const lot of extractedStructure.structure.lots) {
            if (!needLotIds.has(lot.id))
                count++;
        }
    }
    return count;
}
function buildAdministrativeNeedMetadata(extractedNeed, extractedStructure) {
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
function countObjectWithoutStrategy(extractedStrategy, extractedStructure) {
    const strategyItemIds = new Set();
    const strategyLotIds = new Set();
    for (const e of extractedStrategy.entries) {
        if (e.targetType === 'item' && e.targetId)
            strategyItemIds.add(String(e.targetId).trim());
        if (e.targetType === 'lot' && e.targetId)
            strategyLotIds.add(String(e.targetId).trim());
    }
    let count = 0;
    if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
        for (const item of extractedStructure.structure.items) {
            if (!strategyItemIds.has(item.id))
                count++;
        }
    }
    if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
        for (const lot of extractedStructure.structure.lots) {
            if (!strategyLotIds.has(lot.id))
                count++;
        }
    }
    return count;
}
function buildProcurementStrategyMetadata(extractedStrategy, extractedStructure) {
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
function buildDocumentConsistencyMetadata(result) {
    return {
        documentConsistency: {
            hasIssues: result.hasIssues,
            totalIssues: result.totalIssues,
            blockingIssues: result.blockingIssues,
            warningIssues: result.warningIssues,
        },
    };
}
function buildDecisionTraceMetadata(traces) {
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
function buildDecisionExplanationMetadata(explanations) {
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
function buildAdministrativeDocumentMetadata(documents) {
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
function buildAdministrativePremiumDocumentMetadata(premiumDocuments) {
    const safe = Array.isArray(premiumDocuments) ? premiumDocuments : [];
    const hasMissingCrossCoherenceChecks = safe.some((doc) => doc.crossCoherence.missingChecks.length > 0);
    const sectionsWithWritingViolations = safe.reduce((acc, doc) => {
        return (acc +
            doc.sections.filter((section) => section.writingCompliance.hasProhibitedTerms || !section.writingCompliance.controlledLanguage).length);
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
