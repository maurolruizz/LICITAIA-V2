import { Router } from 'express';
import {
  runProcessController,
  preflightProcessController,
  guidanceOptionsController,
} from '../controllers/process.controller';
import { authenticateMiddleware } from '../middleware/authenticate';

export const processRouter = Router();

processRouter.post('/run', authenticateMiddleware, runProcessController);
processRouter.post('/preflight', preflightProcessController);
processRouter.get('/guidance-options', guidanceOptionsController);

