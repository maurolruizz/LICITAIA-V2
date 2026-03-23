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

export const processExecutionRouter = Router();

processExecutionRouter.get('/', listExecutionsController);
processExecutionRouter.get('/:id', getExecutionController);
