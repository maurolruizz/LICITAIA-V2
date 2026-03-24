/**
 * ETAPA G — Fase Interna 3 — Service de autenticação.
 *
 * Implementa a lógica de negócio da camada de autenticação:
 *   login()   → valida credenciais, cria sessão, emite JWT + refresh token
 *   refresh() → valida refresh token, emite novo access token
 *   logout()  → revoga sessão persistida
 *
 * Estratégia de autenticação adotada:
 *   - Credencial: email + senha (bcrypt)
 *   - Acesso: JWT (HS256) com payload { sub: userId, tid: tenantId, role }
 *   - Sessão: refresh token opaco (32 bytes base64url) com hash SHA-256 no banco
 *   - Isolamento: tenant resolvido por slug fornecido no login — nunca do payload
 *   - Sessão persistida em user_sessions conforme arquitetura aprovada (Fase Interna 1)
 *   - Toda autenticação produz entrada imutável em audit_logs
 *
 * Regras absolutas:
 *   - tenant_id nunca vem do payload do cliente — apenas do banco após resolução por slug
 *   - Nenhum token é armazenado em texto claro no banco
 *   - Tenant inativo (suspended) bloqueia login
 *   - Usuário inativo ou suspenso bloqueia login
 */

import { randomBytes, createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { withTenantContext } from '../../lib/db';
import { config } from '../../config/env';
import {
  findTenantBySlug,
  findUserByEmail,
  createSession,
  findSessionByTokenHash,
  findUserById,
  findTenantById,
  revokeSession,
  updateUserLastLogin,
  insertAuditLog,
} from './auth.repository';
import type {
  LoginRequestBody,
  LoginResponseBody,
  RefreshResponseBody,
  JwtPayload,
  UserRole,
} from './auth.types';

// --- Erros de autenticação ---

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// --- Helpers de token ---

function generateAccessToken(userId: string, tenantId: string, role: UserRole): string {
  const payload: JwtPayload = { sub: userId, tid: tenantId, role };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiresSecs,
    algorithm: 'HS256',
  });
}

/**
 * Gera um refresh token com tenantId embutido como prefixo.
 * Formato: {tenantId}.{randomBase64url}
 *
 * O tenantId é incluído para permitir a resolução do contexto RLS ao renovar o token,
 * sem precisar de queries sem contexto de isolamento. O UUID não é informação sensível.
 * A segurança vem da aleatoriedade dos 32 bytes da parte aleatória.
 */
function generateRefreshToken(tenantId: string): string {
  const random = randomBytes(32).toString('base64url');
  return `${tenantId}.${random}`;
}

/**
 * Extrai o tenantId do prefixo do refresh token.
 * Retorna null se o formato for inválido.
 */
function extractTenantFromRefreshToken(token: string): string | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;
  const candidate = token.substring(0, dotIdx);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(candidate) ? candidate : null;
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + config.jwtRefreshExpiresDays);
  return d;
}

// --- Casos de uso ---

export async function login(
  body: LoginRequestBody,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<LoginResponseBody> {
  const { tenantSlug, email, password } = body;

  if (!tenantSlug?.trim() || !email?.trim() || !password) {
    throw new AuthError(
      'tenantSlug, email e password são obrigatórios.',
      'VALIDATION_ERROR',
      400,
    );
  }

  // 1. Resolver tenant por slug (sem RLS — tabela pública de autoridade)
  const tenant = await findTenantBySlug(tenantSlug.trim().toLowerCase());
  if (!tenant) {
    throw new AuthError(
      'Credenciais inválidas.',
      'INVALID_CREDENTIALS',
      401,
    );
  }

  // 2. Validar status do tenant
  if (tenant.status === 'suspended') {
    throw new AuthError(
      'Tenant inativo ou suspenso.',
      'TENANT_INACTIVE',
      403,
    );
  }

  // 3. Dentro do contexto RLS do tenant: buscar usuário, criar sessão, gravar auditoria
  return await withTenantContext(tenant.id, async (client) => {
    // 3a. Buscar usuário por email (RLS garante isolamento por tenant)
    const user = await findUserByEmail(client, email.trim().toLowerCase());
    if (!user) {
      throw new AuthError(
        'Credenciais inválidas.',
        'INVALID_CREDENTIALS',
        401,
      );
    }

    // 3b. Validar status do usuário
    if (user.status !== 'active') {
      throw new AuthError(
        'Usuário inativo ou suspenso.',
        'USER_INACTIVE',
        403,
      );
    }

    // 3c. Verificar senha (bcrypt — constant-time compare)
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Auditoria de tentativa falhada
      await insertAuditLog(client, {
        tenantId: tenant.id,
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { reason: 'invalid_password', email: user.email },
        ipAddress,
        userAgent,
      });
      throw new AuthError(
        'Credenciais inválidas.',
        'INVALID_CREDENTIALS',
        401,
      );
    }

    // 4. Emitir tokens
    const accessToken = generateAccessToken(user.id, tenant.id, user.role);
    const refreshToken = generateRefreshToken(tenant.id);
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = refreshTokenExpiresAt();

    // 5. Persistir sessão em user_sessions
    await createSession(client, {
      userId: user.id,
      tenantId: tenant.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 6. Atualizar last_login_at
    await updateUserLastLogin(client, user.id);

    // 7. Gravar auditoria de login bem-sucedido
    await insertAuditLog(client, {
      tenantId: tenant.id,
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwtAccessExpiresSecs,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
    };
  });
}

export async function refresh(
  refreshToken: string | undefined,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<RefreshResponseBody> {
  if (!refreshToken?.trim()) {
    throw new AuthError(
      'refreshToken é obrigatório.',
      'VALIDATION_ERROR',
      400,
    );
  }

  const rawToken = refreshToken.trim();

  // 1. Extrair tenantId do prefixo do refresh token (formato: {tenantId}.{random})
  //    O tenantId permite definir o contexto RLS antes de consultar user_sessions.
  //    Sem esse prefixo, a consulta retornaria 0 linhas pela política de RLS.
  const tenantId = extractTenantFromRefreshToken(rawToken);
  if (!tenantId) {
    throw new AuthError(
      'Sessão inválida ou expirada.',
      'INVALID_REFRESH_TOKEN',
      401,
    );
  }

  // 2. Validar que o tenant existe e está ativo (sem RLS — tabela tenants não possui)
  const tenant = await findTenantById(tenantId);
  if (!tenant || tenant.status === 'suspended') {
    throw new AuthError(
      'Tenant inativo ou suspenso.',
      'TENANT_INACTIVE',
      403,
    );
  }

  const tokenHash = hashRefreshToken(rawToken);

  // 3. Dentro do contexto RLS do tenant: validar sessão e usuário
  return await withTenantContext(tenantId, async (client) => {
    const session = await findSessionByTokenHash(client, tokenHash);

    if (!session) {
      throw new AuthError(
        'Sessão inválida ou expirada.',
        'INVALID_REFRESH_TOKEN',
        401,
      );
    }

    if (session.revokedAt !== null) {
      throw new AuthError(
        'Sessão revogada.',
        'SESSION_REVOKED',
        401,
      );
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new AuthError(
        'Sessão expirada.',
        'SESSION_EXPIRED',
        401,
      );
    }

    const userId = session.userId;

    const user = await findUserById(client, userId);
    if (!user || user.status !== 'active') {
      throw new AuthError(
        'Usuário inativo ou suspenso.',
        'USER_INACTIVE',
        403,
      );
    }

    // 4. Emitir novo access token (sessão continua válida — sem rotação de refresh nesta fase)
    const accessToken = generateAccessToken(user.id, tenant.id, user.role);

    await insertAuditLog(client, {
      tenantId,
      userId,
      action: 'TOKEN_REFRESHED',
      resourceType: 'user_session',
      resourceId: session.id,
      metadata: null,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      expiresIn: config.jwtAccessExpiresSecs,
    };
  });
}

export async function logout(
  userId: string,
  tenantId: string,
  refreshToken: string | undefined,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    if (refreshToken?.trim()) {
      const tokenHash = hashRefreshToken(refreshToken.trim());
      const session = await findSessionByTokenHash(client, tokenHash);
      if (session && session.userId === userId) {
        await revokeSession(client, session.id);
      }
    }

    await insertAuditLog(client, {
      tenantId,
      userId,
      action: 'USER_LOGOUT',
      resourceType: 'user',
      resourceId: userId,
      metadata: null,
      ipAddress,
      userAgent,
    });
  });
}

/**
 * Verifica e decodifica um access token JWT.
 * Retorna o payload decodificado ou lança AuthError.
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as JwtPayload;
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expirado.', 'TOKEN_EXPIRED', 401);
    }
    throw new AuthError('Token inválido.', 'INVALID_TOKEN', 401);
  }
}
