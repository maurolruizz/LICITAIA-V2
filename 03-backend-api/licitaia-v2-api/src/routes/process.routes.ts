import { Router } from 'express';
import { runProcessController } from '../controllers/process.controller';

export const processRouter = Router();

processRouter.post('/run', runProcessController);

