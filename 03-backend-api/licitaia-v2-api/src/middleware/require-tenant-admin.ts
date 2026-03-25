/**
 * ETAPA G — Fase Interna 4 — RBAC: apenas TENANT_ADMIN pode gerenciar usuários do tenant.
 *
 * Deve ser aplicado APÓS authenticateMiddleware.
 * Revalida o papel no banco (não confia apenas no JWT).
 */

import type { Request, Response, NextFunction } from 'express';
import { withTenantContext } from '../lib/db';
import { findUserById } from '../modules/auth/auth.repository';
import { buildInstitutionalMeta } from '../lib/response-meta';
import { logger } from './logger';
import type { AuthenticatedContext } from '../modules/auth/auth.types';

export async function requireTenantAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ctx = res.locals as AuthenticatedContext;
  const tenantId = ctx.authenticatedTenantId;
  const userId = ctx.authenticatedUserId;

  try {
    const user = await withTenantContext(tenantId, (client) => findUserById(client, userId));
    if (!user || user.role !== 'TENANT_ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: 'Operação permitida apenas para administrador do tenant.',
        },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }
    next();
  } catch (err) {
    logger.error(`[RBAC] Erro ao validar papel de administrador: ${String(err)}`);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao validar permissões.' },
      meta: buildInstitutionalMeta(res),
    });
  }
}
