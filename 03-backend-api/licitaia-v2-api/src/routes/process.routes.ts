import { Router } from 'express';
import {
  runProcessController,
  preflightProcessController,
  guidanceOptionsController,
} from '../controllers/process.controller';

export const processRouter = Router();

processRouter.post('/run', runProcessController);
processRouter.post('/preflight', preflightProcessController);
processRouter.get('/guidance-options', guidanceOptionsController);

