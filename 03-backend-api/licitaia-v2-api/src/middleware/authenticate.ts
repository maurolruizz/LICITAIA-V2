/**
 * ETAPA G — Fase Interna 3 — Middleware de autenticação e resolução de tenant.
 *
 * Responsabilidades:
 *   1. Extrair e verificar o JWT do cabeçalho Authorization: Bearer <token>
 *   2. Resolver e validar o tenant (status ∈ {active, trial})
 *   3. Verificar que o usuário ainda está ativo (status === 'active')
 *   4. Injetar contexto de identidade em res.locals:
 *        authenticatedUserId    : string
 *        authenticatedTenantId  : string
 *        authenticatedRole      : UserRole
 *
 * Respostas de falha:
 *   401 — token ausente, inválido ou expirado; usuário ou tenant não encontrado
 *   403 — tenant suspenso; usuário inativo ou suspenso
 *
 * Regra absoluta: nenhuma rota protegida deve ser processada sem que este
 * middleware injete os três campos em res.locals.
 *
 * Uso em rotas:
 *   router.post('/rota', authenticateMiddleware, handler);
 *
 * Rotas existentes (motor, process-executions, health, diagnostics) NÃO são
 * alteradas nesta fase. O middleware está disponível para aplicação gradual
 * a partir da Fase Interna 4 (RBAC).
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthError } from '../modules/auth/auth.service';
import { findTenantById } from '../modules/auth/auth.repository';
import { withTenantContext } from '../lib/db';
import { findUserById } from '../modules/auth/auth.repository';
import { buildInstitutionalMeta } from '../lib/response-meta';
import { logger } from './logger';

export async function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization header ausente ou formato inválido. Use: Bearer <token>',
      },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.httpStatus).json({
        success: false,
        error: { code: err.code, message: err.message },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }
    logger.error(`[AUTHENTICATE] Erro inesperado na verificação do token: ${String(err)}`);
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  const { sub: userId, tid: tenantId, role } = payload;

  // Verificar tenant (sem RLS — tabela tenants não possui RLS)
  let tenant: Awaited<ReturnType<typeof findTenantById>>;
  try {
    tenant = await findTenantById(tenantId);
  } catch (err) {
    logger.error(`[AUTHENTICATE] Erro ao consultar tenant ${tenantId}: ${String(err)}`);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao verificar sessão.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  if (!tenant) {
    res.status(401).json({
      success: false,
      error: { code: 'TENANT_NOT_FOUND', message: 'Tenant não encontrado.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  if (tenant.status === 'suspended') {
    res.status(403).json({
      success: false,
      error: { code: 'TENANT_INACTIVE', message: 'Tenant inativo ou suspenso.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  // Verificar usuário dentro do contexto RLS do tenant
  let user: Awaited<ReturnType<typeof findUserById>>;
  try {
    user = await withTenantContext(tenantId, (client) => findUserById(client, userId));
  } catch (err) {
    logger.error(`[AUTHENTICATE] Erro ao consultar usuário ${userId}: ${String(err)}`);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao verificar sessão.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  if (!user) {
    res.status(401).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      error: { code: 'USER_INACTIVE', message: 'Usuário inativo ou suspenso.' },
      meta: buildInstitutionalMeta(res),
    });
    return;
  }

  // Injetar contexto de identidade em res.locals
  res.locals['authenticatedUserId']   = userId;
  res.locals['authenticatedTenantId'] = tenantId;
  res.locals['authenticatedRole']     = role;

  next();
}
