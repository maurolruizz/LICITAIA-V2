/**
 * ETAPA G — Fase Interna 4 — Repositório de usuários (queries com PoolClient + RLS).
 */

import type { PoolClient } from 'pg';
import type { UserRole, UserStatus } from '../auth/auth.types';
import type { TenantAssignableRole } from './users.types';

export interface UserRowPublic {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function listUsersInTenant(client: PoolClient): Promise<UserRowPublic[]> {
  const result = await client.query<UserRowPublic>(
    `SELECT id, tenant_id, email, name, role, status, last_login_at, created_at, updated_at
     FROM users
     ORDER BY created_at ASC`,
  );
  return result.rows;
}

export async function insertUser(
  client: PoolClient,
  data: {
    tenantId: string;
    email: string;
    name: string;
    passwordHash: string;
    role: TenantAssignableRole;
    createdBy: string;
  },
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO users (tenant_id, email, name, role, status, password_hash, created_by)
     VALUES ($1, $2, $3, $4, 'active', $5, $6)
     RETURNING id`,
    [
      data.tenantId,
      data.email,
      data.name,
      data.role,
      data.passwordHash,
      data.createdBy,
    ],
  );
  return result.rows[0].id;
}

export async function updateUserById(
  client: PoolClient,
  userId: string,
  fields: { role?: TenantAssignableRole; status?: UserStatus },
): Promise<number> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (fields.role !== undefined) {
    sets.push(`role = $${i++}`);
    values.push(fields.role);
  }
  if (fields.status !== undefined) {
    sets.push(`status = $${i++}`);
    values.push(fields.status);
  }
  if (sets.length === 0) return 0;

  sets.push('updated_at = NOW()');
  values.push(userId);

  const q = `UPDATE users SET ${sets.join(', ')} WHERE id = $${i}`;
  const result = await client.query(q, values);
  return result.rowCount ?? 0;
}

export async function countOtherActiveTenantAdmins(
  client: PoolClient,
  excludeUserId: string,
): Promise<number> {
  const result = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM users
     WHERE role = 'TENANT_ADMIN'
       AND status = 'active'
       AND id <> $1`,
    [excludeUserId],
  );
  return parseInt(result.rows[0]?.c ?? '0', 10);
}
