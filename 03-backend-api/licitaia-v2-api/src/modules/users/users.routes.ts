/**
 * ETAPA G — Fase Interna 4 — Rotas /api/users
 *
 *   GET  /api/users/me      → autenticado (qualquer papel ativo)
 *   POST /api/users         → TENANT_ADMIN
 *   GET  /api/users         → TENANT_ADMIN
 *   PATCH /api/users/:id    → TENANT_ADMIN
 */

import { Router } from 'express';
import { authenticateMiddleware } from '../../middleware/authenticate';
import { requireTenantAdminMiddleware } from '../../middleware/require-tenant-admin';
import {
  getMeController,
  listUsersController,
  createUserController,
  patchUserController,
} from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authenticateMiddleware, getMeController);

usersRouter.post(
  '/',
  authenticateMiddleware,
  requireTenantAdminMiddleware,
  createUserController,
);

usersRouter.get(
  '/',
  authenticateMiddleware,
  requireTenantAdminMiddleware,
  listUsersController,
);

usersRouter.patch(
  '/:id',
  authenticateMiddleware,
  requireTenantAdminMiddleware,
  patchUserController,
);
