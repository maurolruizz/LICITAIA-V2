/**
 * ETAPA G — Fase Interna 4 — Service de usuários (RBAC + auditoria).
 */

import bcrypt from 'bcryptjs';
import { withTenantContext } from '../../lib/db';
import { findUserById, insertAuditLog } from '../auth/auth.repository';
import type { UserRecord, UserStatus } from '../auth/auth.types';
import {
  listUsersInTenant,
  insertUser,
  updateUserById,
  countOtherActiveTenantAdmins,
} from './users.repository';
import type {
  CreateUserBody,
  PatchUserBody,
  UserPublic,
  TenantAssignableRole,
} from './users.types';
import type { UserRole } from '../auth/auth.types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;

export class UsersError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'UsersError';
  }
}

function toPublic(u: UserRecord | UserRowLike): UserPublic {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

interface UserRowLike {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRowToRecord(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): UserRowLike {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertAssignableRole(role: string): role is TenantAssignableRole {
  return role === 'TENANT_ADMIN' || role === 'TENANT_USER';
}

export async function getMe(
  tenantId: string,
  userId: string,
): Promise<UserPublic> {
  return await withTenantContext(tenantId, async (client) => {
    const user = await findUserById(client, userId);
    if (!user) {
      throw new UsersError('Usuário não encontrado.', 'USER_NOT_FOUND', 404);
    }
    return toPublic(user);
  });
}

export async function listUsers(
  tenantId: string,
): Promise<{ users: UserPublic[] }> {
  return await withTenantContext(tenantId, async (client) => {
    const rows = await listUsersInTenant(client);
    return {
      users: rows.map((r) => toPublic(mapRowToRecord(r))),
    };
  });
}

export async function createUser(
  tenantId: string,
  actorUserId: string,
  body: CreateUserBody,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<{ user: UserPublic }> {
  const email = body.email?.trim().toLowerCase() ?? '';
  const name = body.name?.trim() ?? '';
  const password = body.password ?? '';
  const role = body.role;

  if (!email || !name || !password) {
    throw new UsersError(
      'email, name e password são obrigatórios.',
      'VALIDATION_ERROR',
      400,
    );
  }
  if (!EMAIL_RE.test(email)) {
    throw new UsersError('Email inválido.', 'VALIDATION_ERROR', 400);
  }
  if (name.length === 0) {
    throw new UsersError('Nome não pode ser vazio.', 'VALIDATION_ERROR', 400);
  }
  if (!assertAssignableRole(role)) {
    throw new UsersError(
      'role inválida. Use TENANT_ADMIN ou TENANT_USER.',
      'INVALID_ROLE',
      400,
    );
  }

  return await withTenantContext(tenantId, async (client) => {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    let newId: string;
    try {
      newId = await insertUser(client, {
        tenantId,
        email,
        name,
        passwordHash,
        role,
        createdBy: actorUserId,
      });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === '23505') {
        throw new UsersError(
          'Já existe usuário com este email neste tenant.',
          'EMAIL_DUPLICATE',
          409,
        );
      }
      throw err;
    }

    const created = await findUserById(client, newId);
    if (!created) {
      throw new UsersError('Falha ao carregar usuário criado.', 'INTERNAL_ERROR', 500);
    }

    await insertAuditLog(client, {
      tenantId,
      userId: actorUserId,
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: newId,
      metadata: {
        email,
        name,
        role,
        createdUserId: newId,
      },
      ipAddress,
      userAgent,
    });

    return { user: toPublic(created) };
  });
}

export async function patchUser(
  tenantId: string,
  actorUserId: string,
  targetUserId: string,
  body: PatchUserBody,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<{ user: UserPublic }> {
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(targetUserId)) {
    throw new UsersError('Identificador de usuário inválido.', 'VALIDATION_ERROR', 400);
  }

  if (body.role === undefined && body.status === undefined) {
    throw new UsersError(
      'Informe ao menos role ou status.',
      'VALIDATION_ERROR',
      400,
    );
  }

  if (body.role !== undefined && !assertAssignableRole(body.role)) {
    throw new UsersError(
      'role inválida. Use TENANT_ADMIN ou TENANT_USER.',
      'INVALID_ROLE',
      400,
    );
  }

  return await withTenantContext(tenantId, async (client) => {
    const target = await findUserById(client, targetUserId);
    if (!target) {
      throw new UsersError('Usuário não encontrado.', 'USER_NOT_FOUND', 404);
    }

    const newRole = body.role;
    const newStatus = body.status;

    if (newRole !== undefined && newRole !== target.role) {
      if (target.role === 'TENANT_ADMIN' && newRole === 'TENANT_USER') {
        const others = await countOtherActiveTenantAdmins(client, targetUserId);
        if (target.status === 'active' && others < 1) {
          throw new UsersError(
            'Não é permitido remover o último administrador ativo do tenant.',
            'LAST_ADMIN_PROTECTED',
            409,
          );
        }
      }
    }

    if (newStatus !== undefined && newStatus !== target.status) {
      const becomesInactive =
        newStatus === 'inactive' || newStatus === 'suspended';
      if (becomesInactive && target.role === 'TENANT_ADMIN' && target.status === 'active') {
        const others = await countOtherActiveTenantAdmins(client, targetUserId);
        if (others < 1) {
          throw new UsersError(
            'Não é permitido desativar o último administrador ativo do tenant.',
            'LAST_ADMIN_PROTECTED',
            409,
          );
        }
      }
    }

    const updated = await updateUserById(client, targetUserId, {
      role: newRole,
      status: newStatus,
    });
    if (updated === 0) {
      throw new UsersError('Usuário não encontrado.', 'USER_NOT_FOUND', 404);
    }

    const fresh = await findUserById(client, targetUserId);
    if (!fresh) {
      throw new UsersError('Usuário não encontrado.', 'USER_NOT_FOUND', 404);
    }

    if (newRole !== undefined && newRole !== target.role) {
      await insertAuditLog(client, {
        tenantId,
        userId: actorUserId,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: targetUserId,
        metadata: {
          targetUserId,
          previousRole: target.role,
          newRole,
        },
        ipAddress,
        userAgent,
      });
    }

    if (newStatus !== undefined && newStatus !== target.status) {
      const deactivated =
        newStatus === 'inactive' || newStatus === 'suspended';
      if (deactivated) {
        await insertAuditLog(client, {
          tenantId,
          userId: actorUserId,
          action: 'USER_DEACTIVATED',
          resourceType: 'user',
          resourceId: targetUserId,
          metadata: {
            targetUserId,
            previousStatus: target.status,
            newStatus,
          },
          ipAddress,
          userAgent,
        });
      } else {
        await insertAuditLog(client, {
          tenantId,
          userId: actorUserId,
          action: 'USER_UPDATED',
          resourceType: 'user',
          resourceId: targetUserId,
          metadata: {
            targetUserId,
            previousStatus: target.status,
            newStatus,
            field: 'status',
          },
          ipAddress,
          userAgent,
        });
      }
    }

    return { user: toPublic(fresh) };
  });
}
