/**
 * Tipos de resultado padronizados do motor modular.
 */

export type ResultStatus = 'success' | 'failure' | 'blocked';

export interface ModuleResult {
  status: ResultStatus;
  /** Mensagem resumida */
  message?: string;
  /** Dados retornados pelo módulo */
  data?: Record<string, unknown>;
  /** Lista de códigos de erro ou validação */
  codes?: string[];
}
