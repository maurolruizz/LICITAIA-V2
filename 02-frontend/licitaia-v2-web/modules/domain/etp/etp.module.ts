/**
 * Módulo ETP (Estudo Técnico Preliminar).
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
import { normalizeEtpPayload } from './etp.mappers';
import { validateEtpInput } from './etp.validators';
import {
  buildEtpStartedEvent,
  buildEtpValidatedEvent,
  buildEtpBlockedEvent,
  buildEtpCompletedEvent,
} from './etp.events';
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
import { appendCommonInvalidationEvents } from '../shared/module-validation-events.helper';

export async function executeEtpModule(input: ModuleInputContract): Promise<ModuleOutputContract> {
  const processId: string | undefined = input.context?.processId as string | undefined;
  const normalizedPayload = normalizeEtpPayload(input.payload ?? {});
  const extractedStructure = extractProcurementStructure(normalizedPayload);
  const objectStructureMeta = buildObjectStructureMetadata(extractedStructure);
  const extractedCalculationMemory = extractCalculationMemory(normalizedPayload);
  const extractedAdministrativeJustification = extractAdministrativeJustification(normalizedPayload);
  const extractedAdministrativeNeed = extractAdministrativeNeed(normalizedPayload);
  const extractedProcurementStrategy = extractProcurementStrategy(normalizedPayload);
  const validation = validateEtpInput(normalizedPayload);

  const events: AdministrativeEventContract[] = [
    buildEtpStartedEvent(processId),
  ];
  if (extractedStructure.structureType === 'lot') {
    events.push(buildObjectStructureLotDetectedEvent(ModuleId.ETP, objectStructureMeta, processId));
  }
  if (extractedCalculationMemory.count > 0) {
    events.push(
      buildCalculationMemoryDetectedEvent(ModuleId.ETP, {
        calculationMemoryCount: extractedCalculationMemory.count,
        calculationTypes: extractedCalculationMemory.calculationTypes,
        calculationTargets: extractedCalculationMemory.calculationTargets,
      }, processId)
    );
  }
  if (extractedAdministrativeJustification.count > 0) {
    events.push(
      buildAdministrativeJustificationDetectedEvent(ModuleId.ETP, {
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
    events.push(buildAdministrativeCoherenceIssuesDetectedEvent(ModuleId.ETP, coherenceResult, processId));
  } else {
    events.push(buildAdministrativeCoherenceValidEvent(ModuleId.ETP, processId));
  }
  if (extractedAdministrativeNeed.count > 0) {
    events.push(
      buildAdministrativeNeedDetectedEvent(ModuleId.ETP, {
        totalNeeds: extractedAdministrativeNeed.count,
        processNeedCount: extractedAdministrativeNeed.processNeedCount,
        itemNeedCount: extractedAdministrativeNeed.itemNeedCount,
        lotNeedCount: extractedAdministrativeNeed.lotNeedCount,
      }, processId)
    );
  }
  if (extractedProcurementStrategy.count > 0) {
    events.push(
      buildProcurementStrategyDetectedEvent(ModuleId.ETP, {
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
    events.push(buildAdministrativeDocumentConsistencyIssuesDetectedEvent(ModuleId.ETP, documentConsistencyResult, processId));
  } else {
    events.push(buildAdministrativeDocumentConsistencyValidEvent(ModuleId.ETP, processId));
  }

  const decisionTraces = executeAdministrativeDecisionTraceEngine({
    structure: { ...extractedStructure, moduleId: ModuleId.ETP },
    calculationMemory: extractedCalculationMemory,
    administrativeNeed: extractedAdministrativeNeed,
    administrativeJustification: extractedAdministrativeJustification,
    procurementStrategy: extractedProcurementStrategy,
    documentConsistency: documentConsistencyResult,
  });
  const decisionTraceMeta = buildDecisionTraceMetadata(decisionTraces);
  events.push(buildAdministrativeDecisionTraceGeneratedEvent(ModuleId.ETP, {
    totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
    hasInconsistency: decisionTraceMeta.decisionTrace.hasInconsistency,
    hasIncomplete: decisionTraceMeta.decisionTrace.hasIncomplete,
  }, processId));
  if (decisionTraceMeta.decisionTrace.hasIncomplete) {
    events.push(buildAdministrativeDecisionTraceIncompleteEvent(ModuleId.ETP, {
      totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
      hasIncomplete: true,
    }, processId));
  }

  const decisionExplanations = executeAdministrativeDecisionExplanationEngine(decisionTraces);
  const decisionExplanationMeta = buildDecisionExplanationMetadata(decisionExplanations);
  events.push(buildAdministrativeDecisionExplanationGeneratedEvent(ModuleId.ETP, {
    totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
    hasInconsistency: decisionExplanationMeta.decisionExplanation.hasInconsistency,
    hasIncomplete: decisionExplanationMeta.decisionExplanation.hasIncomplete,
  }, processId));
  if (decisionExplanationMeta.decisionExplanation.hasIncomplete) {
    events.push(buildAdministrativeDecisionExplanationIncompleteEvent(ModuleId.ETP, {
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
  events.push(buildAdministrativeDocumentGeneratedEvent(ModuleId.ETP, {
    totalDocuments: documentMeta.document.totalDocuments,
    hasInconsistency: documentMeta.document.hasInconsistency,
    hasIncomplete: documentMeta.document.hasIncomplete,
  }, processId));
  if (documentMeta.document.hasIncomplete) {
    events.push(buildAdministrativeDocumentIncompleteEvent(ModuleId.ETP, {
      totalDocuments: documentMeta.document.totalDocuments,
      hasIncomplete: true,
    }, processId));
  }

  let decisionMetadata: DecisionMetadataContract;
  let result: ModuleOutputContract['result'];
  let shouldHalt: boolean;

  if (validation.hasBlocking) {
    events.push(
      buildEtpBlockedEvent(
        validation.items.map((i) => i.message).join('; ') ?? 'Campos obrigatórios ausentes ou inválidos',
        { processId, payload: { validationCodes: validation.items.map((i) => i.code) } }
      )
    );
    appendCommonInvalidationEvents({
      moduleId: ModuleId.ETP,
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
      moduleId: ModuleId.ETP,
      ruleId: 'ETP_REQUIRED_FIELDS',
      rationale: 'Bloqueio por campos estruturais obrigatórios ausentes ou vazios.',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
        validationItems: validation.items.map((i) => ({ code: i.code, field: i.field })),
      },
    });
    result = createBlockedResult(
      validation.items.map((i) => i.message).join('; ') ?? 'Validação ETP bloqueou',
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else if (!validation.valid) {
    events.push(
      buildEtpBlockedEvent(
        validation.items.map((i) => i.message).join('; '),
        { processId }
      )
    );
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.ETP,
      ruleId: 'ETP_VALIDATION',
      rationale: 'Validação do ETP identificou erros.',
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
    events.push(buildEtpValidatedEvent(processId), buildEtpCompletedEvent(processId));
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.ETP,
      ruleId: 'ETP_APPROVED',
      rationale: 'Payload mínimo válido: todos os campos obrigatórios preenchidos.',
      payload: {
        blocked: false,
        approved: true,
        fieldsConsidered: Object.keys(normalizedPayload),
      },
    });
    result = createSuccessResult(
      { ...normalizedPayload, _validatedByModule: 'ETP' },
      'ETP validado'
    );
    shouldHalt = false;
  }

  return {
    moduleId: ModuleId.ETP,
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
