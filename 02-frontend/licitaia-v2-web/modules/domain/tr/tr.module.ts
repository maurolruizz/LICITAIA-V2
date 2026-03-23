/**
 * Módulo TR (Termo de Referência).
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
import { normalizeTrPayload } from './tr.mappers';
import { validateTrInput } from './tr.validators';
import {
  buildTrStartedEvent,
  buildTrValidatedEvent,
  buildTrBlockedEvent,
  buildTrCompletedEvent,
} from './tr.events';
import { extractProcurementStructure } from '../shared/object-structure.extractor';
import { extractCalculationMemory } from '../shared/calculation-memory.extractor';
import { extractAdministrativeJustification } from '../shared/administrative-justification.extractor';
import { buildObjectStructureMetadata, buildCalculationMemoryMetadata, buildAdministrativeJustificationMetadata, buildAdministrativeCoherenceMetadata, buildAdministrativeNeedMetadata, buildProcurementStrategyMetadata, buildDocumentConsistencyMetadata, buildDecisionTraceMetadata, buildDecisionExplanationMetadata, buildAdministrativeDocumentMetadata, buildAdministrativePremiumDocumentMetadata } from '../../shared/metadata/metadata-composer';
import { buildObjectStructureLotDetectedEvent, buildCalculationMemoryDetectedEvent, buildCalculationMemoryInvalidEvent, buildAdministrativeJustificationDetectedEvent, buildAdministrativeJustificationInvalidEvent, buildAdministrativeCoherenceIssuesDetectedEvent, buildAdministrativeCoherenceValidEvent, buildAdministrativeNeedDetectedEvent, buildAdministrativeNeedInvalidEvent, buildProcurementStrategyDetectedEvent, buildProcurementStrategyInvalidEvent, buildAdministrativeDocumentConsistencyValidEvent, buildAdministrativeDocumentConsistencyIssuesDetectedEvent, buildAdministrativeDecisionTraceGeneratedEvent, buildAdministrativeDecisionTraceIncompleteEvent, buildAdministrativeDecisionExplanationGeneratedEvent, buildAdministrativeDecisionExplanationIncompleteEvent, buildAdministrativeDocumentGeneratedEvent, buildAdministrativeDocumentIncompleteEvent } from '../../shared/event-builders';
import { executeAdministrativeCoherenceEngine } from '../shared/administrative-coherence.engine';
import { executeAdministrativeDocumentConsistencyEngine } from '../shared/administrative-document-consistency.engine';
import { executeAdministrativeDecisionTraceEngine } from '../shared/administrative-decision-trace.engine';
import { executeAdministrativeDecisionExplanationEngine } from '../shared/administrative-decision-explanation.engine';
import { executeAdministrativeDocumentEngine } from '../shared/administrative-document.engine';
import { executeAdministrativeDocumentPremiumEngine } from '../shared/administrative-document-premium.engine';
import { extractAdministrativeNeed } from '../shared/administrative-need.extractor';
import { extractProcurementStrategy } from '../shared/procurement-strategy.extractor';

export async function executeTrModule(input: ModuleInputContract): Promise<ModuleOutputContract> {
  const processId: string | undefined = input.context?.processId as string | undefined;
  const normalizedPayload = normalizeTrPayload(input.payload ?? {});
  const extractedStructure = extractProcurementStructure(normalizedPayload);
  const objectStructureMeta = buildObjectStructureMetadata(extractedStructure);
  const extractedCalculationMemory = extractCalculationMemory(normalizedPayload);
  const extractedAdministrativeJustification = extractAdministrativeJustification(normalizedPayload);
  const extractedAdministrativeNeed = extractAdministrativeNeed(normalizedPayload);
  const extractedProcurementStrategy = extractProcurementStrategy(normalizedPayload);
  const validation = validateTrInput(normalizedPayload);

  const events: AdministrativeEventContract[] = [
    buildTrStartedEvent(processId),
  ];
  if (extractedStructure.structureType === 'lot') {
    events.push(buildObjectStructureLotDetectedEvent(ModuleId.TR, objectStructureMeta, processId));
  }
  if (extractedCalculationMemory.count > 0) {
    events.push(
      buildCalculationMemoryDetectedEvent(ModuleId.TR, {
        calculationMemoryCount: extractedCalculationMemory.count,
        calculationTypes: extractedCalculationMemory.calculationTypes,
        calculationTargets: extractedCalculationMemory.calculationTargets,
      }, processId)
    );
  }
  if (extractedAdministrativeJustification.count > 0) {
    events.push(
      buildAdministrativeJustificationDetectedEvent(ModuleId.TR, {
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
    events.push(buildAdministrativeCoherenceIssuesDetectedEvent(ModuleId.TR, coherenceResult, processId));
  } else {
    events.push(buildAdministrativeCoherenceValidEvent(ModuleId.TR, processId));
  }
  if (extractedAdministrativeNeed.count > 0) {
    events.push(
      buildAdministrativeNeedDetectedEvent(ModuleId.TR, {
        totalNeeds: extractedAdministrativeNeed.count,
        processNeedCount: extractedAdministrativeNeed.processNeedCount,
        itemNeedCount: extractedAdministrativeNeed.itemNeedCount,
        lotNeedCount: extractedAdministrativeNeed.lotNeedCount,
      }, processId)
    );
  }
  if (extractedProcurementStrategy.count > 0) {
    events.push(
      buildProcurementStrategyDetectedEvent(ModuleId.TR, {
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
    events.push(buildAdministrativeDocumentConsistencyIssuesDetectedEvent(ModuleId.TR, documentConsistencyResult, processId));
  } else {
    events.push(buildAdministrativeDocumentConsistencyValidEvent(ModuleId.TR, processId));
  }

  const decisionTraces = executeAdministrativeDecisionTraceEngine({
    structure: { ...extractedStructure, moduleId: ModuleId.TR },
    calculationMemory: extractedCalculationMemory,
    administrativeNeed: extractedAdministrativeNeed,
    administrativeJustification: extractedAdministrativeJustification,
    procurementStrategy: extractedProcurementStrategy,
    documentConsistency: documentConsistencyResult,
  });
  const decisionTraceMeta = buildDecisionTraceMetadata(decisionTraces);
  events.push(buildAdministrativeDecisionTraceGeneratedEvent(ModuleId.TR, {
    totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
    hasInconsistency: decisionTraceMeta.decisionTrace.hasInconsistency,
    hasIncomplete: decisionTraceMeta.decisionTrace.hasIncomplete,
  }, processId));
  if (decisionTraceMeta.decisionTrace.hasIncomplete) {
    events.push(buildAdministrativeDecisionTraceIncompleteEvent(ModuleId.TR, {
      totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
      hasIncomplete: true,
    }, processId));
  }

  const decisionExplanations = executeAdministrativeDecisionExplanationEngine(decisionTraces);
  const decisionExplanationMeta = buildDecisionExplanationMetadata(decisionExplanations);
  events.push(buildAdministrativeDecisionExplanationGeneratedEvent(ModuleId.TR, {
    totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
    hasInconsistency: decisionExplanationMeta.decisionExplanation.hasInconsistency,
    hasIncomplete: decisionExplanationMeta.decisionExplanation.hasIncomplete,
  }, processId));
  if (decisionExplanationMeta.decisionExplanation.hasIncomplete) {
    events.push(buildAdministrativeDecisionExplanationIncompleteEvent(ModuleId.TR, {
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
  const premiumDocuments = executeAdministrativeDocumentPremiumEngine(administrativeDocuments);
  const premiumDocumentMeta = buildAdministrativePremiumDocumentMetadata(premiumDocuments);
  events.push(buildAdministrativeDocumentGeneratedEvent(ModuleId.TR, {
    totalDocuments: documentMeta.document.totalDocuments,
    hasInconsistency: documentMeta.document.hasInconsistency,
    hasIncomplete: documentMeta.document.hasIncomplete,
  }, processId));
  if (documentMeta.document.hasIncomplete) {
    events.push(buildAdministrativeDocumentIncompleteEvent(ModuleId.TR, {
      totalDocuments: documentMeta.document.totalDocuments,
      hasIncomplete: true,
    }, processId));
  }

  let decisionMetadata: DecisionMetadataContract;
  let result: ModuleOutputContract['result'];
  let shouldHalt: boolean;

  if (validation.hasBlocking) {
    events.push(
      buildTrBlockedEvent(
        validation.items.map((i) => i.message).join('; ') ?? 'Campos obrigatórios ausentes ou inválidos',
        { processId, payload: { validationCodes: validation.items.map((i) => i.code) } }
      )
    );
    const calculationMemoryCodes = validation.items.filter((i) => i.code.startsWith('CALCULATION_MEMORY_')).map((i) => i.code);
    if (calculationMemoryCodes.length > 0) {
      events.push(buildCalculationMemoryInvalidEvent(ModuleId.TR, { invalidCodes: calculationMemoryCodes, calculationMemoryCount: extractedCalculationMemory.count }, processId));
    }
    const administrativeJustificationCodes = validation.items.filter((i) => i.code.startsWith('ADMINISTRATIVE_JUSTIFICATION_')).map((i) => i.code);
    if (administrativeJustificationCodes.length > 0) {
      events.push(buildAdministrativeJustificationInvalidEvent(ModuleId.TR, { invalidCodes: administrativeJustificationCodes, totalJustifications: extractedAdministrativeJustification.count }, processId));
    }
    const administrativeNeedCodes = validation.items.filter((i) => i.code.startsWith('ADMINISTRATIVE_NEED_')).map((i) => i.code);
    if (administrativeNeedCodes.length > 0) {
      events.push(buildAdministrativeNeedInvalidEvent(ModuleId.TR, { invalidCodes: administrativeNeedCodes, totalNeeds: extractedAdministrativeNeed.count, issueTypes: [...new Set(administrativeNeedCodes)] }, processId));
    }
    const procurementStrategyCodes = validation.items.filter((i) => i.code.startsWith('PROCUREMENT_STRATEGY_')).map((i) => i.code);
    if (procurementStrategyCodes.length > 0) {
      events.push(buildProcurementStrategyInvalidEvent(ModuleId.TR, { totalStrategies: extractedProcurementStrategy.count, issueTypes: [...new Set(procurementStrategyCodes)] }, processId));
    }
    const documentConsistencyCodes = validation.items.filter((i) => i.code.startsWith('ADMIN_DOCUMENT_CONSISTENCY_')).map((i) => i.code);
    if (documentConsistencyCodes.length > 0) {
      events.push(buildAdministrativeDocumentConsistencyIssuesDetectedEvent(ModuleId.TR, documentConsistencyResult, processId));
    }
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.TR,
      ruleId: 'TR_REQUIRED_FIELDS',
      rationale: 'Bloqueio por campos estruturais obrigatórios ausentes ou vazios.',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
        validationItems: validation.items.map((i) => ({ code: i.code, field: i.field })),
      },
    });
    result = createBlockedResult(
      validation.items.map((i) => i.message).join('; ') ?? 'Validação TR bloqueou',
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else if (!validation.valid) {
    events.push(
      buildTrBlockedEvent(
        validation.items.map((i) => i.message).join('; '),
        { processId }
      )
    );
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.TR,
      ruleId: 'TR_VALIDATION',
      rationale: 'Validação do TR identificou erros.',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
      },
    });
    result = createFailureResult(
      validation.items.map((i) => i.message).join('; '),
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else {
    events.push(buildTrValidatedEvent(processId), buildTrCompletedEvent(processId));
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.TR,
      ruleId: 'TR_APPROVED',
      rationale: 'Payload mínimo válido: todos os campos obrigatórios preenchidos.',
      payload: {
        blocked: false,
        approved: true,
        fieldsConsidered: Object.keys(normalizedPayload),
      },
    });
    result = createSuccessResult(
      { ...normalizedPayload, _validatedByModule: 'TR' },
      'TR validado'
    );
    shouldHalt = false;
  }

  return {
    moduleId: ModuleId.TR,
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
      ...premiumDocumentMeta,
      premiumDocuments,
    },
  };
}
