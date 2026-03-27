/**
 * Factories mínimas para respostas do endpoint POST /api/process/run.
 * Fase 34 — Padronização da resposta e contrato operacional da API.
 *
 * Objetivo: centralizar montagem de resposta mantendo shape compatível.
 */

import type { AdministrativeProcessResult } from '../dto/administrative-process.types';
import type {
  ProcessRunEngineResponseBody,
  ProcessRunInternalErrorResponseBody,
  ProcessRunValidationErrorResponseBody,
} from '../dto/process-run-response.types';
import {
  PROCESS_RUN_REQUEST_ERROR_CODES,
  type ProcessRunRequestErrorCode,
} from '../dto/process-run-request.types';

export function buildEngineResponse(
  engineResult: AdministrativeProcessResult
): ProcessRunEngineResponseBody {
  return {
    success: engineResult.success,
    process: {
      status: engineResult.status,
      finalStatus: engineResult.finalStatus,
      halted: engineResult.halted,
    },
    result: engineResult,
    events: engineResult.events,
    metadata: engineResult.metadata,
    validations: engineResult.validations,
  };
}

export function buildValidationErrorResponse(params: {
  message: string;
  details: { field: string; reason: string }[];
  code?: ProcessRunRequestErrorCode;
}): ProcessRunValidationErrorResponseBody {
  return {
    success: false,
    error: {
      code:
        params.code ?? PROCESS_RUN_REQUEST_ERROR_CODES.INVALID_PROCESS_RUN_REQUEST,
      message: params.message,
      details: params.details,
    },
  };
}

export function buildInternalErrorResponse(
  error: unknown
): ProcessRunInternalErrorResponseBody {
  return {
    success: false,
    process: {
      status: 'failure',
      finalStatus: 'HALTED_BY_MODULE',
      halted: true,
    },
    result: null,
    events: [],
    metadata: {},
    validations: [],
    error:
      error instanceof Error
        ? {
            code: PROCESS_RUN_REQUEST_ERROR_CODES.INTERNAL_ERROR,
            name: error.name,
            message: error.message,
          }
        : {
            code: PROCESS_RUN_REQUEST_ERROR_CODES.INTERNAL_ERROR,
            message: 'Erro interno ao executar o processo administrativo.',
          },
  };
}

