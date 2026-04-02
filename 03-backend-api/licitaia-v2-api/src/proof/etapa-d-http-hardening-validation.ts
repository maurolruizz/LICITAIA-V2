import http from 'node:http';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

const PROOF_PORT = 3011;
const API_BASE = `http://127.0.0.1:${PROOF_PORT}`;
const MAX_USERS_REQUESTS = 5;
const WINDOW_RESET_MS = 11_000;

function fail(message: string): never {
  throw new Error(`[ETAPA_D_HARDENING_FAIL] ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(
  method: string,
  path: string,
  headers?: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port),
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            body: data,
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function waitUntilHealthy(timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await request('GET', '/health');
      if (res.status === 200) return;
    } catch {
      // retry
    }
    await sleep(300);
  }
  fail('API não ficou saudável no tempo esperado.');
}

function startServer(): ChildProcessWithoutNullStreams {
  const child = spawn(
    process.execPath,
    ['-r', 'ts-node/register', 'src/server.ts'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(PROOF_PORT),
        TRUST_PROXY_HOPS: '0',
      },
      stdio: 'pipe',
    },
  );
  child.stderr.on('data', () => {
    // Mantém fluxo de stderr drenado para evitar bloqueio do processo.
  });
  child.stdout.on('data', () => {
    // Mantém fluxo de stdout drenado para evitar bloqueio do processo.
  });
  return child;
}

async function main(): Promise<void> {
  const server = startServer();
  try {
    await waitUntilHealthy(20_000);

    // CENARIO 1 — SPOOF: múltiplos X-Forwarded-For diferentes devem continuar no mesmo bucket.
    let spoofBlocked = false;
    for (let i = 0; i < MAX_USERS_REQUESTS + 1; i += 1) {
      const spoofIp = `198.51.100.${i + 10}`;
      const res = await request('GET', '/api/users', {
        'X-Forwarded-For': spoofIp,
      });
      if (res.status === 429) {
        spoofBlocked = true;
        break;
      }
    }
    if (!spoofBlocked) {
      fail('CENARIO 1 falhou: spoof por X-Forwarded-For não foi bloqueado.');
    }

    await sleep(WINDOW_RESET_MS);

    // CENARIO 2 — RATE LIMIT: abuso sequencial deve gerar 429.
    let rateLimitHit = false;
    for (let i = 0; i < MAX_USERS_REQUESTS + 1; i += 1) {
      const res = await request('GET', '/api/users');
      if (res.status === 429) {
        rateLimitHit = true;
        break;
      }
    }
    if (!rateLimitHit) {
      fail('CENARIO 2 falhou: rate limit de /api/users não retornou 429.');
    }

    await sleep(WINDOW_RESET_MS);

    // CENARIO 3 — FLUXO NORMAL: rota não limitada deve continuar íntegra.
    const normalFlow = await request('GET', '/health');
    if (normalFlow.status !== 200) {
      fail(`CENARIO 3 falhou: fluxo normal inválido (HTTP ${normalFlow.status}).`);
    }

    console.log('[ETAPA_D_HARDENING_OK]');
    console.log('[ETAPA_D_EVIDENCE] spoof_blocked=OK');
    console.log('[ETAPA_D_EVIDENCE] rate_limit=OK');
  } finally {
    server.kill('SIGTERM');
    await sleep(500);
  }
}

void main();
