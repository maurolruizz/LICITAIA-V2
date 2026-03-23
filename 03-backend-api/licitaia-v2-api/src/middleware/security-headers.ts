/**
 * FASE 44 — Hardening mínimo da superfície HTTP.
 *
 * Aplica headers de segurança HTTP mínimos e padronizados.
 * Não interfere com CORS, correlação, roteamento nem com o motor.
 * Compatível com o frontend demo (porta 3000) e com qualquer cliente HTTP.
 *
 * Headers aplicados:
 *   X-Content-Type-Options: nosniff   — impede MIME-type sniffing
 *   X-Frame-Options: DENY             — impede embedding via iframe
 *   Referrer-Policy: no-referrer      — não vaza URL de origem
 *   Cache-Control: no-store           — API não deve ser cacheada
 */

import type { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
}
