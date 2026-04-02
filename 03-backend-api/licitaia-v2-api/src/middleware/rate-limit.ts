import type { NextFunction, Request, Response } from 'express';
import { buildInstitutionalMeta } from '../lib/response-meta';
import { resolveClientIp } from '../lib/client-ip';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  store?: RateLimitStore;
};

type CounterEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  get(key: string): CounterEntry | undefined;
  set(key: string, value: CounterEntry): void;
};

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, CounterEntry>();

  get(key: string): CounterEntry | undefined {
    return this.counters.get(key);
  }

  set(key: string, value: CounterEntry): void {
    this.counters.set(key, value);
  }
}

const defaultStore = new InMemoryRateLimitStore();

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const keyPrefix = options.keyPrefix ?? 'rate-limit';
  const store = options.store ?? defaultStore;

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const clientIp = resolveClientIp(req);
    if (!clientIp) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CLIENT_IP_RESOLUTION_FAILED',
          message: 'Nao foi possivel determinar o IP de origem da requisicao.',
        },
        meta: buildInstitutionalMeta(res),
      });
      return;
    }

    const now = Date.now();
    const key = `${keyPrefix}:${clientIp}`;
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, {
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
    store.set(key, current);
    next();
  };
}

