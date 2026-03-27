/**
 * FASE 38 — CORS mínimo controlado.
 *
 * Permite origem configurável via config.corsOrigin.
 * Suporta preflight OPTIONS.
 * Em desenvolvimento, aceita também requests sem Origin (curl, Postman, etc.).
 * Não abre '*' em produção.
 */

import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

const ALLOWED_METHODS = 'GET, POST, OPTIONS';
/** Inclui x-request-id para preflight de browsers alinhado à correlação canônica da borda (H-FI4/H-FI5). */
const ALLOWED_HEADERS = 'Content-Type, Authorization, x-request-id';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers['origin'];

  if (origin === config.corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  // Requests sem Origin (curl, Postman, runners locais) passam em desenvolvimento sem bloqueio.

  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
