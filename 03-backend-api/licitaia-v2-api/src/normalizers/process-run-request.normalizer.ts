/**
 * Normalização da entrada validada para o formato esperado pelo núcleo.
 * Apenas saneamento estrutural e defaults de borda; sem lógica de domínio.
 * Fase 33 — Estrutura de entrada e validação do processo.
 */

import type { ProcessRunRequest } from '../dto/process-run-request.types';
import type { AdministrativeProcessContext } from '../dto/administrative-process.types';

/**
 * Converte o request validado em contexto para runAdministrativeProcess.
 * Aplica apenas defaults de borda: processId, phase, timestamp.
 */
export function normalizeToContext(
  request: ProcessRunRequest
): AdministrativeProcessContext {
  const processId =
    typeof request.processId === 'string' && request.processId.trim().length > 0
      ? request.processId.trim()
      : `proc-${Date.now()}`;

  const phase =
    typeof request.phase === 'string' && request.phase.trim().length > 0
      ? request.phase.trim()
      : 'PLANNING';

  const payload =
    request.payload &&
    typeof request.payload === 'object' &&
    !Array.isArray(request.payload)
      ? (request.payload as Record<string, unknown>)
      : {};

  return {
    processId,
    phase,
    payload,
    timestamp: new Date().toISOString(),
    correlationId:
      typeof request.correlationId === 'string'
        ? request.correlationId
        : undefined,
  };
}
