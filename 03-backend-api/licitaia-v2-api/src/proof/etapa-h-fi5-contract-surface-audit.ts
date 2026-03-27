import 'dotenv/config';
import { Client } from 'pg';

const API_BASE_URL =
  process.env['API_BASE_URL'] || process.env['PROOF_BASE_URL'] || 'http://localhost:3001';
const DATABASE_URL =
  process.env['DATABASE_URL'] ||
  'postgresql://licitaia_app:licitaia_app@localhost:5432/licitaia_dev';

const TENANT_A = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'prefeitura-exemplo',
  adminEmail: 'admin@exemplo.gov.br',
  password: 'SenhaTeste@123',
};

type HttpResult = {
  status: number;
  body: any;
  text: string;
  requestId: string;
};

function basePayload(): Record<string, unknown> {
  return {
    demandDescription: 'Aquisição de material de consumo: 10 kits de cabos de rede categoria 6.',
    hiringJustification:
      'Necessidade comprovada de cabos Cat6 para manutenção e expansão da rede interna.',
    administrativeObjective:
      'Garantir infraestrutura de conectividade adequada para continuidade do serviço.',
    requestingDepartment: 'Diretoria de Tecnologia da Informação',
    requesterName: 'Gestor de Compras',
    requestDate: new Date().toISOString(),
    needDescription:
      'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente.',
    expectedResults: 'Aumento de produtividade e redução de falhas por obsolescência.',
    solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores.',
    technicalJustification:
      'Especificações técnicas de cabos Cat6 com conectores e padrões ANSI/TIA.',
    analysisDate: new Date().toISOString(),
    responsibleAnalyst: 'Analista de Planejamento de Contratações',
    objectDescription: 'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
    contractingPurpose:
      'Garantir aquisição dos kits de cabos Cat6 para manutenção e expansão da rede interna.',
    technicalRequirements: 'Cabos Cat6 com conectores; atender padrões ANSI/TIA.',
    executionConditions: 'Entrega única em até 15 dias.',
    acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
    referenceDate: new Date().toISOString(),
    responsibleAuthor: 'Responsável pelo Termo de Referência',
    pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
    referenceItemsDescription: 'Kits de cabos de rede Cat6 com conectores (material de consumo).',
    estimatedUnitValue: 100,
    estimatedTotalValue: 1000,
    pricingJustification:
      'Pesquisa de mercado em três fornecedores distintos para kits de cabos Cat6.',
    legalRegime: 'LICITACAO',
    objectType: 'MATERIAL_CONSUMO',
    objectStructure: 'ITEM_UNICO',
    executionForm: 'ENTREGA_UNICA',
    procurementStrategy: {
      targetType: 'process',
      procurementModality: 'PREGAO',
      competitionStrategy: 'OPEN_COMPETITION',
      divisionStrategy: 'SINGLE_CONTRACT',
      contractingJustification:
        'Licitação na modalidade pregão, visando competição ampla e proposta mais vantajosa.',
    },
    administrativeJustification: {
      targetType: 'process',
      problemStatement: 'Necessidade de material de consumo para conectividade de rede interna.',
      administrativeNeed: 'Garantir cabos Cat6 para manutenção e expansão do ambiente de rede.',
      expectedOutcome: 'Conectividade estável e suporte às demandas operacionais do órgão.',
    },
  };
}

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResult> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { status: res.status, body: parsed, text, requestId: res.headers.get('x-request-id') ?? '' };
}

async function loginAdmin(): Promise<{ accessToken: string; userId: string } | null> {
  const r = await httpRequest('POST', '/api/auth/login', {
    tenantSlug: TENANT_A.slug,
    email: TENANT_A.adminEmail,
    password: TENANT_A.password,
  });
  const token = r.body?.data?.accessToken;
  const userId = r.body?.data?.user?.id;
  if (r.status !== 200 || !token || !userId) return null;
  return { accessToken: token, userId };
}

async function latestExecutionByProcessId(processId: string): Promise<{
  executionId: string | null;
  processId: string | null;
  correlationId: string | null;
}> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [TENANT_A.id]);
    const q = await client.query<{
      id: string;
      process_id: string | null;
      correlation_id: string | null;
    }>(
      `SELECT
         id,
         coalesce(request_payload->>'processId', request_payload->'payload'->>'processId') as process_id,
         request_payload->>'correlationId' as correlation_id
       FROM process_executions
       WHERE tenant_id = $1::uuid
         AND coalesce(request_payload->>'processId', request_payload->'payload'->>'processId') = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [TENANT_A.id, processId],
    );
    const row = q.rows[0];
    return {
      executionId: row?.id ?? null,
      processId: row?.process_id ?? null,
      correlationId: row?.correlation_id ?? null,
    };
  } finally {
    await client.end();
  }
}

async function run(): Promise<void> {
  const admin = await loginAdmin();
  if (!admin) throw new Error('Falha de login admin para prova H-FI5.');

  const pidSuccess = `HFI5-SUCCESS-${Date.now()}`;
  const pidValidation = `HFI5-VALID-${Date.now()}`;
  const pidDependency = `HFI5-DEP-${Date.now()}`;

  const runSuccess = await httpRequest(
    'POST',
    '/api/process/run',
    { processId: pidSuccess, payload: { ...basePayload(), processId: pidSuccess } },
    { Authorization: `Bearer ${admin.accessToken}`, 'x-request-id': `hfi5-success-${Date.now()}` },
  );

  const validationPayload = {
    ...basePayload(),
    processId: pidValidation,
    legalRegime: 'DISPENSA',
    objectType: 'SERVICO_COMUM',
    hiringJustification: 'Necessidade operacional sem base legal explícita.',
    technicalJustification: 'Detalhamento técnico sem base legal explícita.',
    pricingJustification: 'Estimativa de mercado sem base legal explícita.',
    administrativeJustification: {
      targetType: 'process',
      problemStatement: 'Necessidade operacional.',
      administrativeNeed: 'Atender necessidade imediata.',
      expectedOutcome: 'Resultado operacional.',
    },
  };
  const runValidation = await httpRequest(
    'POST',
    '/api/process/run',
    { processId: pidValidation, payload: validationPayload },
    {
      Authorization: `Bearer ${admin.accessToken}`,
      'x-request-id': `hfi5-validation-${Date.now()}`,
    },
  );

  const dependencyPayload = { ...basePayload(), processId: pidDependency };
  delete (dependencyPayload as Record<string, unknown>)['demandDescription'];
  const runDependency = await httpRequest(
    'POST',
    '/api/process/run',
    { processId: pidDependency, payload: dependencyPayload },
    {
      Authorization: `Bearer ${admin.accessToken}`,
      'x-request-id': `hfi5-dependency-${Date.now()}`,
    },
  );

  const dangerousTenant = await httpRequest(
    'POST',
    '/api/process/run',
    {
      processId: `HFI5-DANG-TENANT-${Date.now()}`,
      tenantId: '11111111-1111-1111-1111-111111111111',
      payload: basePayload(),
    },
    { Authorization: `Bearer ${admin.accessToken}` },
  );
  const dangerousUser = await httpRequest(
    'POST',
    '/api/process/run',
    {
      processId: `HFI5-DANG-USER-${Date.now()}`,
      userId: '22222222-2222-2222-2222-222222222222',
      payload: basePayload(),
    },
    { Authorization: `Bearer ${admin.accessToken}` },
  );
  const dangerousCorrelation = await httpRequest(
    'POST',
    '/api/process/run',
    {
      processId: `HFI5-DANG-CORR-${Date.now()}`,
      correlationId: 'client-correlation-id',
      payload: basePayload(),
    },
    { Authorization: `Bearer ${admin.accessToken}`, 'x-request-id': 'hfi5-safe-rid' },
  );

  const persisted = await latestExecutionByProcessId(pidSuccess);

  const checks = {
    c1_success_http_and_body:
      runSuccess.status === 200 &&
      runSuccess.body?.success === true &&
      runSuccess.body?.process?.status === 'success' &&
      runSuccess.body?.process?.finalStatus === 'SUCCESS' &&
      runSuccess.body?.process?.halted === false,
    c2_validation_halt_http_and_body:
      runValidation.status === 409 &&
      runValidation.body?.success === false &&
      runValidation.body?.process?.status === 'halted' &&
      runValidation.body?.process?.finalStatus === 'HALTED_BY_VALIDATION' &&
      runValidation.body?.process?.halted === true,
    c3_dependency_halt_http_and_body:
      runDependency.status === 409 &&
      runDependency.body?.success === false &&
      runDependency.body?.process?.status === 'halted' &&
      runDependency.body?.process?.finalStatus === 'HALTED_BY_DEPENDENCY' &&
      runDependency.body?.process?.halted === true,
    c4_status_shape_consistency:
      typeof runSuccess.body?.result === 'object' &&
      Array.isArray(runSuccess.body?.events) &&
      Array.isArray(runSuccess.body?.validations) &&
      typeof runSuccess.body?.metadata === 'object',
    c5_reject_public_tenant_field:
      dangerousTenant.status === 400 &&
      dangerousTenant.body?.error?.code === 'INVALID_PROCESS_RUN_REQUEST',
    c6_reject_public_user_field:
      dangerousUser.status === 400 &&
      dangerousUser.body?.error?.code === 'INVALID_PROCESS_RUN_REQUEST',
    c7_reject_public_correlation_field:
      dangerousCorrelation.status === 400 &&
      dangerousCorrelation.body?.error?.code === 'INVALID_PROCESS_RUN_REQUEST',
    c8_correlation_canonical_from_header:
      persisted.executionId !== null &&
      persisted.processId === pidSuccess &&
      persisted.correlationId === runSuccess.requestId,
  };

  console.log(
    JSON.stringify(
      {
        checks,
        evidence: {
          requestIds: {
            success: runSuccess.requestId,
            validation: runValidation.requestId,
            dependency: runDependency.requestId,
          },
          statuses: {
            success: runSuccess.status,
            validation: runValidation.status,
            dependency: runDependency.status,
            dangerousTenant: dangerousTenant.status,
            dangerousUser: dangerousUser.status,
            dangerousCorrelation: dangerousCorrelation.status,
          },
          process: {
            success: runSuccess.body?.process ?? null,
            validation: runValidation.body?.process ?? null,
            dependency: runDependency.body?.process ?? null,
          },
          persisted,
          dangerousErrors: {
            tenant: dangerousTenant.body?.error ?? null,
            user: dangerousUser.body?.error ?? null,
            correlation: dangerousCorrelation.body?.error ?? null,
          },
        },
      },
      null,
      2,
    ),
  );

  if (!Object.values(checks).every(Boolean)) process.exit(1);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
