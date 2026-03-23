/**
 * FASE 47 — Diagnóstico operacional controlado do backend.
 *
 * GET /diagnostics
 * Raiz: apenas dados operacionais exclusivos (kind, uptimeSeconds, capabilities).
 * Identidade/correlação/tempo: somente `meta` (ver `lib/response-meta.ts`).
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { withInstitutionalMeta } from '../lib/response-meta';

/** Capacidades operacionais em nível institucional — rótulos estáticos, não sensíveis. */
const OPERATIONAL_CAPABILITIES: readonly string[] = [
  'http-api',
  'cors-controlled',
  'request-correlation',
  'security-headers',
  'json-body-limit',
  'structured-request-logging',
  'graceful-shutdown',
  'process-execution-persistence',
];

export const diagnosticsRouter = Router();

diagnosticsRouter.get('/', (_req: Request, res: Response): void => {
  const uptimeSeconds = Math.floor(process.uptime());

  res.status(200).json(
    withInstitutionalMeta(res, {
      kind: 'operational-diagnostics',
      uptimeSeconds,
      capabilities: [...OPERATIONAL_CAPABILITIES],
    }),
  );
});
