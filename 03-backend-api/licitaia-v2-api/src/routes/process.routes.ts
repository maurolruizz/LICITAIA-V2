import { Router } from 'express';
import {
  runProcessController,
  preflightProcessController,
  guidanceOptionsController,
} from '../controllers/process.controller';
import { authenticateOptionalMiddleware } from '../middleware/authenticate-optional';

export const processRouter = Router();

// FI5: /api/process/run permanece público (regressão zero),
// mas aproveita contexto auth quando Bearer token estiver presente.
processRouter.post('/run', authenticateOptionalMiddleware, runProcessController);
processRouter.post('/preflight', preflightProcessController);
processRouter.get('/guidance-options', guidanceOptionsController);

