/**
 * Validador de consistência cruzada entre módulos do processo administrativo.
 * Compara coerência entre DFD↔ETP, ETP↔TR e TR↔Pricing usando payload do contexto.
 */

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
  type CrossModulePair,
  extractDescriptionFromPayload,
  applyConsistencyRule,
  getCrossValidationRuleId,
} from './cross-module-consistency-rules';

/** Par obrigatório: módulo atual → módulo anterior (para validação) */
const REQUIRED_PREVIOUS_MODULE: Partial<Record<ModuleId, ModuleId>> = {
  [ModuleId.ETP]: ModuleId.DFD,
  [ModuleId.TR]: ModuleId.ETP,
  [ModuleId.PRICING]: ModuleId.TR,
};

function getPair(previousModuleId: ModuleId, currentModuleId: ModuleId): CrossModulePair | null {
  if (previousModuleId === ModuleId.DFD && currentModuleId === ModuleId.ETP) return 'DFD_ETP';
  if (previousModuleId === ModuleId.ETP && currentModuleId === ModuleId.TR) return 'ETP_TR';
  if (previousModuleId === ModuleId.TR && currentModuleId === ModuleId.PRICING) return 'TR_PRICING';
  return null;
}

export interface CrossModuleValidationResult {
  validationItems: ValidationItemContract[];
  events: AdministrativeEventContract[];
  decisionMetadata: DecisionMetadataContract[];
  hasBlocking: boolean;
}

/**
 * Executa validação cruzada entre o módulo atual e o anterior.
 * ETAPA A — Usa exclusivamente processSnapshot (fonte única de domínio).
 * Se não houver módulo anterior (ex.: DFD), retorna resultado vazio.
 */
export function validateCrossModuleConsistency(
  currentModuleId: ModuleId,
  currentOutput: ModuleOutputContract,
  previousOutput: ModuleOutputContract | null,
  processSnapshot: Record<string, unknown>,
  processId?: string
): CrossModuleValidationResult {
  const validationItems: ValidationItemContract[] = [];
  const events: AdministrativeEventContract[] = [];
  const decisionMetadata: DecisionMetadataContract[] = [];

  const previousModuleId = REQUIRED_PREVIOUS_MODULE[currentModuleId];
  if (!previousModuleId || !previousOutput) {
    return {
      validationItems: [],
      events: [],
      decisionMetadata: [],
      hasBlocking: false,
    };
  }

  const pair = getPair(previousModuleId, currentModuleId);
  if (!pair) {
    return {
      validationItems: [],
      events: [],
      decisionMetadata: [],
      hasBlocking: false,
    };
  }

  const previousDescription = extractDescriptionFromPayload(
    processSnapshot,
    previousModuleId
  );
  const currentDescription = extractDescriptionFromPayload(
    processSnapshot,
    currentModuleId
  );

  const items = applyConsistencyRule(
    pair,
    previousDescription,
    currentDescription,
    previousModuleId,
    currentModuleId
  );
  validationItems.push(...items);

  const hasBlocking = items.some((i) => i.severity === ValidationSeverity.BLOCK);
  const ruleId = getCrossValidationRuleId(pair);

  if (items.length > 0) {
    const message = hasBlocking
      ? `Validação cruzada ${pair}: inconsistência estrutural detectada.`
      : `Validação cruzada ${pair}: ${items.length} item(ns) de consistência.`;
    const rationale = hasBlocking
      ? 'Inconsistência estrutural entre módulos do processo (objeto ausente ou incoerente).'
      : 'Verificação de coerência entre descrições dos módulos do pipeline.';
    const blockingItem = items.find((i) => i.severity === ValidationSeverity.BLOCK);
    const severity = blockingItem?.severity ?? items[0]!.severity;
    events.push(
      createAdministrativeEvent(
        EventType.VALIDATION,
        currentModuleId,
        'CROSS_MODULE_CONSISTENCY_CHECK',
        message,
        {
          processId,
          payload: {
            pair,
            previousModuleId,
            currentModuleId,
            itemCount: items.length,
            hasBlocking,
          },
        }
      )
    );

    decisionMetadata.push(
      createDecisionMetadata(DecisionOrigin.RULE, {
        moduleId: currentModuleId,
        ruleId,
        rationale,
        payload: {
          pair,
          previousModuleId,
          currentModuleId,
          ruleId,
          severity,
          message,
          validationItemCodes: items.map((i) => i.code),
          hasBlocking,
        },
      })
    );
  }

  return {
    validationItems,
    events,
    decisionMetadata,
    hasBlocking,
  };
}
