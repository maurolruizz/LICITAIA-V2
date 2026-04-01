import type { NextFunction, Request, Response } from 'express';
import { buildInstitutionalMeta } from '../lib/response-meta';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
};

type CounterEntry = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, CounterEntry>();

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim() !== '') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown-forwarded';
  }
  return req.ip || 'unknown-ip';
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const keyPrefix = options.keyPrefix ?? 'rate-limit';

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const now = Date.now();
    const clientId = getClientIdentifier(req);
    const key = `${keyPrefix}:${clientId}`;
    const current = counters.get(key);

    if (!current || current.resetAt <= now) {
      counters.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (current.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisições excedido. Tente novamente em instantes.',
        },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }

    current.count += 1;
    counters.set(key, current);
    next();
  };
}

