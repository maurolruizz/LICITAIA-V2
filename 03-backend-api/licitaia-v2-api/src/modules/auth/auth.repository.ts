/**
 * ETAPA G — Fase Interna 3 — Repositório de autenticação.
 *
 * Responsável pelas queries SQL relacionadas à autenticação:
 * - Consulta de tenant por slug (sem RLS — tabela pública de autoridade)
 * - Consulta de usuário por email (dentro de contexto RLS do tenant)
 * - Consulta de usuário por ID (dentro de contexto RLS do tenant)
 * - Criação de sessão em user_sessions
 * - Consulta de sessão por hash de refresh token
 * - Revogação de sessão
 * - Atualização de last_login_at
 * - Gravação em audit_logs (append-only)
 *
 * Regra arquitetural: este repositório NÃO conhece lógica de negócio.
 * Toda decisão (validar status, verificar senha) pertence ao service.
 */

import { PoolClient } from 'pg';
import { pool } from '../../lib/db';
import type {
  TenantRecord,
  UserRecord,
  SessionRecord,
} from './auth.types';

// --- Consultas sem RLS (tabela tenants) ---

export async function findTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const result = await pool.query<{
    id: string;
    slug: string;
    name: string;
    status: string;
    plan_type: string;
  }>(
    `SELECT id, slug, name, status, plan_type FROM tenants WHERE slug = $1 LIMIT 1`,
    [slug],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status as TenantRecord['status'],
    planType: row.plan_type,
  };
}

export async function findTenantById(id: string): Promise<TenantRecord | null> {
  const result = await pool.query<{
    id: string;
    slug: string;
    name: string;
    status: string;
    plan_type: string;
  }>(
    `SELECT id, slug, name, status, plan_type FROM tenants WHERE id = $1 LIMIT 1`,
    [id],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status as TenantRecord['status'],
    planType: row.plan_type,
  };
}

// --- Consultas com RLS (requerem PoolClient com tenant context já definido) ---

export async function findUserByEmail(
  client: PoolClient,
  email: string,
): Promise<UserRecord | null> {
  const result = await client.query<{
    id: string;
    tenant_id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    password_hash: string;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, tenant_id, email, name, role, status, password_hash, last_login_at,
            created_at, updated_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    role: row.role as UserRecord['role'],
    status: row.status as UserRecord['status'],
    passwordHash: row.password_hash,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserById(
  client: PoolClient,
  userId: string,
): Promise<UserRecord | null> {
  const result = await client.query<{
    id: string;
    tenant_id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    password_hash: string;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, tenant_id, email, name, role, status, password_hash, last_login_at,
            created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    role: row.role as UserRecord['role'],
    status: row.status as UserRecord['status'],
    passwordHash: row.password_hash,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSession(
  client: PoolClient,
  data: {
    userId: string;
    tenantId: string;
    refreshTokenHash: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: Date;
  },
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO user_sessions (user_id, tenant_id, refresh_token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      data.userId,
      data.tenantId,
      data.refreshTokenHash,
      data.ipAddress,
      data.userAgent,
      data.expiresAt,
    ],
  );
  return result.rows[0].id;
}

export async function findSessionByTokenHash(
  client: PoolClient,
  tokenHash: string,
): Promise<SessionRecord | null> {
  const result = await client.query<{
    id: string;
    user_id: string;
    tenant_id: string;
    refresh_token_hash: string;
    ip_address: string | null;
    user_agent: string | null;
    expires_at: Date;
    revoked_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, user_id, tenant_id, refresh_token_hash, ip_address, user_agent,
            expires_at, revoked_at, created_at
     FROM user_sessions
     WHERE refresh_token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    refreshTokenHash: row.refresh_token_hash,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function revokeSession(
  client: PoolClient,
  sessionId: string,
): Promise<void> {
  await client.query(
    `UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}

export async function updateUserLastLogin(
  client: PoolClient,
  userId: string,
): Promise<void> {
  await client.query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [userId],
  );
}

export async function insertAuditLog(
  client: PoolClient,
  data: {
    tenantId: string;
    userId: string | null;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO audit_logs
       (tenant_id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.tenantId,
      data.userId,
      data.action,
      data.resourceType,
      data.resourceId,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.ipAddress,
      data.userAgent,
    ],
  );
}
