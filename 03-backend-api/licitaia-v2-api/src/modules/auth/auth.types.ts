/**
 * ETAPA G — Fase Interna 3 — Tipos do módulo de autenticação.
 *
 * Tipos compartilhados entre repository, service, controller e middleware.
 * Definem os contratos internos da camada de autenticação.
 */

export type UserRole = 'SYSTEM_ADMIN' | 'TENANT_ADMIN' | 'OPERATOR' | 'AUDITOR';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type TenantStatus = 'active' | 'suspended' | 'trial';

/** Resultado de tenant consultado do banco (tabela tenants — sem RLS). */
export interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  planType: string;
}

/** Resultado de usuário consultado do banco (tabela users — com RLS). */
export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  lastLoginAt: Date | null;
}

/** Dados de uma sessão armazenada em user_sessions. */
export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/** Payload do JWT de acesso (access token). */
export interface JwtPayload {
  sub: string;      // userId
  tid: string;      // tenantId
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Contexto de identidade injetado em res.locals pelo middleware authenticate. */
export interface AuthenticatedContext {
  authenticatedUserId: string;
  authenticatedTenantId: string;
  authenticatedRole: UserRole;
}

/** Corpo da requisição de login. */
export interface LoginRequestBody {
  tenantSlug: string;
  email: string;
  password: string;
}

/** Corpo da resposta de login bem-sucedido. */
export interface LoginResponseBody {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
}

/** Corpo da requisição de refresh. */
export interface RefreshRequestBody {
  refreshToken: string;
}

/** Corpo da resposta de refresh bem-sucedido. */
export interface RefreshResponseBody {
  accessToken: string;
  expiresIn: number;
}

/** Corpo da requisição de logout. */
export interface LogoutRequestBody {
  refreshToken?: string;
}
