/**
 * ETAPA G — Fase Interna 3 — Rotas de autenticação.
 *
 *   POST /api/auth/login    → loginController
 *   POST /api/auth/refresh  → refreshController
 *   POST /api/auth/logout   → autenticado → logoutController
 */

import { Router } from 'express';
import { loginController, refreshController, logoutController } from './auth.controller';
import { authenticateMiddleware } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', authenticateMiddleware, logoutController);
