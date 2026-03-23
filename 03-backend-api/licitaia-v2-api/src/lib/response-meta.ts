/**
 * FASE 48 — Metadados institucionais de resposta (envelope mínimo).
 *
 * PADRÃO INSTITUCIONAL DEFINITIVO (borda HTTP)
 * ─────────────────────────────────────────────
 * `meta` (sempre presente nas respostas JSON desta API):
 *   - requestId, timestamp, service, version, environment
 *   - Fonte única para identidade da requisição e do processo API neste instante.
 *
 * Raiz do JSON:
 *   - Campos do contrato do endpoint (negócio, health, diagnóstico operacional, etc.).
 *   - Nunca duplicar em raiz o que já está em `meta` (timestamp, requestId, service,
 *     version, environment), salvo exceção explícita de compatibilidade documentada
 *     no próprio endpoint.
 *
 * Exceção atual (compatibilidade demo / healthcheck legado):
 *   - GET /health mantém service, version, environment na raiz para consumidores que
 *     ainda leem esses campos fora de `meta`; timestamp da resposta existe só em
 *     `meta.timestamp` (sem duplicação).
 *
 * GET /diagnostics:
 *   - Raiz: apenas dados operacionais exclusivos (kind, uptimeSeconds, capabilities).
 *   - Identidade e correlação: somente via `meta`.
 *
 * Não expõe secrets; não acessa domínio administrativo.
 */

import type { Response } from 'express';
import { config, type AppEnvironment } from '../config/env';

export type InstitutionalMeta = {
  requestId: string;
  timestamp: string;
  service: string;
  version: string;
  environment: AppEnvironment;
};

export function buildInstitutionalMeta(res: Response): InstitutionalMeta {
  const requestId = (res.locals['requestId'] as string | undefined) ?? '';
  return {
    requestId,
    timestamp: new Date().toISOString(),
    service: config.service,
    version: config.version,
    environment: config.environment,
  };
}

/**
 * Anexa `meta` ao corpo. A raiz deve conter apenas o payload do endpoint,
 * sem repetir campos de `InstitutionalMeta`.
 */
export function withInstitutionalMeta<T extends object>(
  res: Response,
  body: T,
): T & { meta: InstitutionalMeta } {
  return { ...body, meta: buildInstitutionalMeta(res) };
}
