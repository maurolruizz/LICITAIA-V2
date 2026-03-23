/**
 * FASE 43 — Middleware de correlação de requisições.
 *
 * Gera ou reaproveita um requestId único por requisição.
 * Prioriza o header 'x-request-id' recebido, senão gera UUID v4.
 * Armazena em res.locals.requestId e devolve ao cliente via header X-Request-Id.
 * Não altera nenhum contrato de resposta JSON existente.
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const CORRELATION_HEADER = 'x-request-id';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[CORRELATION_HEADER];
  const requestId =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim()
      : randomUUID();

  res.locals['requestId'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
