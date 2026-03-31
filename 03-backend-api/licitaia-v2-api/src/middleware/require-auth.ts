import type { Request, Response, NextFunction } from 'express';
import { withInstitutionalMeta } from '../lib/response-meta';
import type { AuthenticatedContext } from '../modules/auth/auth.types';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedUserId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto de autenticação ausente.' },
      }),
    );
    return;
  }
  next();
}
