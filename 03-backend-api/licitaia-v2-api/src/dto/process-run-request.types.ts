/**
 * Contrato de entrada do endpoint POST /api/process/run.
 * Representa explicitamente o que o backend aceita como entrada para execução do processo.
 * Fase 33 — Estrutura de entrada e validação do processo.
 */

/**
 * Payload aceito pelo endpoint: objeto plano (dados do processo).
 * Não aceita null, array ou primitivos.
 */
export type ProcessRunPayload = Record<string, unknown>;

/**
 * Contrato mínimo e estável do request de execução do processo.
 * Campos opcionais podem ser preenchidos por normalização com defaults seguros.
 */
export interface ProcessRunRequest {
  /** Identificador do processo. Opcional na entrada; default aplicado na normalização. */
  processId?: string;
  /** Fase do processo. Opcional na entrada; default `PLANNING` na normalização (alinhado ao enum do motor). */
  phase?: string;
  /** Dados do processo. Obrigatório: deve existir e ser objeto. */
  payload: ProcessRunPayload;
  /**
   * ID de correlação.
   * Não é aceito pela borda pública para evitar ambiguidade semântica;
   * o valor canônico é derivado do header `x-request-id`.
   */
  correlationId?: string;
}

/**
 * Detalhe de falha de validação (campo e motivo).
 */
export interface ProcessRunValidationDetail {
  field: string;
  reason: string;
}

/**
 * Códigos de erro de classificação normativa (ETAPA A — camada API, 400).
 */
export const ETAPA_A_CLASSIFICATION_ERROR_CODES = {
  INPUT_CLASSIFICATION_REQUIRED: 'INPUT_CLASSIFICATION_REQUIRED',
  INPUT_CLASSIFICATION_ENUM_INVALID: 'INPUT_CLASSIFICATION_ENUM_INVALID',
  INPUT_CLASSIFICATION_EMPTY: 'INPUT_CLASSIFICATION_EMPTY',
} as const;

/**
 * Código de erro padronizado para resposta da API.
 */
export const PROCESS_RUN_REQUEST_ERROR_CODES = {
  INVALID_PROCESS_RUN_REQUEST: 'INVALID_PROCESS_RUN_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ...ETAPA_A_CLASSIFICATION_ERROR_CODES,
} as const;

export type ProcessRunRequestErrorCode =
  (typeof PROCESS_RUN_REQUEST_ERROR_CODES)[keyof typeof PROCESS_RUN_REQUEST_ERROR_CODES];

/**
 * Estrutura de erro de validação retornada quando a entrada é inválida.
 */
export interface ProcessRunRequestErrorBody {
  success: false;
  error: {
    code: ProcessRunRequestErrorCode;
    message: string;
    details: ProcessRunValidationDetail[];
  };
}
