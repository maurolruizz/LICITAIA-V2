/**
 * FASE 38 — Backend operacional mínimo para uso externo controlado.
 * FASE 43 — Observabilidade auditável: correlação por requestId e logs operacionais seguros.
 * FASE 44 — Hardening da superfície HTTP: x-powered-by desabilitado, limite de payload,
 *            headers mínimos de segurança HTTP.
 * FASE 45 — Configuração validada em ./config/env no carregamento do módulo; falha de
 *            bootstrap antes de app.listen se variáveis essenciais forem inválidas.
 * FASE 46 — Encerramento gracioso: SIGINT/SIGTERM, server.close(), shutdown idempotente,
 *            timeout defensivo para não pendurar o processo indefinidamente.
 * FASE 47 — GET /diagnostics: diagnóstico operacional controlado (distinto de /health).
 * FASE 48 — Meta institucional (`meta`) e erros com `error.code` alinhados na borda HTTP.
 * ETAPA G / FASE INTERNA 3 — Autenticação JWT + tenant resolution.
 *            Novo módulo auth: POST /api/auth/login, /api/auth/refresh, /api/auth/logout.
 *            Middleware authenticateMiddleware disponível para rotas protegidas.
 * ETAPA G / FASE INTERNA 4 — RBAC + módulo de usuários: /api/users (JWT + TENANT_ADMIN).
 *            Rotas do motor e /api/process/run permanecem sem auth indevido.
 *
 * Integra: config por ambiente, CORS controlado, healthcheck,
 * correlação por requestId, logging mínimo com duração, 404 e error handler global.
 * O contrato do /api/process/run (Fases 33/34) permanece intocável.
 */

import 'dotenv/config';
import { appendFileSync } from 'fs';
import type { Server } from 'http';
import express from 'express';
import { json } from 'express';
import { config } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { correlationMiddleware } from './middleware/correlation';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { logger, logRequest } from './middleware/logger';
import { createRateLimitMiddleware } from './middleware/rate-limit';
import { notFoundHandler, globalErrorHandler } from './middleware/error';
import { healthRouter } from './routes/health.routes';
import { diagnosticsRouter } from './routes/diagnostics.routes';
import { processRouter } from './routes/process.routes';
import { processExecutionRouter } from './modules/process-execution/process-execution.routes';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { institutionalSettingsRouter } from './modules/institutional-settings/institutional-settings.routes';

const app = express();
const authRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60_000,
  maxRequests: 30,
  keyPrefix: 'auth',
});
const processRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60_000,
  maxRequests: 120,
  keyPrefix: 'process',
});

// FASE 44 — Remove o header "X-Powered-By: Express" da superfície HTTP.
app.disable('x-powered-by');

// --- Middlewares de borda ---
app.use(corsMiddleware);

// --- Correlação de requisições (FASE 43) ---
// Deve rodar ANTES do json() para garantir que requestId esteja sempre
// disponível em res.locals — inclusive quando json() falha com corpo inválido.
app.use(correlationMiddleware);

// FASE 44 — Headers mínimos de segurança HTTP aplicados universalmente.
// Roda após correlação (requestId já disponível) e antes do parsing do corpo.
app.use(securityHeadersMiddleware);

// FASE 44 — Limite explícito de 100 KB para o corpo JSON.
// Previne payloads abusivos sem bloquear requisições legítimas do fluxo real.
app.use(json({ limit: '100kb' }));

// --- Logging de ciclo de vida da requisição (FASE 43) ---
// req.originalUrl é capturado aqui — antes do roteamento — garantindo que
// início e fim do log registrem exatamente a mesma URL completa.
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = res.locals['requestId'] as string;
  const url = req.originalUrl;
  logger.info(`→ ${req.method} ${url} [rid:${requestId}]`);
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logRequest(req.method, url, res.statusCode, requestId, durationMs);
  });
  next();
});

// --- Rotas ---
app.use('/health', healthRouter);
app.use('/diagnostics', diagnosticsRouter);
app.use('/api/auth', authRateLimitMiddleware, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/institutional-settings', institutionalSettingsRouter);
app.use('/api/process', processRateLimitMiddleware, processRouter);
// FI5: endpoint seguro de histórico preferencial: /api/process/executions
// Mantém alias /api/process-executions para compatibilidade, ambos protegidos por auth no router.
app.use('/api/process/executions', processRateLimitMiddleware, processExecutionRouter);
app.use('/api/process-executions', processRateLimitMiddleware, processExecutionRouter);

// --- Handlers de borda (devem ser os últimos) ---
app.use(notFoundHandler);
app.use(globalErrorHandler);

// --- Inicialização e lifecycle (FASE 46) ---
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server!: Server;
let shutdownInProgress = false;

/**
 * Linhas de auditoria de shutdown: stderr síncrono + arquivo opcional (Fase 46).
 * SHUTDOWN_AUDIT_FILE só deve ser usado em provas locais/CI — não definir em produção.
 */
function shutdownAuditLine(message: string): void {
  try {
    process.stderr.write(`${message}\n`);
  } catch {
    /* ignore */
  }
  const auditPath = process.env['SHUTDOWN_AUDIT_FILE'];
  if (auditPath && auditPath.trim() !== '') {
    try {
      appendFileSync(auditPath.trim(), `${new Date().toISOString()} ${message}\n`);
    } catch {
      /* ignore */
    }
  }
}

function gracefulShutdown(signal: string): void {
  if (shutdownInProgress) {
    const dup = `[SHUTDOWN] Sinal ${signal} recebido novamente; encerramento já em andamento — ignorado.`;
    shutdownAuditLine(dup);
    logger.warn(dup);
    return;
  }
  shutdownInProgress = true;

  const startMsg = `[SHUTDOWN] Sinal ${signal} recebido; encerramento ordenado do servidor HTTP iniciado.`;
  shutdownAuditLine(startMsg);
  logger.info(startMsg);

  const forceExitTimer = setTimeout(() => {
    const timeoutMsg = '[SHUTDOWN] Timeout de encerramento excedido; forçando saída do processo.';
    shutdownAuditLine(timeoutMsg);
    logger.error(timeoutMsg);
    setImmediate(() => process.exit(1));
  }, SHUTDOWN_TIMEOUT_MS);

  server.close((closeErr) => {
    clearTimeout(forceExitTimer);
    if (closeErr) {
      const errMsg = `[SHUTDOWN] Falha ao fechar servidor HTTP: ${closeErr.message}`;
      shutdownAuditLine(errMsg);
      logger.error(errMsg);
      setImmediate(() => process.exit(1));
      return;
    }
    const closedMsg = '[SHUTDOWN] Servidor HTTP fechado; conexões novas não são mais aceitas.';
    shutdownAuditLine(closedMsg);
    logger.info(closedMsg);
    const doneMsg = '[SHUTDOWN] Encerramento ordenado concluído.';
    shutdownAuditLine(doneMsg);
    logger.info(doneMsg);
    setImmediate(() => process.exit(0));
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

server = app.listen(config.port, () => {
  logger.info(`${config.service} v${config.version} iniciado`);
  logger.info(`ambiente: ${config.environment} | porta: ${config.port}`);
  logger.info(`CORS permitido para: ${config.corsOrigin}`);
});

/**
 * Prova automatizada (Windows): o mesmo gracefulShutdown dos sinais, disparado por stdin
 * quando F46_SHUTDOWN_STDIN=1 e o token __F46_SHUTDOWN__ aparece — não substitui SIGINT/SIGTERM
 * em Linux/produção; só habilita evidência de server.close + logs onde kill POSIX não chega ao Node.
 */
if (process.env['F46_SHUTDOWN_STDIN'] === '1') {
  let acc = '';
  const token = '__F46_SHUTDOWN__';
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  process.stdin.on('data', (chunk: string) => {
    acc += chunk;
    while (acc.includes(token)) {
      acc = acc.replace(token, '');
      gracefulShutdown('SIGTERM');
    }
  });
}
