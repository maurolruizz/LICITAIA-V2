/**
 * FASE 38 — Logger operacional mínimo.
 * FASE 43 — Enriquecido com requestId e duração para observabilidade auditável.
 *
 * Logging estruturado e legível sem bibliotecas externas.
 * Não expõe dados sensíveis. Sem verbosidade caótica.
 * Formato: [LEVEL] ISO_TIMESTAMP — mensagem
 */

import { config } from '../config/env';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string): void {
  const line = `[${level}] ${timestamp()} — ${message}`;
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string): void => write('INFO', message),
  warn: (message: string): void => write('WARN', message),
  error: (message: string): void => write('ERROR', message),
};

export function logRequest(
  method: string,
  path: string,
  status: number,
  requestId?: string,
  durationMs?: number,
): void {
  if (config.environment !== 'production') {
    const parts: string[] = [`${method} ${path} → ${status}`];
    if (durationMs !== undefined) parts.push(`${durationMs}ms`);
    if (requestId) parts.push(`[rid:${requestId}]`);
    logger.info(parts.join(' '));
  }
}
