/**
 * Validação explícita da entrada do endpoint POST /api/process/run.
 * Rejeita input inválido e devolve erros estruturados.
 * Fase 33 — Estrutura de entrada e validação do processo.
 */

import type {
  ProcessRunRequest,
  ProcessRunValidationDetail,
  ProcessRunRequestErrorBody,
} from '../dto/process-run-request.types';
import { PROCESS_RUN_REQUEST_ERROR_CODES } from '../dto/process-run-request.types';
import { validatePayloadClassification } from './payload-classification.validator';

export type ValidateProcessRunRequestSuccess = {
  success: true;
  data: ProcessRunRequest;
};

export type ValidateProcessRunRequestFailure = {
  success: false;
  error: ProcessRunRequestErrorBody['error'];
};

export type ValidateProcessRunRequestResult =
  | ValidateProcessRunRequestSuccess
  | ValidateProcessRunRequestFailure;

function collectDetails(
  body: unknown,
  payload: unknown
): ProcessRunValidationDetail[] {
  const details: ProcessRunValidationDetail[] = [];

  if (body === undefined || body === null) {
    details.push({ field: 'body', reason: 'Request body is required.' });
    return details;
  }

  if (typeof body !== 'object') {
    details.push({
      field: 'body',
      reason: 'Request body must be a JSON object.',
    });
    return details;
  }

  if (Array.isArray(body)) {
    details.push({
      field: 'body',
      reason: 'Request body must be an object, not an array.',
    });
    return details;
  }

  const bodyObj = body as Record<string, unknown>;

  if (!('payload' in bodyObj)) {
    details.push({ field: 'payload', reason: 'payload is required.' });
    return details;
  }

  if (payload === null || payload === undefined) {
    details.push({
      field: 'payload',
      reason: 'payload must be a non-null object.',
    });
    return details;
  }

  if (typeof payload !== 'object') {
    details.push({
      field: 'payload',
      reason: 'payload must be an object.',
    });
    return details;
  }

  if (Array.isArray(payload)) {
    details.push({
      field: 'payload',
      reason: 'payload must be an object, not an array.',
    });
    return details;
  }

  if (bodyObj.processId !== undefined) {
    if (typeof bodyObj.processId !== 'string') {
      details.push({
        field: 'processId',
        reason: 'processId must be a string when provided.',
      });
    } else if (bodyObj.processId.trim().length === 0) {
      details.push({
        field: 'processId',
        reason: 'processId must be a non-empty string when provided.',
      });
    }
  }

  if (bodyObj.phase !== undefined) {
    if (typeof bodyObj.phase !== 'string') {
      details.push({
        field: 'phase',
        reason: 'phase must be a string when provided.',
      });
    } else if (bodyObj.phase.trim().length === 0) {
      details.push({
        field: 'phase',
        reason: 'phase must be a non-empty string when provided.',
      });
    }
  }

  if (
    bodyObj.correlationId !== undefined &&
    typeof bodyObj.correlationId !== 'string'
  ) {
    details.push({
      field: 'correlationId',
      reason: 'correlationId must be a string when provided.',
    });
  }

  return details;
}

/**
 * Valida o corpo da requisição do endpoint POST /api/process/run.
 * Garante: body existe, body é objeto, payload existe e é objeto;
 * campos opcionais com tipo correto quando presentes.
 */
export function validateProcessRunRequest(body: unknown): ValidateProcessRunRequestResult {
  const payload =
    body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).payload
      : undefined;

  const details = collectDetails(body, payload);

  if (details.length > 0) {
    const message =
      details.length === 1
        ? details[0].reason
        : 'Invalid request payload. See details.';
    return {
      success: false,
      error: {
        code: PROCESS_RUN_REQUEST_ERROR_CODES.INVALID_PROCESS_RUN_REQUEST,
        message,
        details,
      },
    };
  }

  const payloadObj = payload as Record<string, unknown>;
  const classification = validatePayloadClassification(payloadObj);
  if (!classification.ok) {
    return {
      success: false,
      error: {
        code: classification.code,
        message: classification.reason,
        details: [{ field: classification.field, reason: classification.reason }],
      },
    };
  }

  const bodyObj = body as Record<string, unknown>;
  const data: ProcessRunRequest = {
    payload: payloadObj,
  };

  if (
    typeof bodyObj.processId === 'string' &&
    bodyObj.processId.trim().length > 0
  ) {
    data.processId = bodyObj.processId.trim();
  } else if (
    typeof payloadObj['processId'] === 'string' &&
    (payloadObj['processId'] as string).trim().length > 0
  ) {
    // H-FI4: mantém correlação estável quando o cliente envia processId dentro de payload.
    data.processId = (payloadObj['processId'] as string).trim();
  }

  if (
    typeof bodyObj.phase === 'string' &&
    bodyObj.phase.trim().length > 0
  ) {
    data.phase = bodyObj.phase.trim();
  }

  if (typeof bodyObj.correlationId === 'string') {
    data.correlationId = bodyObj.correlationId;
  }

  return { success: true, data };
}
