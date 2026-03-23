import type { ModuleOutputContract } from '../../../core/contracts/module-output.contract';
import type { ValidationItemContract } from '../../../core/contracts/validation.contract';
import type { AdministrativeEventContract } from '../../../core/contracts/event.contract';
import type { DecisionMetadataContract } from '../../../core/contracts/decision-metadata.contract';
import { ModuleId } from '../../../core/enums/module-id.enum';
import { EventType } from '../../../core/enums/event-type.enum';
import { DecisionOrigin } from '../../../core/enums/decision-origin.enum';
import { ValidationSeverity } from '../../../core/enums/validation-severity.enum';
import { createAdministrativeEvent } from '../../../core/factories/administrative-event.factory';
import { createDecisionMetadata } from '../../../core/factories/decision-metadata.factory';
import {
  evaluateLegalJustificationStrength,
  evaluateLegalObjectGenericity,
  evaluateLegalObjectJustificationCoherence,
  evaluateRegimeLegalBasisCompliance,
  getModuleLegalConfig,
  getLegalText,
} from './legal-validation-rules';

export interface LegalValidationResult {
  validationItems: ValidationItemContract[];
  events: AdministrativeEventContract[];
  decisionMetadata: DecisionMetadataContract[];
  hasBlocking: boolean;
}

type LegalDataSource = 'output.result.data' | 'processSnapshot' | 'none';

interface LegalEvaluationData {
  rawData: Record<string, unknown>;
  objectTexts: string[];
  justificationTexts: string[];
  dataSourceUsed: LegalDataSource;
  fieldSources: Record<string, LegalDataSource>;
}

function extractLegalEvaluationData(
  moduleId: ModuleId,
  output: ModuleOutputContract,
  processSnapshot: Record<string, unknown>
): LegalEvaluationData {
  const resultData = output?.result?.data;
  const safeResultData =
    resultData && typeof resultData === 'object' && !Array.isArray(resultData)
      ? (resultData as Record<string, unknown>)
      : {};

  const safeProcessSnapshot =
    processSnapshot && typeof processSnapshot === 'object' && !Array.isArray(processSnapshot)
      ? processSnapshot
      : {};

  const cfg = getModuleLegalConfig(moduleId);

  if (!cfg) {
    return {
      rawData: safeResultData,
      objectTexts: [],
      justificationTexts: [],
      dataSourceUsed: Object.keys(safeResultData).length
        ? 'output.result.data'
        : Object.keys(safeProcessSnapshot).length
        ? 'processSnapshot'
        : 'none',
      fieldSources: {},
    };
  }

  const mergedData: Record<string, unknown> = { ...safeResultData };
  const fieldSources: Record<string, LegalDataSource> = {};

  const pickFieldValue = (field: string): string => {
    const fromResultText = getLegalText(safeResultData[field]);
    if (fromResultText) {
      mergedData[field] = fromResultText;
      fieldSources[field] = 'output.result.data';
      return fromResultText;
    }

    const fromSnapshotText = getLegalText(safeProcessSnapshot[field]);
    if (fromSnapshotText) {
      mergedData[field] = fromSnapshotText;
      fieldSources[field] = 'processSnapshot';
      return fromSnapshotText;
    }

    fieldSources[field] = 'none';
    return '';
  };

  const objectTexts: string[] = [];
  for (const fieldCfg of cfg.objectFields) {
    const t = pickFieldValue(fieldCfg.field);
    if (t) objectTexts.push(t);
  }

  const justificationTexts: string[] = [];
  for (const fieldCfg of cfg.justificationFields) {
    const t = pickFieldValue(fieldCfg.field);
    if (t) justificationTexts.push(t);
  }

  const dataSourceUsed: LegalDataSource =
    Object.values(fieldSources).includes('output.result.data')
      ? 'output.result.data'
      : Object.values(fieldSources).includes('processSnapshot')
      ? 'processSnapshot'
      : 'none';

  return {
    rawData: mergedData,
    objectTexts,
    justificationTexts,
    dataSourceUsed,
    fieldSources,
  };
}

function buildLegalTracePayload(
  moduleId: ModuleId,
  items: ValidationItemContract[],
  evaluationData: LegalEvaluationData
): Record<string, unknown> | undefined {
  if (items.length === 0) return undefined;

  const hasBlocking = items.some((i) => i.severity === ValidationSeverity.BLOCK);
  const primaryBlocking = items.find((i) => i.severity === ValidationSeverity.BLOCK);
  const primary = primaryBlocking ?? items[0]!;

  let result: 'BLOCK' | 'WARNING' | 'INFO' = 'INFO';
  if (hasBlocking) {
    result = 'BLOCK';
  } else if (items.some((i) => i.severity === ValidationSeverity.WARNING)) {
    result = 'WARNING';
  }

  const objectCombined = evaluationData.objectTexts.join(' ').trim();
  const justificationCombined = evaluationData.justificationTexts.join(' ').trim();

  const evidence: Record<string, unknown> = {
    objectTexts: evaluationData.objectTexts,
    justificationTexts: evaluationData.justificationTexts,
    objectLength: objectCombined.length,
    justificationLength: justificationCombined.length,
    validationItemCodes: items.map((i) => i.code),
    blockingCodes: items.filter((i) => i.severity === ValidationSeverity.BLOCK).map((i) => i.code),
    fieldSources: evaluationData.fieldSources,
  };

  return {
    ruleId: primary.code,
    moduleId,
    result,
    dataSourceUsed: evaluationData.dataSourceUsed,
    evidence,
  };
}

export function validateLegalStructure(
  moduleId: ModuleId,
  output: ModuleOutputContract,
  processSnapshot: Record<string, unknown>,
  processId?: string
): LegalValidationResult {
  // Motor jurídico apenas para módulos do pipeline principal.
  if (!Object.values(ModuleId).includes(moduleId)) {
    return {
      validationItems: [],
      events: [],
      decisionMetadata: [],
      hasBlocking: false,
    };
  }

  const evaluationData = extractLegalEvaluationData(moduleId, output, processSnapshot);
  const data = evaluationData.rawData;

  const items: ValidationItemContract[] = [];
  items.push(...evaluateLegalObjectGenericity(moduleId, data));
  items.push(...evaluateLegalJustificationStrength(moduleId, data));
  items.push(...evaluateLegalObjectJustificationCoherence(moduleId, data));
  items.push(...evaluateRegimeLegalBasisCompliance(moduleId, processSnapshot, data));

  if (items.length === 0) {
    return {
      validationItems: [],
      events: [],
      decisionMetadata: [],
      hasBlocking: false,
    };
  }

  const hasBlocking = items.some((i) => i.severity === ValidationSeverity.BLOCK);
  const blockingItem = items.find((i) => i.severity === ValidationSeverity.BLOCK);
  const severity = blockingItem?.severity ?? items[0]!.severity;

  const message = hasBlocking
    ? `Validação jurídica: inconsistência estrutural detectada no módulo ${moduleId}.`
    : `Validação jurídica: ${items.length} apontamento(s) estrutural(is) no módulo ${moduleId}.`;

  const events: AdministrativeEventContract[] = [
    createAdministrativeEvent(
      EventType.VALIDATION,
      moduleId,
      'LEGAL_VALIDATION_CHECK',
      message,
      {
        processId,
        payload: {
          moduleId,
          itemCount: items.length,
          hasBlocking,
          itemCodes: items.map((i) => i.code),
        },
      }
    ),
  ];

  const legalTrace = buildLegalTracePayload(moduleId, items, evaluationData);

  const decisionMetadata: DecisionMetadataContract[] = [
    createDecisionMetadata(DecisionOrigin.RULE, {
      moduleId,
      ruleId: 'LEGAL_VALIDATION_STRUCTURAL',
      rationale:
        'Aplicação de regras jurídicas estruturais mínimas sobre objeto e justificativas, sem uso de IA ou NLP.',
      payload: {
        moduleId,
        severity,
        hasBlocking,
        validationItemCodes: items.map((i) => i.code),
        legalTrace,
      },
    }),
  ];

  return {
    validationItems: items,
    events,
    decisionMetadata,
    hasBlocking,
  };
}

