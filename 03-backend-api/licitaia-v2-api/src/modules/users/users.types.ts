/**
 * ETAPA G — Fase Interna 4 — Tipos do módulo de usuários (RBAC tenant).
 */

import type { UserRole, UserStatus } from '../auth/auth.types';

/** Papéis que podem ser atribuídos na gestão de usuários do tenant (Fase 4). */
export type TenantAssignableRole = 'TENANT_ADMIN' | 'TENANT_USER';

export interface CreateUserBody {
  email: string;
  name: string;
  password: string;
  role: TenantAssignableRole;
}

export interface PatchUserBody {
  role?: TenantAssignableRole;
  status?: UserStatus;
}

/** Resposta pública de usuário (sem dados sensíveis). */
export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
