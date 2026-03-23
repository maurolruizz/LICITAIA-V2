/**
 * Contrato de metadados de decisão do motor LICITAIA V2.
 * Rastreabilidade e auditoria de decisões tomadas pelos módulos.
 */

import type { DecisionOrigin } from '../enums/decision-origin.enum';
import type { ModuleId } from '../enums/module-id.enum';

export interface DecisionMetadataContract {
  /** Origem da decisão (módulo, regra, usuário, sistema) */
  origin: DecisionOrigin;
  /** Módulo que gerou a decisão (quando origin = module) */
  moduleId?: ModuleId;
  /** Identificador da regra ou critério aplicado */
  ruleId?: string;
  /** Justificativa ou referência legal */
  rationale?: string;
  /** Timestamp da decisão */
  timestamp: string;
  /** Dados estruturados da decisão para auditoria */
  payload?: Record<string, unknown>;
}
