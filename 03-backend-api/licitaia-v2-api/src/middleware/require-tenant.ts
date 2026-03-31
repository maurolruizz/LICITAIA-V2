import type { Request, Response, NextFunction } from 'express';
import { withInstitutionalMeta } from '../lib/response-meta';
import type { AuthenticatedContext } from '../modules/auth/auth.types';

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }
  next();
}
