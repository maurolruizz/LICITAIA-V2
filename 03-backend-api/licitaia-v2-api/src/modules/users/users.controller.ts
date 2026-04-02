/**
 * ETAPA G — Fase Interna 4 — Controller HTTP do módulo de usuários.
 */

import type { Request, Response } from 'express';
import {
  getMe,
  listUsers,
  createUser,
  patchUser,
  UsersError,
} from './users.service';
import { buildInstitutionalMeta } from '../../lib/response-meta';
import { logger } from '../../middleware/logger';
import type { AuthenticatedContext } from '../auth/auth.types';
import type { CreateUserBody, PatchUserBody } from './users.types';
import { resolveClientIp } from '../../lib/client-ip';

function getIp(req: Request): string | null {
  return resolveClientIp(req);
}

function getUserAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null;
}

function handleUsersError(err: unknown, res: Response): void {
  if (err instanceof UsersError) {
    res.status(err.httpStatus).json({
      success: false,
      error: { code: err.code, message: err.message },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }
  const msg = err instanceof Error ? err.message : 'Erro interno inesperado.';
  logger.error(`[USERS] Erro interno: ${msg}`);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' },
    meta: buildInstitutionalMeta(res),
  });
}

export async function getMeController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as AuthenticatedContext;
    const data = await getMe(ctx.authenticatedTenantId, ctx.authenticatedUserId);
    res.status(200).json({
      success: true,
      data,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleUsersError(err, res);
  }
}

export async function listUsersController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as AuthenticatedContext;
    const data = await listUsers(ctx.authenticatedTenantId);
    res.status(200).json({
      success: true,
      data,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleUsersError(err, res);
  }
}

export async function createUserController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as AuthenticatedContext;
    const body = req.body as CreateUserBody;
    const result = await createUser(
      ctx.authenticatedTenantId,
      ctx.authenticatedUserId,
      body,
      getIp(req),
      getUserAgent(req),
    );
    res.status(201).json({
      success: true,
      data: result,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleUsersError(err, res);
  }
}

export async function patchUserController(req: Request, res: Response): Promise<void> {
  try {
    const ctx = res.locals as AuthenticatedContext;
    const { id } = req.params;
    const body = req.body as PatchUserBody;
    const result = await patchUser(
      ctx.authenticatedTenantId,
      ctx.authenticatedUserId,
      id ?? '',
      body,
      getIp(req),
      getUserAgent(req),
    );
    res.status(200).json({
      success: true,
      data: result,
      meta: buildInstitutionalMeta(res),
    });
  } catch (err) {
    handleUsersError(err, res);
  }
}
