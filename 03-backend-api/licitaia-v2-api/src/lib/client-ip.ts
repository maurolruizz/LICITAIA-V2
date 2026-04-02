import type { Request } from 'express';
import { isIP } from 'node:net';

function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice('::ffff:'.length);
  }
  if (trimmed === '::1') {
    return '127.0.0.1';
  }
  return trimmed;
}

function parseForwardedFirstIp(forwardedForHeader: string): string | null {
  const first = forwardedForHeader.split(',')[0]?.trim() ?? '';
  if (first === '') return null;
  const normalized = normalizeIp(first);
  return isIP(normalized) ? normalized : null;
}

/**
 * Resolve IP do cliente com política determinística:
 * - base sempre é req.socket.remoteAddress;
 * - X-Forwarded-For só é considerado quando trust proxy foi explicitamente habilitado.
 */
export function resolveClientIp(req: Request): string | null {
  const remoteAddress = req.socket?.remoteAddress;
  if (typeof remoteAddress !== 'string' || remoteAddress.trim() === '') {
    return null;
  }

  const normalizedRemoteIp = normalizeIp(remoteAddress);
  if (isIP(normalizedRemoteIp) === 0) {
    return null;
  }

  const trustProxy = req.app.get('trust proxy');
  const trustProxyEnabled =
    trustProxy === true ||
    (typeof trustProxy === 'number' && trustProxy > 0) ||
    (typeof trustProxy === 'string' && trustProxy.trim() !== '' && trustProxy.trim() !== '0');

  if (!trustProxyEnabled) {
    return normalizedRemoteIp;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor !== 'string') {
    return normalizedRemoteIp;
  }

  const forwardedIp = parseForwardedFirstIp(forwardedFor);
  return forwardedIp ?? normalizedRemoteIp;
}
