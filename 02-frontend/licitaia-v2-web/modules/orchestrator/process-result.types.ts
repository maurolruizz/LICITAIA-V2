/**
 * Tipo de resultado agregado do processo administrativo.
 */

import type { ModuleOutputContract } from '../core/contracts/module-output.contract';
import type { ValidationItemContract } from '../core/contracts/validation.contract';
import type { AdministrativeEventContract } from '../core/contracts/event.contract';
import type { DecisionMetadataContract } from '../core/contracts/decision-metadata.contract';
import type { ModuleId } from '../core/enums/module-id.enum';

export type ProcessStatus = 'success' | 'failure' | 'halted';

/**
 * Status consolidado final do processo administrativo,
 * preparado para auditoria e leitura de alto nível.
 */
export type AdministrativeFinalStatus =
  | 'SUCCESS'
  | 'HALTED_BY_VALIDATION'
  | 'HALTED_BY_DEPENDENCY'
  | 'HALTED_BY_MODULE';

type HaltReasonType =
  | 'DEPENDENCY'
  | 'CROSS_VALIDATION'
  | 'LEGAL_VALIDATION'
  | 'MODULE_SIGNAL'
  | 'CLASSIFICATION_PREFLIGHT';

export interface HaltedDetail {
  moduleId: ModuleId;
  /**
   * Tipo macro de bloqueio (dependência, validação ou sinal explícito do módulo).
   */
  type: 'VALIDATION' | 'DEPENDENCY' | 'MODULE';
  /**
   * Origem interna do bloqueio dentro do motor.
   */
  origin: HaltReasonType;
  /**
   * Código principal associado ao bloqueio (validação, dependência ou resultado do módulo).
   */
  code?: string;
  /**
   * Mensagem consolidada explicando o motivo do bloqueio.
   */
  message?: string;
}

export interface AdministrativeProcessResult {
  /**
   * Indicador técnico de sucesso geral (compatível com versões anteriores).
   */
  success: boolean;
  /**
   * Status técnico agregado (compatível com versões anteriores).
   */
  status: ProcessStatus;
  /**
   * Saídas brutas dos módulos, preservadas para compatibilidade.
   */
  outputs: ModuleOutputContract[];
  /**
   * Saídas consolidadas dos módulos do pipeline (alias semântico de `outputs`).
   */
  moduleOutputs: ModuleOutputContract[];
  /**
   * Lista consolidada de todas as validações (internas, cruzadas e jurídicas).
   */
  validations: ValidationItemContract[];
  /**
   * Lista consolidada de eventos administrativos (de módulos, validações e jurídico).
   */
  events: AdministrativeEventContract[];
  /**
   * Metadados agregados do processo, incluindo base técnica e campos auxiliares.
   */
  metadata: Record<string, unknown>;
  /**
   * Lista consolidada de metadados de decisão produzidos ao longo do fluxo.
   */
  decisionMetadata: DecisionMetadataContract[];
  /**
   * Lista consolidada de trilhas jurídicas estruturadas extraídas das decisões.
   */
  legalTrace: Record<string, unknown>[];
  /**
   * Indicador se houve interrupção do fluxo.
   */
  halted: boolean;
  /**
   * Módulo que interrompeu o fluxo (compatível com versões anteriores).
   */
  haltedBy?: ModuleId;
  /**
   * Detalhamento estruturado de quem e por que interrompeu o processo.
   */
  haltedDetail?: HaltedDetail;
  /**
   * Status consolidado final, pronto para consumo por camadas de auditoria e interfaces.
   */
  finalStatus: AdministrativeFinalStatus;
  /**
   * Lista de módulos efetivamente executados, na ordem de execução.
   */
  executedModules: ModuleId[];
  /**
   * ETAPA A — Estado consolidado de domínio após execução (fonte única oficial).
   */
  processSnapshot: Record<string, unknown>;
}
