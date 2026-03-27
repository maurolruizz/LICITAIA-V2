/**
 * Módulo Pricing (Precificação).
 * Implementação real inicial: payload tipado, validações, eventos e metadados de decisão.
 */

import type { ModuleInputContract } from '../../core/contracts/module-input.contract';
import type { ModuleOutputContract } from '../../core/contracts/module-output.contract';
import type { DecisionMetadataContract } from '../../core/contracts/decision-metadata.contract';
import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { DecisionOrigin } from '../../core/enums/decision-origin.enum';
import { createSuccessResult, createFailureResult, createBlockedResult } from '../../core/factories/module-result.factory';
import { createDecisionMetadata } from '../../core/factories/decision-metadata.factory';
import { normalizePricingPayload } from './pricing.mappers';
import { validatePricingInput } from './pricing.validators';
import {
  buildPricingStartedEvent,
  buildPricingValidatedEvent,
  buildPricingBlockedEvent,
  buildPricingCompletedEvent,
} from './pricing.events';
import { extractProcurementStructure } from '../shared/object-structure.extractor';
import { extractCalculationMemory } from '../shared/calculation-memory.extractor';
import { extractAdministrativeJustification } from '../shared/administrative-justification.extractor';
import { buildObjectStructureMetadata, buildCalculationMemoryMetadata, buildAdministrativeJustificationMetadata, buildAdministrativeCoherenceMetadata, buildAdministrativeNeedMetadata, buildProcurementStrategyMetadata, buildDocumentConsistencyMetadata, buildDecisionTraceMetadata, buildDecisionExplanationMetadata, buildAdministrativeDocumentMetadata } from '../../shared/metadata/metadata-composer';
import { buildObjectStructureLotDetectedEvent, buildCalculationMemoryDetectedEvent, buildCalculationMemoryInvalidEvent, buildAdministrativeJustificationDetectedEvent, buildAdministrativeJustificationInvalidEvent, buildAdministrativeCoherenceIssuesDetectedEvent, buildAdministrativeCoherenceValidEvent, buildAdministrativeNeedDetectedEvent, buildAdministrativeNeedInvalidEvent, buildProcurementStrategyDetectedEvent, buildProcurementStrategyInvalidEvent, buildAdministrativeDocumentConsistencyValidEvent, buildAdministrativeDocumentConsistencyIssuesDetectedEvent, buildAdministrativeDecisionTraceGeneratedEvent, buildAdministrativeDecisionTraceIncompleteEvent, buildAdministrativeDecisionExplanationGeneratedEvent, buildAdministrativeDecisionExplanationIncompleteEvent, buildAdministrativeDocumentGeneratedEvent, buildAdministrativeDocumentIncompleteEvent } from '../../shared/event-builders';
import { executeAdministrativeCoherenceEngine } from '../shared/administrative-coherence.engine';
import { executeAdministrativeDocumentConsistencyEngine } from '../shared/administrative-document-consistency.engine';
import { executeAdministrativeDecisionTraceEngine } from '../shared/administrative-decision-trace.engine';
import { executeAdministrativeDecisionExplanationEngine } from '../shared/administrative-decision-explanation.engine';
import { executeAdministrativeDocumentEngine } from '../shared/administrative-document.engine';
import { extractAdministrativeNeed } from '../shared/administrative-need.extractor';
import { extractProcurementStrategy } from '../shared/procurement-strategy.extractor';
import { appendCommonInvalidationEvents } from '../shared/module-validation-events.helper';

function getReferenceValuesConsidered(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    estimatedUnitValue: payload.estimatedUnitValue,
    estimatedTotalValue: payload.estimatedTotalValue,
  };
}

export async function executePricingModule(input: ModuleInputContract): Promise<ModuleOutputContract> {
  const processId: string | undefined = input.context?.processId as string | undefined;
  const normalizedPayload = normalizePricingPayload(input.payload ?? {});
  const extractedStructure = extractProcurementStructure(normalizedPayload);
  const objectStructureMeta = buildObjectStructureMetadata(extractedStructure);
  const extractedCalculationMemory = extractCalculationMemory(normalizedPayload);
  const extractedAdministrativeJustification = extractAdministrativeJustification(normalizedPayload);
  const extractedAdministrativeNeed = extractAdministrativeNeed(normalizedPayload);
  const extractedProcurementStrategy = extractProcurementStrategy(normalizedPayload);
  const validation = validatePricingInput(normalizedPayload);

  const events: AdministrativeEventContract[] = [
    buildPricingStartedEvent(processId),
  ];
  if (extractedStructure.structureType === 'lot') {
    events.push(buildObjectStructureLotDetectedEvent(ModuleId.PRICING, objectStructureMeta, processId));
  }
  if (extractedCalculationMemory.count > 0) {
    events.push(
      buildCalculationMemoryDetectedEvent(ModuleId.PRICING, {
        calculationMemoryCount: extractedCalculationMemory.count,
        calculationTypes: extractedCalculationMemory.calculationTypes,
        calculationTargets: extractedCalculationMemory.calculationTargets,
      }, processId)
    );
  }
  if (extractedAdministrativeJustification.count > 0) {
    events.push(
      buildAdministrativeJustificationDetectedEvent(ModuleId.PRICING, {
        totalJustifications: extractedAdministrativeJustification.count,
        processJustificationCount: extractedAdministrativeJustification.processJustificationCount,
        itemJustificationCount: extractedAdministrativeJustification.itemJustificationCount,
        lotJustificationCount: extractedAdministrativeJustification.lotJustificationCount,
        withLegalBasisCount: extractedAdministrativeJustification.withLegalBasisCount,
      }, processId)
    );
  }

  const coherenceResult = executeAdministrativeCoherenceEngine(
    extractedStructure,
    extractedCalculationMemory,
    extractedAdministrativeJustification
  );
  if (coherenceResult.hasCoherenceIssues) {
    events.push(buildAdministrativeCoherenceIssuesDetectedEvent(ModuleId.PRICING, coherenceResult, processId));
  } else {
    events.push(buildAdministrativeCoherenceValidEvent(ModuleId.PRICING, processId));
  }
  if (extractedAdministrativeNeed.count > 0) {
    events.push(
      buildAdministrativeNeedDetectedEvent(ModuleId.PRICING, {
        totalNeeds: extractedAdministrativeNeed.count,
        processNeedCount: extractedAdministrativeNeed.processNeedCount,
        itemNeedCount: extractedAdministrativeNeed.itemNeedCount,
        lotNeedCount: extractedAdministrativeNeed.lotNeedCount,
      }, processId)
    );
  }
  if (extractedProcurementStrategy.count > 0) {
    events.push(
      buildProcurementStrategyDetectedEvent(ModuleId.PRICING, {
        totalStrategies: extractedProcurementStrategy.count,
        processStrategyCount: extractedProcurementStrategy.processStrategyCount,
        itemStrategyCount: extractedProcurementStrategy.itemStrategyCount,
        lotStrategyCount: extractedProcurementStrategy.lotStrategyCount,
      }, processId)
    );
  }

  const documentConsistencyResult = executeAdministrativeDocumentConsistencyEngine(
    extractedStructure,
    extractedCalculationMemory,
    extractedAdministrativeNeed,
    extractedAdministrativeJustification,
    extractedProcurementStrategy
  );
  if (documentConsistencyResult.hasIssues) {
    events.push(buildAdministrativeDocumentConsistencyIssuesDetectedEvent(ModuleId.PRICING, documentConsistencyResult, processId));
  } else {
    events.push(buildAdministrativeDocumentConsistencyValidEvent(ModuleId.PRICING, processId));
  }

  const decisionTraces = executeAdministrativeDecisionTraceEngine({
    structure: { ...extractedStructure, moduleId: ModuleId.PRICING },
    calculationMemory: extractedCalculationMemory,
    administrativeNeed: extractedAdministrativeNeed,
    administrativeJustification: extractedAdministrativeJustification,
    procurementStrategy: extractedProcurementStrategy,
    documentConsistency: documentConsistencyResult,
  });
  const decisionTraceMeta = buildDecisionTraceMetadata(decisionTraces);
  events.push(buildAdministrativeDecisionTraceGeneratedEvent(ModuleId.PRICING, {
    totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
    hasInconsistency: decisionTraceMeta.decisionTrace.hasInconsistency,
    hasIncomplete: decisionTraceMeta.decisionTrace.hasIncomplete,
  }, processId));
  if (decisionTraceMeta.decisionTrace.hasIncomplete) {
    events.push(buildAdministrativeDecisionTraceIncompleteEvent(ModuleId.PRICING, {
      totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
      hasIncomplete: true,
    }, processId));
  }

  const decisionExplanations = executeAdministrativeDecisionExplanationEngine(decisionTraces);
  const decisionExplanationMeta = buildDecisionExplanationMetadata(decisionExplanations);
  events.push(buildAdministrativeDecisionExplanationGeneratedEvent(ModuleId.PRICING, {
    totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
    hasInconsistency: decisionExplanationMeta.decisionExplanation.hasInconsistency,
    hasIncomplete: decisionExplanationMeta.decisionExplanation.hasIncomplete,
  }, processId));
  if (decisionExplanationMeta.decisionExplanation.hasIncomplete) {
    events.push(buildAdministrativeDecisionExplanationIncompleteEvent(ModuleId.PRICING, {
      totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
      hasIncomplete: true,
    }, processId));
  }

  const administrativeDocuments = executeAdministrativeDocumentEngine(
    decisionTraces,
    decisionExplanations,
    normalizedPayload
  );
  const documentMeta = buildAdministrativeDocumentMetadata(administrativeDocuments);
  events.push(buildAdministrativeDocumentGeneratedEvent(ModuleId.PRICING, {
    totalDocuments: documentMeta.document.totalDocuments,
    hasInconsistency: documentMeta.document.hasInconsistency,
    hasIncomplete: documentMeta.document.hasIncomplete,
  }, processId));
  if (documentMeta.document.hasIncomplete) {
    events.push(buildAdministrativeDocumentIncompleteEvent(ModuleId.PRICING, {
      totalDocuments: documentMeta.document.totalDocuments,
      hasIncomplete: true,
    }, processId));
  }

  let decisionMetadata: DecisionMetadataContract;
  let result: ModuleOutputContract['result'];
  let shouldHalt: boolean;
  const referenceValuesConsidered = getReferenceValuesConsidered(normalizedPayload);

  if (validation.hasBlocking) {
    events.push(
      buildPricingBlockedEvent(
        validation.items.map((i) => i.message).join('; ') ?? 'Campos obrigatórios ausentes, inválidos ou valores inválidos',
        { processId, payload: { validationCodes: validation.items.map((i) => i.code) } }
      )
    );
    appendCommonInvalidationEvents({
      moduleId: ModuleId.PRICING,
      validationItems: validation.items,
      counts: {
        calculationMemoryCount: extractedCalculationMemory.count,
        totalJustifications: extractedAdministrativeJustification.count,
        totalNeeds: extractedAdministrativeNeed.count,
        totalStrategies: extractedProcurementStrategy.count,
      },
      documentConsistencyResult,
      processId,
      events,
    });
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.PRICING,
      ruleId: 'PRICING_REQUIRED_FIELDS',
      rationale: 'Bloqueio por campos estruturais obrigatórios ausentes, vazios ou valores inválidos (devem ser > 0).',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
        referenceValuesConsidered,
        validationItems: validation.items.map((i) => ({ code: i.code, field: i.field })),
      },
    });
    result = createBlockedResult(
      validation.items.map((i) => i.message).join('; ') ?? 'Validação Pricing bloqueou',
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else if (!validation.valid) {
    events.push(
      buildPricingBlockedEvent(
        validation.items.map((i) => i.message).join('; '),
        { processId }
      )
    );
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.PRICING,
      ruleId: 'PRICING_VALIDATION',
      rationale: 'Validação do Pricing identificou erros.',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
        referenceValuesConsidered,
      },
    });
    result = createFailureResult(
      validation.items.map((i) => i.message).join('; '),
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else {
    events.push(buildPricingValidatedEvent(processId), buildPricingCompletedEvent(processId));
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.PRICING,
      ruleId: 'PRICING_APPROVED',
      rationale: 'Payload mínimo válido: todos os campos obrigatórios preenchidos e valores > 0.',
      payload: {
        blocked: false,
        approved: true,
        fieldsConsidered: Object.keys(normalizedPayload),
        referenceValuesConsidered,
      },
    });
    result = createSuccessResult(
      {
        ...normalizedPayload,
        referenceValuesConsidered,
        _validatedByModule: 'PRICING',
      },
      'Pricing validado'
    );
    shouldHalt = false;
  }

  return {
    moduleId: ModuleId.PRICING,
    result,
    shouldHalt,
    events,
    metadata: {
      decisionMetadata,
      validations: validation.items,
      ...objectStructureMeta,
      ...buildCalculationMemoryMetadata(extractedCalculationMemory),
      ...buildAdministrativeJustificationMetadata(extractedAdministrativeJustification),
      ...buildAdministrativeCoherenceMetadata(coherenceResult),
      ...buildAdministrativeNeedMetadata(extractedAdministrativeNeed, extractedStructure),
      ...buildProcurementStrategyMetadata(extractedProcurementStrategy, extractedStructure),
      ...buildDocumentConsistencyMetadata(documentConsistencyResult),
      ...decisionTraceMeta,
      ...decisionExplanationMeta,
      ...documentMeta,
    },
  };
}
