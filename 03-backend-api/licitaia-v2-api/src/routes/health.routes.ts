/**
 * FASE 38 — Healthcheck oficial.
 *
 * GET /health
 * Responde com status e identidade do serviço na raiz (compat. demo).
 * Timestamp da resposta: somente em `meta.timestamp` (sem duplicação na raiz).
 * Ver contrato institucional em `lib/response-meta.ts`.
 * Sem dependência de banco ou infraestrutura — apenas confirma que o processo está ativo.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { config } from '../config/env';
import { withInstitutionalMeta } from '../lib/response-meta';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response): void => {
  res.status(200).json(
    withInstitutionalMeta(res, {
      status: 'ok',
      service: config.service,
      version: config.version,
      environment: config.environment,
    }),
  );
});
