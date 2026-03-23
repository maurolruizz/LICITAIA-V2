/**
 * FASE 38 — Tratamento operacional de erros de borda.
 * FASE 43 — Enriquecido com requestId para correlação auditável nos logs.
 * FASE 44 — Tratamento explícito de erros de parsing JSON (400) e payload excessivo (413).
 *
 * notFoundHandler  — responde 404 para rotas inexistentes.
 * globalErrorHandler — captura erros não tratados pelo Express,
 *   incluindo erros gerados pelo express.json() para corpos inválidos ou excessivos.
 *
 * FASE 48 — Corpos de erro incluem `meta` institucional (adição compatível).
 * Garante que toda rota inexistente e todo erro inesperado
 * retornem shape JSON consistente.
 */

import type { Request, Response, NextFunction } from 'express';
import { buildInstitutionalMeta } from '../lib/response-meta';
import { logger } from './logger';

/**
 * Erros gerados pelo middleware express.json() possuem as propriedades
 * `status` (número HTTP) e `type` (string descritiva do body-parser).
 * Detectamos esses casos para retornar 400/413 em vez de 500.
 */
interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return err instanceof Error && ('status' in err || 'type' in err);
}

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = res.locals['requestId'] as string | undefined;
  const rid = requestId ? ` [rid:${requestId}]` : '';
  logger.warn(`[NOT_FOUND] ${req.method} ${req.originalUrl}${rid}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
    meta: buildInstitutionalMeta(res),
  });
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = res.locals['requestId'] as string | undefined;
  const rid = requestId ? ` [rid:${requestId}]` : '';

  // Payload excede o limite configurado no express.json()
  if (isBodyParserError(err) && err.status === 413) {
    logger.warn(`[PAYLOAD_TOO_LARGE] ${req.method} ${req.originalUrl}${rid}`);
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds the allowed size limit.',
      },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  // Corpo JSON malformado
  if (
    isBodyParserError(err) &&
    (err.status === 400 || err.type === 'entity.parse.failed')
  ) {
    logger.warn(`[INVALID_JSON] ${req.method} ${req.originalUrl}${rid}`);
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON.',
      },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected internal error.';
  logger.error(`[INTERNAL_ERROR] ${req.method} ${req.originalUrl}${rid} — ${message}`);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
    },
    meta: buildInstitutionalMeta(res),
  });
}
