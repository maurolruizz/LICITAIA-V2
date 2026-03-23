/**
 * Contratos formais de resposta do endpoint POST /api/process/run.
 * Fase 34 — Padronização da resposta e contrato operacional da API.
 *
 * Diretriz: preservar compatibilidade com Fase 33/32.
 * - Resposta de execução (200/409/422) mantém o shape já retornado.
 * - Respostas de erro (400/500) mantêm campos existentes e adicionam tipagem explícita.
 */

import type { AdministrativeProcessResult } from './administrative-process.types';
import {
  type ProcessRunRequestErrorBody,
  PROCESS_RUN_REQUEST_ERROR_CODES,
} from './process-run-request.types';

export type ProcessRunProcessSummary = {
  status: string;
  finalStatus: string;
  halted: boolean;
};

/**
 * Resposta de execução do motor (inclui sucesso e não-sucesso do motor).
 * Compatível com o shape retornado desde a Fase 32.
 */
export interface ProcessRunEngineResponseBody {
  success: boolean;
  process: ProcessRunProcessSummary;
  result: AdministrativeProcessResult;
  events: unknown[];
  metadata: Record<string, unknown>;
  validations: unknown[];
}

/**
 * Aliases semânticos (Fase 34):
 * - 200: execução bem-sucedida
 * - 409/422: execução não-sucedida (falha de execução)
 *
 * Importante: mantém exatamente o mesmo shape do contrato do motor.
 */
export type ProcessRunSuccessResponseBody = ProcessRunEngineResponseBody;
export type ProcessRunExecutionFailureResponseBody = ProcessRunEngineResponseBody;

/**
 * Resposta para erro de validação de entrada (400).
 * Mantém o shape `success:false` + `error` já usado na Fase 33.
 * (Os demais campos não são incluídos para evitar quebra de consumidores
 * que dependam do shape enxuto do 400 introduzido na Fase 33.)
 */
export type ProcessRunValidationErrorResponseBody = ProcessRunRequestErrorBody;

/**
 * Resposta para erro interno inesperado (500).
 * Mantém o shape já retornado pelo backend desde a Fase 32.
 */
export interface ProcessRunInternalErrorResponseBody {
  success: false;
  process: ProcessRunProcessSummary;
  result: null;
  events: [];
  metadata: Record<string, unknown>;
  validations: [];
  error: {
    code: typeof PROCESS_RUN_REQUEST_ERROR_CODES.INTERNAL_ERROR;
    name?: string;
    message: string;
  };
}

export type ProcessRunResponseBody =
  | ProcessRunEngineResponseBody
  | ProcessRunValidationErrorResponseBody
  | ProcessRunInternalErrorResponseBody;

