/**
 * ETAPA G — Fase Interna 3 — Controller de autenticação.
 *
 * Handlers HTTP para os endpoints:
 *   POST /api/auth/login   → login com email + senha + tenantSlug
 *   POST /api/auth/refresh → renovação do access token via refresh token
 *   POST /api/auth/logout  → encerramento de sessão
 *
 * Responsabilidade deste módulo: apenas tratar HTTP (request/response).
 * Toda lógica de negócio está no auth.service.
 */

import type { Request, Response } from 'express';
import { login, refresh, logout, AuthError } from './auth.service';
import { buildInstitutionalMeta } from '../../lib/response-meta';
import { logger } from '../../middleware/logger';
import type { LoginRequestBody, RefreshRequestBody, LogoutRequestBody } from './auth.types';
import type { AuthenticatedContext } from './auth.types';
import { resolveClientIp } from '../../lib/client-ip';

function getIp(req: Request): string | null {
  return resolveClientIp(req);
}

function getUserAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null;
}

function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    res.status(err.httpStatus).json({
      success: false,
      error: { code: err.code, message: err.message },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }
  const msg = err instanceof Error ? err.message : 'Erro interno inesperado.';
  const stack = err instanceof Error ? err.stack : undefined;
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(err);
  } catch {
    serialized = undefined;
  }
  const detail =
    msg && msg.trim() !== ''
      ? msg
      : stack && stack.trim() !== ''
        ? stack
        : serialized && serialized.trim() !== ''
          ? serialized
          : String(err);
  logger.error(`[AUTH] Erro interno: ${detail}`);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' },
    meta: buildInstitutionalMeta(res),
  });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as LoginRequestBody;
    const result = await login(body, getIp(req), getUserAgent(req));
    res.status(200).json({
      success: true,
      data: result,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as RefreshRequestBody;
    const result = await refresh(body.refreshToken, getIp(req), getUserAgent(req));
    res.status(200).json({
      success: true,
      data: result,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as AuthenticatedContext;
    const body = req.body as LogoutRequestBody;
    await logout(
      ctx.authenticatedUserId,
      ctx.authenticatedTenantId,
      body.refreshToken,
      getIp(req),
      getUserAgent(req),
    );
    res.status(200).json({
      success: true,
      data: { message: 'Sessão encerrada com sucesso.' },
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleAuthError(err, res);
  }
}
