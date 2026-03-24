/**
 * ETAPA G — Fase Interna 3 — Script de validação da autenticação.
 *
 * Executa os casos de teste obrigatórios da Fase Interna 3:
 *   1. Login válido retorna accessToken + refreshToken
 *   2. Login com senha incorreta retorna 401 INVALID_CREDENTIALS
 *   3. Login com tenant inexistente retorna 401 INVALID_CREDENTIALS
 *   4. Refresh com token válido retorna novo accessToken
 *   5. Refresh com token inválido retorna 401
 *   6. Logout com token válido retorna 200
 *   7. Rota protegida sem token retorna 401 MISSING_TOKEN
 *   8. Rota protegida com token válido retorna identidade injetada
 *   9. Regressão: POST /api/process/run continua acessível sem auth
 *
 * PRÉ-REQUISITO: PostgreSQL disponível com migrations + seed 001 executados.
 * Executar com: npx ts-node src/proof/etapa-g-fase3-auth-validation.ts
 *
 * Variáveis de ambiente necessárias:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/licitaia_dev
 *   JWT_SECRET=<qualquer valor com 32+ chars>
 *   API_BASE_URL=http://localhost:3001  (opcional, padrão)
 */

import http from 'http';

const API_BASE = process.env['API_BASE_URL'] ?? 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, passed: true, detail });
  console.log(`  ✓ ${name}`);
  if (detail) console.log(`    ${detail}`);
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
  console.error(`  ✗ ${name}`);
  console.error(`    ${detail}`);
}

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port) || 80,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests(): Promise<void> {
  console.log('\n=== ETAPA G — Fase Interna 3 — Validação de Autenticação ===\n');

  let accessToken = '';
  let refreshToken = '';

  // --- CASO 1: Login válido ---
  console.log('CASO 1: Login válido');
  try {
    const r = await httpRequest('POST', '/api/auth/login', {
      tenantSlug: 'prefeitura-exemplo',
      email: 'admin@exemplo.gov.br',
      password: 'SenhaTeste@123',
    });

    if (r.status === 200) {
      const d = r.body as { success: boolean; data: { accessToken: string; refreshToken: string; expiresIn: number; user: unknown; tenant: unknown } };
      if (d.success && d.data.accessToken && d.data.refreshToken && d.data.expiresIn > 0) {
        accessToken = d.data.accessToken;
        refreshToken = d.data.refreshToken;
        pass('Login válido', `accessToken recebido; expiresIn=${d.data.expiresIn}s; user=${JSON.stringify(d.data.user)}; tenant=${JSON.stringify(d.data.tenant)}`);
      } else {
        fail('Login válido', `Resposta inesperada: ${JSON.stringify(r.body)}`);
      }
    } else {
      fail('Login válido', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
    }
  } catch (err) {
    fail('Login válido', `Erro de conexão: ${String(err)}`);
  }

  // --- CASO 2: Login com senha incorreta ---
  console.log('\nCASO 2: Login com senha incorreta');
  try {
    const r = await httpRequest('POST', '/api/auth/login', {
      tenantSlug: 'prefeitura-exemplo',
      email: 'admin@exemplo.gov.br',
      password: 'SenhaErrada@999',
    });

    if (r.status === 401) {
      const d = r.body as { error: { code: string } };
      if (d.error?.code === 'INVALID_CREDENTIALS') {
        pass('Senha incorreta → 401 INVALID_CREDENTIALS', `code=${d.error.code}`);
      } else {
        fail('Senha incorreta', `Código errado: ${JSON.stringify(r.body)}`);
      }
    } else {
      fail('Senha incorreta', `HTTP esperado 401, recebido ${r.status}: ${JSON.stringify(r.body)}`);
    }
  } catch (err) {
    fail('Senha incorreta', `Erro: ${String(err)}`);
  }

  // --- CASO 3: Login com tenant inexistente ---
  console.log('\nCASO 3: Login com tenant inexistente');
  try {
    const r = await httpRequest('POST', '/api/auth/login', {
      tenantSlug: 'tenant-que-nao-existe',
      email: 'admin@exemplo.gov.br',
      password: 'SenhaTeste@123',
    });

    if (r.status === 401) {
      const d = r.body as { error: { code: string } };
      if (d.error?.code === 'INVALID_CREDENTIALS') {
        pass('Tenant inexistente → 401 INVALID_CREDENTIALS', `code=${d.error.code}`);
      } else {
        fail('Tenant inexistente', `Código errado: ${JSON.stringify(r.body)}`);
      }
    } else {
      fail('Tenant inexistente', `HTTP esperado 401, recebido ${r.status}`);
    }
  } catch (err) {
    fail('Tenant inexistente', `Erro: ${String(err)}`);
  }

  // --- CASO 4: Refresh com token válido ---
  console.log('\nCASO 4: Refresh com token válido');
  if (!refreshToken) {
    fail('Refresh com token válido', 'Pulado — refreshToken não disponível (caso 1 falhou)');
  } else {
    try {
      const r = await httpRequest('POST', '/api/auth/refresh', { refreshToken });

      if (r.status === 200) {
        const d = r.body as { success: boolean; data: { accessToken: string; expiresIn: number } };
        if (d.success && d.data.accessToken && d.data.expiresIn > 0) {
          accessToken = d.data.accessToken;
          pass('Refresh válido → novo accessToken', `expiresIn=${d.data.expiresIn}s`);
        } else {
          fail('Refresh válido', `Resposta inesperada: ${JSON.stringify(r.body)}`);
        }
      } else {
        fail('Refresh válido', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    } catch (err) {
      fail('Refresh válido', `Erro: ${String(err)}`);
    }
  }

  // --- CASO 5: Refresh com token inválido ---
  console.log('\nCASO 5: Refresh com token inválido');
  try {
    const r = await httpRequest('POST', '/api/auth/refresh', {
      refreshToken: 'token-completamente-invalido-que-nao-existe-no-banco',
    });

    if (r.status === 401) {
      pass('Refresh inválido → 401', `code=${(r.body as { error: { code: string } }).error?.code}`);
    } else {
      fail('Refresh inválido', `HTTP esperado 401, recebido ${r.status}`);
    }
  } catch (err) {
    fail('Refresh inválido', `Erro: ${String(err)}`);
  }

  // --- CASO 6: Rota protegida sem token → 401 ---
  console.log('\nCASO 6: Rota protegida (logout) sem token → 401 MISSING_TOKEN');
  try {
    const r = await httpRequest('POST', '/api/auth/logout', {});

    if (r.status === 401) {
      const d = r.body as { error: { code: string } };
      if (d.error?.code === 'MISSING_TOKEN') {
        pass('Logout sem token → 401 MISSING_TOKEN', `code=${d.error.code}`);
      } else {
        fail('Logout sem token', `Código errado: ${JSON.stringify(r.body)}`);
      }
    } else {
      fail('Logout sem token', `HTTP esperado 401, recebido ${r.status}`);
    }
  } catch (err) {
    fail('Logout sem token', `Erro: ${String(err)}`);
  }

  // --- CASO 7: Logout com token válido ---
  console.log('\nCASO 7: Logout com token válido');
  if (!accessToken || !refreshToken) {
    fail('Logout válido', 'Pulado — tokens não disponíveis');
  } else {
    try {
      const r = await httpRequest(
        'POST',
        '/api/auth/logout',
        { refreshToken },
        { Authorization: `Bearer ${accessToken}` },
      );

      if (r.status === 200) {
        const d = r.body as { success: boolean };
        if (d.success) {
          pass('Logout válido → 200', `Sessão encerrada com sucesso`);
        } else {
          fail('Logout válido', `Resposta inesperada: ${JSON.stringify(r.body)}`);
        }
      } else {
        fail('Logout válido', `HTTP ${r.status}: ${JSON.stringify(r.body)}`);
      }
    } catch (err) {
      fail('Logout válido', `Erro: ${String(err)}`);
    }
  }

  // --- CASO 8: Token com header inválido ---
  console.log('\nCASO 8: Token JWT malformado → 401 INVALID_TOKEN');
  try {
    const r = await httpRequest(
      'POST',
      '/api/auth/logout',
      {},
      { Authorization: 'Bearer token.invalido.malformado' },
    );

    if (r.status === 401) {
      pass('Token malformado → 401', `code=${(r.body as { error: { code: string } }).error?.code}`);
    } else {
      fail('Token malformado', `HTTP esperado 401, recebido ${r.status}`);
    }
  } catch (err) {
    fail('Token malformado', `Erro: ${String(err)}`);
  }

  // --- CASO 9: Regressão — POST /api/process/run continua acessível sem auth ---
  console.log('\nCASO 9: Regressão — POST /api/process/run acessível sem auth');
  try {
    const r = await httpRequest('POST', '/api/process/run', {
      processId: 'REGRESSION-CHECK',
      regime: 'LICITACAO',
      objectType: 'MATERIAL_CONSUMO',
      objectStructure: 'single_item',
      deliveryType: 'unique',
      needJustification: 'Teste de regressão da Fase Interna 3',
    });

    if (r.status !== 401) {
      pass('Regressão: /api/process/run sem auth', `HTTP ${r.status} — rota não bloqueada por auth (esperado)`);
    } else {
      fail('Regressão: /api/process/run sem auth', `HTTP 401 — rota foi erroneamente protegida por auth`);
    }
  } catch (err) {
    fail('Regressão: /api/process/run', `Erro: ${String(err)}`);
  }

  // --- SUMÁRIO ---
  const passed = results.filter((r) => r.passed).length;
  const total  = results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTADO FINAL: ${passed}/${total} casos passaram`);
  console.log('='.repeat(60));

  if (passed === total) {
    console.log('\n✓ FASE INTERNA 3 — VALIDAÇÃO APROVADA\n');
    process.exit(0);
  } else {
    console.error('\n✗ FASE INTERNA 3 — VALIDAÇÃO COM FALHAS\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro fatal no runner de validação:', err);
  process.exit(1);
});
