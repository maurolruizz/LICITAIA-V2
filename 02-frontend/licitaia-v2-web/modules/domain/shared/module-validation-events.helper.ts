import type { AdministrativeEventContract } from '../../core/contracts/event.contract';
import type { ModuleId } from '../../core/enums/module-id.enum';
import { buildCalculationMemoryInvalidEvent, buildAdministrativeJustificationInvalidEvent, buildAdministrativeNeedInvalidEvent, buildProcurementStrategyInvalidEvent, buildAdministrativeDocumentConsistencyIssuesDetectedEvent } from '../../shared/event-builders';
import type { AdministrativeDocumentConsistencyResult } from './administrative-document-consistency.types';

interface ValidationLike {
  code: string;
}

interface Counts {
  calculationMemoryCount: number;
  totalJustifications: number;
  totalNeeds: number;
  totalStrategies: number;
}

export function appendCommonInvalidationEvents(params: {
  moduleId: ModuleId;
  validationItems: ValidationLike[];
  counts: Counts;
  documentConsistencyResult: AdministrativeDocumentConsistencyResult;
  processId?: string;
  events: AdministrativeEventContract[];
}): void {
  const { moduleId, validationItems, counts, documentConsistencyResult, processId, events } = params;

  const calculationMemoryCodes = validationItems
    .filter((i) => i.code.startsWith('CALCULATION_MEMORY_'))
    .map((i) => i.code);
  if (calculationMemoryCodes.length > 0) {
    events.push(
      buildCalculationMemoryInvalidEvent(
        moduleId,
        {
          invalidCodes: calculationMemoryCodes,
          calculationMemoryCount: counts.calculationMemoryCount,
        },
        processId
      )
    );
  }

  const administrativeJustificationCodes = validationItems
    .filter((i) => i.code.startsWith('ADMINISTRATIVE_JUSTIFICATION_'))
    .map((i) => i.code);
  if (administrativeJustificationCodes.length > 0) {
    events.push(
      buildAdministrativeJustificationInvalidEvent(
        moduleId,
        {
          invalidCodes: administrativeJustificationCodes,
          totalJustifications: counts.totalJustifications,
        },
        processId
      )
    );
  }

  const administrativeNeedCodes = validationItems
    .filter((i) => i.code.startsWith('ADMINISTRATIVE_NEED_'))
    .map((i) => i.code);
  if (administrativeNeedCodes.length > 0) {
    events.push(
      buildAdministrativeNeedInvalidEvent(
        moduleId,
        {
          invalidCodes: administrativeNeedCodes,
          totalNeeds: counts.totalNeeds,
          issueTypes: [...new Set(administrativeNeedCodes)],
        },
        processId
      )
    );
  }

  const procurementStrategyCodes = validationItems
    .filter((i) => i.code.startsWith('PROCUREMENT_STRATEGY_'))
    .map((i) => i.code);
  if (procurementStrategyCodes.length > 0) {
    events.push(
      buildProcurementStrategyInvalidEvent(
        moduleId,
        {
          totalStrategies: counts.totalStrategies,
          issueTypes: [...new Set(procurementStrategyCodes)],
        },
        processId
      )
    );
  }

  const documentConsistencyCodes = validationItems
    .filter((i) => i.code.startsWith('ADMIN_DOCUMENT_CONSISTENCY_'))
    .map((i) => i.code);
  if (documentConsistencyCodes.length > 0) {
    events.push(
      buildAdministrativeDocumentConsistencyIssuesDetectedEvent(
        moduleId,
        documentConsistencyResult,
        processId
      )
    );
  }
}

