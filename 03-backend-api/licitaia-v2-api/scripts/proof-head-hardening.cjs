#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function read(relPath) {
  const abs = path.resolve(__dirname, '..', relPath);
  return fs.readFileSync(abs, 'utf8');
}

function pass(name, detail) {
  console.log(`PASS | ${name} | ${detail}`);
}

function fail(name, detail) {
  console.log(`FAIL | ${name} | ${detail}`);
  process.exitCode = 1;
}

function assert(name, condition, okDetail, failDetail) {
  if (condition) pass(name, okDetail);
  else fail(name, failDetail);
}

const routes = read('src/routes/process.routes.ts');
const controller = read('src/controllers/process.controller.ts');
const legalKeywords = read(
  '../../02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document-consistency.types.ts',
);
const legalRules = read(
  '../../02-frontend/licitaia-v2-web/modules/shared/validators/legal/legal-validation-rules.ts',
);
const server = read('src/server.ts');
const rateLimitMiddleware = read('src/middleware/rate-limit.ts');

// 1) /run sem autenticação deve falhar -> evidência: rota exige authenticateMiddleware
assert(
  '1./run_sem_auth_falha',
  /processRouter\.post\('\/run',\s*authenticateMiddleware,\s*runProcessController\);/.test(routes),
  '/run está protegido por authenticateMiddleware',
  '/run não está protegido por authenticateMiddleware',
);

// 2) /run com auth válida deve funcionar -> evidência mínima: middleware + controller intacto na rota
assert(
  '2./run_com_auth_funciona',
  /processRouter\.post\('\/run',\s*authenticateMiddleware,\s*runProcessController\);/.test(routes) &&
    /export async function runProcessController/.test(controller),
  'rota /run encadeia auth obrigatória e controller de execução',
  'encadeamento de /run não está consistente (auth + controller)',
);

// 3) /preflight sem autenticação deve falhar -> evidência: rota exige authenticateMiddleware
assert(
  '3./preflight_sem_auth_falha',
  /processRouter\.post\('\/preflight',\s*authenticateMiddleware,\s*preflightProcessController\);/.test(
    routes,
  ),
  '/preflight está protegido por authenticateMiddleware',
  '/preflight não está protegido por authenticateMiddleware',
);

// 4) base legal não aceita termos genéricos isolados
assert(
  '4.base_legal_nao_aceita_generico',
  !/['"]dispensa['"]/.test(legalKeywords) && !/['"]inexigibilidade['"]/.test(legalKeywords),
  "LEGAL_BASIS_REQUIRED_KEYWORDS não contém 'dispensa'/'inexigibilidade'",
  "LEGAL_BASIS_REQUIRED_KEYWORDS contém termo genérico proibido",
);

// 5) base legal aceita fundamentação específica válida
assert(
  '5.base_legal_aceita_fundamentacao_especifica',
  /['"]art\. 74['"]/.test(legalKeywords) &&
    /['"]art\. 75['"]/.test(legalKeywords) &&
    /['"]lei 14\.133['"]/.test(legalKeywords) &&
    /LEGAL_BASIS_REQUIRED_KEYWORDS/.test(legalRules),
  'keywords específicas (art.74/art.75/lei 14.133) presentes e em uso na regra',
  'keywords específicas ausentes ou não utilizadas pela regra',
);

// 6) falha de persistência não bloqueia resposta principal do motor
const persistCatchStart = controller.indexOf('catch (saveError) {');
const persistCatchEnd = controller.indexOf(
  'res.status(httpStatus).json(withInstitutionalMeta(res, responseBody));',
);
const persistCatchBlock =
  persistCatchStart >= 0 && persistCatchEnd > persistCatchStart
    ? controller.slice(persistCatchStart, persistCatchEnd)
    : '';
const hasPersistCatch = persistCatchBlock.length > 0;
const hasPersist500InCatch = /res\.status\(500\)\.json/.test(persistCatchBlock);
const hasPersistSignal =
  /responseBody\.metadata\s*=/.test(persistCatchBlock) &&
  /persistence:\s*\{/.test(persistCatchBlock) &&
  /saved:\s*false/.test(persistCatchBlock);
const hasFinalMainResponse = /res\.status\(httpStatus\)\.json\(withInstitutionalMeta\(res,\s*responseBody\)\);/.test(
  controller,
);
assert(
  '6.persistencia_falha_nao_bloqueia_resposta',
  hasPersistCatch && !hasPersist500InCatch && hasPersistSignal && hasFinalMainResponse,
  'catch de persistência não retorna 500 e sinaliza metadata.persistence mantendo resposta principal',
  'fluxo de persistência ainda bloqueia resposta principal ou sem sinalização adequada',
);

// 7) rate limiting ativo
assert(
  '7.rate_limiting_ativo',
  /createRateLimitMiddleware/.test(server) &&
    /app\.use\('\/api\/auth',\s*authRateLimitMiddleware,\s*authRouter\);/.test(server) &&
    /app\.use\('\/api\/process',\s*processRateLimitMiddleware,\s*processRouter\);/.test(server) &&
    /res\.status\(429\)\.json/.test(rateLimitMiddleware) &&
    /Retry-After/.test(rateLimitMiddleware),
  'limiter aplicado em auth/process com retorno 429 + Retry-After',
  'limiter ausente/incompleto nos endpoints alvo',
);

if (process.exitCode && process.exitCode !== 0) {
  console.log('\nRESULTADO: REPROVADO');
} else {
  console.log('\nRESULTADO: APROVADO');
}

