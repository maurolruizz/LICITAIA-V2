/**
 * Factory para metadados de decisão padronizados.
 */

import type { DecisionMetadataContract } from '../contracts/decision-metadata.contract';
import type { DecisionOrigin } from '../enums/decision-origin.enum';
import type { ModuleId } from '../enums/module-id.enum';

export function createDecisionMetadata(
  origin: DecisionOrigin,
  options?: {
    moduleId?: ModuleId;
    ruleId?: string;
    rationale?: string;
    payload?: Record<string, unknown>;
  }
): DecisionMetadataContract {
  return {
    origin,
    moduleId: options?.moduleId,
    ruleId: options?.ruleId,
    rationale: options?.rationale,
    timestamp: new Date().toISOString(),
    payload: options?.payload,
  };
}
