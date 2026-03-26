import type { Request, Response } from 'express';
import { buildInstitutionalMeta } from '../../lib/response-meta';
import { logger } from '../../middleware/logger';
import type { AuthenticatedContext } from '../auth/auth.types';
import {
  getInstitutionalSettings,
  InstitutionalSettingsError,
  updateInstitutionalSettings,
} from './institutional-settings.service';

function getIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  return req.socket?.remoteAddress ?? null;
}

function getUserAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null;
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof InstitutionalSettingsError) {
    res.status(err.httpStatus).json({
      success: false,
      error: { code: err.code, message: err.message },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }
  logger.error(`[INSTITUTIONAL_SETTINGS] Erro interno: ${err instanceof Error ? err.message : String(err)}`);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' },
    meta: buildInstitutionalMeta(res),
  });
}

export async function getInstitutionalSettingsController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as Partial<AuthenticatedContext>;
    if (!ctx.authenticatedTenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }
    const data = await getInstitutionalSettings(ctx.authenticatedTenantId);
    res.status(200).json({ success: true, data, meta: buildInstitutionalMeta(res) });
  } catch (err) {
    handleError(err, res);
  }
}

export async function patchInstitutionalSettingsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const ctx = res.locals as Partial<AuthenticatedContext>;
    if (!ctx.authenticatedTenantId || !ctx.authenticatedUserId) {
      res.status(401).json({
        success: false,
        error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto autenticado ausente.' },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }
    const data = await updateInstitutionalSettings({
      tenantId: ctx.authenticatedTenantId,
      actorUserId: ctx.authenticatedUserId,
      body: req.body as Record<string, unknown>,
      ipAddress: getIp(req),
      userAgent: getUserAgent(req),
    });
    res.status(200).json({ success: true, data, meta: buildInstitutionalMeta(res) });
  } catch (err) {
    handleError(err, res);
  }
}
