import type { Request, Response, NextFunction } from 'express';
import { authenticateMiddleware } from './authenticate';

/**
 * Variante opcional do middleware de autenticação.
 *
 * Regra: NÃO bloqueia a rota quando o token está ausente.
 * Se o cliente enviar Authorization: Bearer <token>, valida normalmente.
 *
 * Uso típico: rotas que devem permanecer públicas por regressão,
 * mas podem aproveitar tenant/user quando autenticadas (FI5).
 */
export async function authenticateOptionalMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  await authenticateMiddleware(req, res, next);
}
