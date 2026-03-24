/**
 * FASE 38 — Configuração centralizada por ambiente.
 * FASE 45 — Validação explícita no bootstrap: falha precoce e mensagens seguras
 *            (sem secrets). Defaults apenas em desenvolvimento, onde são seguros.
 * ETAPA G / FASE INTERNA 3 — Adicionadas variáveis de banco de dados e JWT.
 *
 * Ponto único de leitura e validação de variáveis de ambiente.
 * Evita process.env espalhado pelo código.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

const BOOT_FAIL = '[licitaia-v2-api] Falha de bootstrap:';

const DEFAULT_DEV_PORT = 3001;
const DEFAULT_DEV_CORS_ORIGIN = 'http://localhost:3000';

function parseEnvironment(raw: string | undefined): AppEnvironment {
  const v = raw?.trim() ?? '';
  if (v === '') return 'development';
  if (v === 'development' || v === 'staging' || v === 'production') return v;
  throw new Error(
    `${BOOT_FAIL} NODE_ENV inválido. Valores aceitos: development, staging ou production.`,
  );
}

function parsePort(raw: string | undefined): number {
  const v = raw?.trim() ?? '';
  if (v === '') return DEFAULT_DEV_PORT;
  if (!/^\d+$/.test(v)) {
    throw new Error(
      `${BOOT_FAIL} PORT inválido: use um número inteiro entre 1 e 65535.`,
    );
  }
  const n = parseInt(v, 10);
  if (n < 1 || n > 65535) {
    throw new Error(
      `${BOOT_FAIL} PORT fora do intervalo permitido (1–65535).`,
    );
  }
  return n;
}

function normalizeCorsOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '*') {
    throw new Error(
      `${BOOT_FAIL} CORS_ORIGIN inválido: defina uma origem http(s) explícita (wildcard não é permitido).`,
    );
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      `${BOOT_FAIL} CORS_ORIGIN não é uma URL http(s) válida.`,
    );
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `${BOOT_FAIL} CORS_ORIGIN deve usar protocolo http ou https.`,
    );
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error(
      `${BOOT_FAIL} CORS_ORIGIN não pode conter credenciais na URL.`,
    );
  }
  return url.origin;
}

function resolveCorsOrigin(environment: AppEnvironment): string {
  const raw = process.env['CORS_ORIGIN'];
  const empty = raw === undefined || raw.trim() === '';

  if (environment === 'development') {
    if (empty) return DEFAULT_DEV_CORS_ORIGIN;
    return normalizeCorsOrigin(raw);
  }

  if (empty) {
    throw new Error(
      `${BOOT_FAIL} CORS_ORIGIN é obrigatório quando NODE_ENV é "${environment}".`,
    );
  }
  return normalizeCorsOrigin(raw);
}

const DEFAULT_DEV_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/licitaia_dev';
const DEFAULT_DEV_JWT_SECRET   = 'dev-only-secret-CHANGE-IN-PRODUCTION-never-use-this-value';
const DEFAULT_JWT_ACCESS_SECS  = 900;   // 15 minutos
const DEFAULT_JWT_REFRESH_DAYS = 7;

function resolveDatabaseUrl(environment: AppEnvironment): string {
  const raw = process.env['DATABASE_URL'];
  const empty = raw === undefined || raw.trim() === '';

  if (environment === 'development') {
    if (empty) return DEFAULT_DEV_DATABASE_URL;
    return raw.trim();
  }

  if (empty) {
    throw new Error(
      `${BOOT_FAIL} DATABASE_URL é obrigatória quando NODE_ENV é "${environment}".`,
    );
  }
  return raw.trim();
}

function resolveJwtSecret(environment: AppEnvironment): string {
  const raw = process.env['JWT_SECRET'];
  const empty = raw === undefined || raw.trim() === '';

  if (environment === 'development') {
    if (empty) {
      process.stderr.write(
        '[licitaia-v2-api] AVISO: JWT_SECRET não definida — usando segredo de desenvolvimento. ' +
          'NUNCA use este valor fora de desenvolvimento local.\n',
      );
      return DEFAULT_DEV_JWT_SECRET;
    }
    return raw.trim();
  }

  if (empty) {
    throw new Error(
      `${BOOT_FAIL} JWT_SECRET é obrigatória quando NODE_ENV é "${environment}".`,
    );
  }
  if (raw.trim().length < 32) {
    throw new Error(
      `${BOOT_FAIL} JWT_SECRET deve ter pelo menos 32 caracteres.`,
    );
  }
  return raw.trim();
}

function parsePositiveInt(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = parseInt(raw.trim(), 10);
  if (isNaN(n) || n < 1) {
    throw new Error(`${BOOT_FAIL} ${name} deve ser um inteiro positivo.`);
  }
  return n;
}

function buildValidatedConfig(): {
  port: number;
  environment: AppEnvironment;
  corsOrigin: string;
  aiAssistiveEnabled: boolean;
  service: string;
  version: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessExpiresSecs: number;
  jwtRefreshExpiresDays: number;
} {
  const environment = parseEnvironment(process.env['NODE_ENV']);
  const port = parsePort(process.env['PORT']);
  const corsOrigin = resolveCorsOrigin(environment);
  const databaseUrl = resolveDatabaseUrl(environment);
  const jwtSecret = resolveJwtSecret(environment);
  const jwtAccessExpiresSecs = parsePositiveInt(
    process.env['JWT_ACCESS_EXPIRES_SECS'],
    'JWT_ACCESS_EXPIRES_SECS',
    DEFAULT_JWT_ACCESS_SECS,
  );
  const jwtRefreshExpiresDays = parsePositiveInt(
    process.env['JWT_REFRESH_EXPIRES_DAYS'],
    'JWT_REFRESH_EXPIRES_DAYS',
    DEFAULT_JWT_REFRESH_DAYS,
  );

  return {
    port,
    environment,
    corsOrigin,
    aiAssistiveEnabled: process.env['AI_ASSISTIVE_ENABLED'] !== 'false',
    service: 'licitaia-v2-api',
    version: '2.0.0',
    databaseUrl,
    jwtSecret,
    jwtAccessExpiresSecs,
    jwtRefreshExpiresDays,
  } as const;
}

export const config = buildValidatedConfig();
