import { Router } from 'express';
import { authenticateMiddleware } from '../../middleware/authenticate';
import { requireTenantAdminMiddleware } from '../../middleware/require-tenant-admin';
import {
  getInstitutionalSettingsController,
  patchInstitutionalSettingsController,
} from './institutional-settings.controller';

export const institutionalSettingsRouter = Router();

institutionalSettingsRouter.get('/', authenticateMiddleware, getInstitutionalSettingsController);
institutionalSettingsRouter.patch(
  '/',
  authenticateMiddleware,
  requireTenantAdminMiddleware,
  patchInstitutionalSettingsController,
);
