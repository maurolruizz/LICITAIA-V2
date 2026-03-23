/**
 * Contrato de validação do motor modular LICITAIA V2.
 */

import type { ValidationSeverity } from '../enums/validation-severity.enum';

export interface ValidationItemContract {
  /** Código único da regra de validação */
  code: string;
  /** Mensagem legível */
  message: string;
  /** Severidade: info, warning, error, block */
  severity: ValidationSeverity;
  /** Campo ou caminho afetado (opcional) */
  field?: string;
  /** Dados adicionais para auditoria */
  details?: Record<string, unknown>;
}

export interface ValidationResultContract {
  /** Se a validação passou (sem erros/bloqueios) */
  valid: boolean;
  /** Lista de itens de validação */
  items: ValidationItemContract[];
  /** Se há algum item que bloqueia o fluxo */
  hasBlocking: boolean;
}
