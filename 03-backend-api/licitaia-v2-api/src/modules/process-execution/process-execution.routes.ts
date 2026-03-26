/**
 * FASE 40 — Rotas dos endpoints de execuções persistidas.
 *
 * Registradas em server.ts sob /api/process-executions.
 */

import { Router } from 'express';
import {
  listExecutionsController,
  getExecutionController,
} from './process-execution.controller';
import { authenticateMiddleware } from '../../middleware/authenticate';

export const processExecutionRouter = Router();

// FI5: histórico de execuções é endpoint seguro (exige auth + tenant context).
processExecutionRouter.get('/', authenticateMiddleware, listExecutionsController);
processExecutionRouter.get('/:id', authenticateMiddleware, getExecutionController);
