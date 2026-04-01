import { Router } from 'express';
import {
  runProcessController,
  preflightProcessController,
  guidanceOptionsController,
  createProcessController,
  getProcessController,
  getProcessHistoryController,
  executeProcessActionController,
  getComplianceReportController,
  getComplianceDossierController,
} from '../controllers/process.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireAuth } from '../middleware/require-auth';
import { requireTenant } from '../middleware/require-tenant';

export const processRouter = Router();

processRouter.post('/run', authenticateMiddleware, runProcessController);
processRouter.post('/preflight', preflightProcessController);
processRouter.get('/guidance-options', guidanceOptionsController);
processRouter.post('/', authenticateMiddleware, requireAuth, requireTenant, createProcessController);
processRouter.get('/:id', authenticateMiddleware, requireTenant, getProcessController);
processRouter.get('/:id/history', authenticateMiddleware, requireTenant, getProcessHistoryController);
processRouter.get('/:id/compliance-report', authenticateMiddleware, requireTenant, getComplianceReportController);
processRouter.get('/:id/compliance-dossier', authenticateMiddleware, requireTenant, getComplianceDossierController);
processRouter.post('/execute', authenticateMiddleware, requireAuth, requireTenant, executeProcessActionController);

