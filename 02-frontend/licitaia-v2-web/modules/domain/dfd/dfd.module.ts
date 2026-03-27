/**
 * Módulo DFD (Demanda de Fornecimento / Documento de Formalização).
 * Implementação real inicial: payload tipado, validações, eventos e metadados de decisão.
 */

import type { ModuleInputContract } from '../../core/contracts/module-input.contract';
import type { ModuleOutputContract } from '../../core/contracts/module-output.contract';
import type { DecisionMetadataContract } from '../../core/contracts/decision-metadata.contract';
import { ModuleId } from '../../core/enums/module-id.enum';
import { DecisionOrigin } from '../../core/enums/decision-origin.enum';
import { createSuccessResult, createFailureResult, createBlockedResult } from '../../core/factories/module-result.factory';
import { createDecisionMetadata } from '../../core/factories/decision-metadata.factory';
import { normalizeDfdPayload } from './dfd.mappers';
import { validateDfdInput } from './dfd.validators';
import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
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
import {
  buildDfdStartedEvent,
  buildDfdValidatedEvent,
  buildDfdBlockedEvent,
  buildDfdCompletedEvent,
} from './dfd.events';

export async function executeDfdModule(input: ModuleInputContract): Promise<ModuleOutputContract> {
  const processId: string | undefined = input.context?.processId as string | undefined;
  const normalizedPayload = normalizeDfdPayload(input.payload ?? {});
  const extractedStructure = extractProcurementStructure(normalizedPayload);
  const objectStructureMeta = buildObjectStructureMetadata(extractedStructure);
  const extractedCalculationMemory = extractCalculationMemory(normalizedPayload);
  const extractedAdministrativeJustification = extractAdministrativeJustification(normalizedPayload);
  const extractedAdministrativeNeed = extractAdministrativeNeed(normalizedPayload);
  const extractedProcurementStrategy = extractProcurementStrategy(normalizedPayload);
  const validation = validateDfdInput(normalizedPayload);

  const events: AdministrativeEventContract[] = [
    buildDfdStartedEvent(processId),
  ];
  if (extractedStructure.structureType === 'lot') {
    events.push(buildObjectStructureLotDetectedEvent(ModuleId.DFD, objectStructureMeta, processId));
  }
  if (extractedCalculationMemory.count > 0) {
    events.push(
      buildCalculationMemoryDetectedEvent(ModuleId.DFD, {
        calculationMemoryCount: extractedCalculationMemory.count,
        calculationTypes: extractedCalculationMemory.calculationTypes,
        calculationTargets: extractedCalculationMemory.calculationTargets,
      }, processId)
    );
  }
  if (extractedAdministrativeJustification.count > 0) {
    events.push(
      buildAdministrativeJustificationDetectedEvent(ModuleId.DFD, {
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
    events.push(buildAdministrativeCoherenceIssuesDetectedEvent(ModuleId.DFD, coherenceResult, processId));
  } else {
    events.push(buildAdministrativeCoherenceValidEvent(ModuleId.DFD, processId));
  }
  if (extractedAdministrativeNeed.count > 0) {
    events.push(
      buildAdministrativeNeedDetectedEvent(ModuleId.DFD, {
        totalNeeds: extractedAdministrativeNeed.count,
        processNeedCount: extractedAdministrativeNeed.processNeedCount,
        itemNeedCount: extractedAdministrativeNeed.itemNeedCount,
        lotNeedCount: extractedAdministrativeNeed.lotNeedCount,
      }, processId)
    );
  }
  if (extractedProcurementStrategy.count > 0) {
    events.push(
      buildProcurementStrategyDetectedEvent(ModuleId.DFD, {
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
    events.push(buildAdministrativeDocumentConsistencyIssuesDetectedEvent(ModuleId.DFD, documentConsistencyResult, processId));
  } else {
    events.push(buildAdministrativeDocumentConsistencyValidEvent(ModuleId.DFD, processId));
  }

  const decisionTraces = executeAdministrativeDecisionTraceEngine({
    structure: { ...extractedStructure, moduleId: ModuleId.DFD },
    calculationMemory: extractedCalculationMemory,
    administrativeNeed: extractedAdministrativeNeed,
    administrativeJustification: extractedAdministrativeJustification,
    procurementStrategy: extractedProcurementStrategy,
    documentConsistency: documentConsistencyResult,
  });
  const decisionTraceMeta = buildDecisionTraceMetadata(decisionTraces);
  events.push(buildAdministrativeDecisionTraceGeneratedEvent(ModuleId.DFD, {
    totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
    hasInconsistency: decisionTraceMeta.decisionTrace.hasInconsistency,
    hasIncomplete: decisionTraceMeta.decisionTrace.hasIncomplete,
  }, processId));
  if (decisionTraceMeta.decisionTrace.hasIncomplete) {
    events.push(buildAdministrativeDecisionTraceIncompleteEvent(ModuleId.DFD, {
      totalTraces: decisionTraceMeta.decisionTrace.totalTraces,
      hasIncomplete: true,
    }, processId));
  }

  const decisionExplanations = executeAdministrativeDecisionExplanationEngine(decisionTraces);
  const decisionExplanationMeta = buildDecisionExplanationMetadata(decisionExplanations);
  events.push(buildAdministrativeDecisionExplanationGeneratedEvent(ModuleId.DFD, {
    totalExplanations: decisionExplanationMeta.decisionExplanation.totalExplanations,
    hasInconsistency: decisionExplanationMeta.decisionExplanation.hasInconsistency,
    hasIncomplete: decisionExplanationMeta.decisionExplanation.hasIncomplete,
  }, processId));
  if (decisionExplanationMeta.decisionExplanation.hasIncomplete) {
    events.push(buildAdministrativeDecisionExplanationIncompleteEvent(ModuleId.DFD, {
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
  events.push(buildAdministrativeDocumentGeneratedEvent(ModuleId.DFD, {
    totalDocuments: documentMeta.document.totalDocuments,
    hasInconsistency: documentMeta.document.hasInconsistency,
    hasIncomplete: documentMeta.document.hasIncomplete,
  }, processId));
  if (documentMeta.document.hasIncomplete) {
    events.push(buildAdministrativeDocumentIncompleteEvent(ModuleId.DFD, {
      totalDocuments: documentMeta.document.totalDocuments,
      hasIncomplete: true,
    }, processId));
  }

  let decisionMetadata: DecisionMetadataContract;
  let result: ModuleOutputContract['result'];
  let shouldHalt: boolean;

  if (validation.hasBlocking) {
    events.push(
      buildDfdBlockedEvent(
        validation.items.map((i) => i.message).join('; ') ?? 'Campos obrigatórios ausentes ou inválidos',
        { processId, payload: { validationCodes: validation.items.map((i) => i.code) } }
      )
    );
    appendCommonInvalidationEvents({
      moduleId: ModuleId.DFD,
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
      moduleId: ModuleId.DFD,
      ruleId: 'DFD_REQUIRED_FIELDS',
      rationale: 'Bloqueio por campos estruturais obrigatórios ausentes ou vazios.',
      payload: {
        blocked: true,
        approved: false,
        fieldsConsidered: Object.keys(normalizedPayload),
        validationItems: validation.items.map((i) => ({ code: i.code, field: i.field })),
      },
    });
    result = createBlockedResult(
      validation.items.map((i) => i.message).join('; ') ?? 'Validação DFD bloqueou',
      validation.items.map((i) => i.code)
    );
    shouldHalt = true;
  } else if (!validation.valid) {
    events.push(
      buildDfdBlockedEvent(
        validation.items.map((i) => i.message).join('; '),
        { processId }
      )
    );
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.DFD,
      ruleId: 'DFD_VALIDATION',
      rationale: 'Validação do DFD identificou erros.',
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
    events.push(buildDfdValidatedEvent(processId), buildDfdCompletedEvent(processId));
    decisionMetadata = createDecisionMetadata(DecisionOrigin.MODULE, {
      moduleId: ModuleId.DFD,
      ruleId: 'DFD_APPROVED',
      rationale: 'Payload mínimo válido: todos os campos obrigatórios preenchidos.',
      payload: {
        blocked: false,
        approved: true,
        fieldsConsidered: Object.keys(normalizedPayload),
      },
    });
    result = createSuccessResult(
      { ...normalizedPayload, _validatedByModule: 'DFD' },
      'DFD validado'
    );
    shouldHalt = false;
  }

  return {
    moduleId: ModuleId.DFD,
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
