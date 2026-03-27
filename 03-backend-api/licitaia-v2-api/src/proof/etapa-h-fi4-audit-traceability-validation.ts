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

type ExecutionRow = {
  id: string;
  tenant_id: string;
  executed_by: string;
  request_payload: Record<string, unknown>;
  response: Record<string, unknown>;
  final_status: string;
  halted: boolean;
  halted_by: string | null;
  validation_codes: string[] | null;
  modules_executed: string[] | null;
  created_at: Date;
};

type AuditRow = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

function nowIso(): string {
  return new Date().toISOString();
}

function basePayload(): Record<string, unknown> {
  return {
    demandDescription: 'Aquisição de material de consumo: 10 kits de cabos de rede categoria 6.',
    hiringJustification:
      'Necessidade comprovada de cabos Cat6 para manutenção e expansão da rede interna.',
    administrativeObjective:
      'Garantir infraestrutura de conectividade adequada para continuidade do serviço.',
    requestingDepartment: 'Diretoria de Tecnologia da Informação',
    requesterName: 'Gestor de Compras',
    requestDate: nowIso(),
    needDescription:
      'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente.',
    expectedResults: 'Aumento de produtividade e redução de falhas por obsolescência.',
    solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores.',
    technicalJustification:
      'Especificações técnicas de cabos Cat6 com conectores e padrões ANSI/TIA.',
    analysisDate: nowIso(),
    responsibleAnalyst: 'Analista de Planejamento de Contratações',
    objectDescription: 'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
    contractingPurpose:
      'Garantir aquisição dos kits de cabos Cat6 para manutenção e expansão da rede interna.',
    technicalRequirements: 'Cabos Cat6 com conectores; atender padrões ANSI/TIA.',
    executionConditions: 'Entrega única em até 15 dias.',
    acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
    referenceDate: nowIso(),
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
  return {
    status: res.status,
    body: parsed,
    text,
    requestId: res.headers.get('x-request-id') ?? '',
  };
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

async function queryExecutionAndAudit(
  tenantId: string,
  processId: string,
): Promise<{ execution: ExecutionRow | null; audit: AuditRow | null }> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenantId]);
    const ex = await client.query<ExecutionRow>(
      `SELECT id, tenant_id::text, executed_by::text, request_payload, response, final_status, halted, halted_by,
              validation_codes, modules_executed, created_at
       FROM process_executions
       WHERE tenant_id = $1::uuid
         AND (
           request_payload->>'processId' = $2
           OR request_payload->'payload'->>'processId' = $2
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, processId],
    );
    const execution = ex.rows[0] ?? null;
    if (!execution) return { execution: null, audit: null };

    const al = await client.query<AuditRow>(
      `SELECT id, tenant_id::text, user_id::text, action, resource_id, metadata, created_at
       FROM audit_logs
       WHERE tenant_id = $1::uuid
         AND action = 'PROCESS_EXECUTION'
         AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, execution.id],
    );
    return { execution, audit: al.rows[0] ?? null };
  } finally {
    await client.end();
  }
}

async function run(): Promise<void> {
  const health = await httpRequest('GET', '/health');
  const admin = await loginAdmin();
  if (!admin) throw new Error('Falha no login admin para prova H-FI4.');

  const successPid = `HFI4-SUCCESS-${Date.now()}`;
  const validationPid = `HFI4-VALIDATION-${Date.now()}`;
  const dependencyPid = `HFI4-DEPENDENCY-${Date.now()}`;

  const successPayload = { ...basePayload(), processId: successPid };
  const validationPayload = {
    ...basePayload(),
    processId: validationPid,
    legalRegime: 'DISPENSA',
    objectType: 'SERVICO_COMUM',
    hiringJustification:
      'Necessidade operacional de limpeza pontual em ambiente administrativo antes de evento.',
    technicalJustification:
      'Detalhamento técnico da limpeza pontual em ambiente administrativo, com equipe e materiais.',
    pricingJustification:
      'Estimativa de mercado para serviço de limpeza pontual conforme itens de referência.',
    administrativeJustification: {
      targetType: 'process',
      problemStatement: 'Necessidade de limpeza pontual para manter salubridade do ambiente.',
      administrativeNeed:
        'Realizar limpeza extraordinária antes de evento institucional, garantindo condições adequadas.',
      expectedOutcome: 'Ambiente limpo e pronto para uso.',
    },
  };
  const dependencyPayload = { ...basePayload(), processId: dependencyPid };
  delete (dependencyPayload as Record<string, unknown>)['demandDescription'];

  const runSuccess = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: successPayload },
    {
      Authorization: `Bearer ${admin.accessToken}`,
      'x-request-id': `hfi4-success-${Date.now()}`,
    },
  );
  const runValidation = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: validationPayload },
    {
      Authorization: `Bearer ${admin.accessToken}`,
      'x-request-id': `hfi4-validation-${Date.now()}`,
    },
  );
  const runDependency = await httpRequest(
    'POST',
    '/api/process/run',
    { payload: dependencyPayload },
    {
      Authorization: `Bearer ${admin.accessToken}`,
      'x-request-id': `hfi4-dependency-${Date.now()}`,
    },
  );

  const successRows = await queryExecutionAndAudit(TENANT_A.id, successPid);
  const validationRows = await queryExecutionAndAudit(TENANT_A.id, validationPid);
  const dependencyRows = await queryExecutionAndAudit(TENANT_A.id, dependencyPid);

  const checks = {
    c1_health_200: health.status === 200,
    c2_success_http_200: runSuccess.status === 200,
    c3_validation_http_409: runValidation.status === 409,
    c4_dependency_http_409: runDependency.status === 409,

    c5_success_execution_persisted: !!successRows.execution,
    c6_validation_execution_persisted: !!validationRows.execution,
    c7_dependency_execution_persisted: !!dependencyRows.execution,

    c8_success_audit_exists: !!successRows.audit,
    c9_validation_audit_exists: !!validationRows.audit,
    c10_dependency_audit_exists: !!dependencyRows.audit,

    c11_success_chain_request_id:
      !!successRows.execution &&
      !!successRows.audit &&
      (successRows.execution.request_payload?.['correlationId'] as string | undefined) ===
        runSuccess.requestId &&
      (successRows.audit.metadata?.['requestId'] as string | undefined) === runSuccess.requestId &&
      (successRows.audit.metadata?.['correlationId'] as string | undefined) === runSuccess.requestId,
    c12_validation_chain_request_id:
      !!validationRows.execution &&
      !!validationRows.audit &&
      (validationRows.execution.request_payload?.['correlationId'] as string | undefined) ===
        runValidation.requestId &&
      (validationRows.audit.metadata?.['requestId'] as string | undefined) ===
        runValidation.requestId &&
      (validationRows.audit.metadata?.['correlationId'] as string | undefined) ===
        runValidation.requestId,
    c13_dependency_chain_request_id:
      !!dependencyRows.execution &&
      !!dependencyRows.audit &&
      (dependencyRows.execution.request_payload?.['correlationId'] as string | undefined) ===
        runDependency.requestId &&
      (dependencyRows.audit.metadata?.['requestId'] as string | undefined) ===
        runDependency.requestId &&
      (dependencyRows.audit.metadata?.['correlationId'] as string | undefined) ===
        runDependency.requestId,

    c14_process_id_causal_link:
      !!successRows.audit &&
      !!validationRows.audit &&
      !!dependencyRows.audit &&
      successRows.audit.metadata?.['processId'] === successPid &&
      validationRows.audit.metadata?.['processId'] === validationPid &&
      dependencyRows.audit.metadata?.['processId'] === dependencyPid,
    c15_user_tenant_integrity:
      !!successRows.execution &&
      !!validationRows.execution &&
      !!dependencyRows.execution &&
      successRows.execution.tenant_id === TENANT_A.id &&
      validationRows.execution.tenant_id === TENANT_A.id &&
      dependencyRows.execution.tenant_id === TENANT_A.id &&
      successRows.execution.executed_by === admin.userId &&
      validationRows.execution.executed_by === admin.userId &&
      dependencyRows.execution.executed_by === admin.userId,
    c16_temporal_order_coherent:
      !!successRows.execution &&
      !!successRows.audit &&
      !!validationRows.execution &&
      !!validationRows.audit &&
      !!dependencyRows.execution &&
      !!dependencyRows.audit &&
      successRows.audit.created_at >= successRows.execution.created_at &&
      validationRows.audit.created_at >= validationRows.execution.created_at &&
      dependencyRows.audit.created_at >= dependencyRows.execution.created_at,
    c17_audit_semantic_completeness:
      !!successRows.audit &&
      !!validationRows.audit &&
      !!dependencyRows.audit &&
      (successRows.audit.metadata?.['userId'] as string | undefined) === admin.userId &&
      (validationRows.audit.metadata?.['userId'] as string | undefined) === admin.userId &&
      (dependencyRows.audit.metadata?.['userId'] as string | undefined) === admin.userId &&
      (successRows.audit.metadata?.['tenantId'] as string | undefined) === TENANT_A.id &&
      (validationRows.audit.metadata?.['tenantId'] as string | undefined) === TENANT_A.id &&
      (dependencyRows.audit.metadata?.['tenantId'] as string | undefined) === TENANT_A.id &&
      Array.isArray(successRows.audit.metadata?.['modulesExecuted']) &&
      Array.isArray(validationRows.audit.metadata?.['modulesExecuted']) &&
      Array.isArray(dependencyRows.audit.metadata?.['modulesExecuted']) &&
      Array.isArray(successRows.audit.metadata?.['validationCodes']) &&
      Array.isArray(validationRows.audit.metadata?.['validationCodes']) &&
      Array.isArray(dependencyRows.audit.metadata?.['validationCodes']),
    c18_outcome_matrix_expected:
      !!successRows.execution &&
      !!validationRows.execution &&
      !!dependencyRows.execution &&
      successRows.execution.final_status === 'SUCCESS' &&
      validationRows.execution.final_status === 'HALTED_BY_VALIDATION' &&
      dependencyRows.execution.final_status === 'HALTED_BY_DEPENDENCY',
  };

  console.log(
    JSON.stringify(
      {
        checks,
        evidence: {
          status: {
            health: health.status,
            success: runSuccess.status,
            validation: runValidation.status,
            dependency: runDependency.status,
          },
          requestIds: {
            success: runSuccess.requestId,
            validation: runValidation.requestId,
            dependency: runDependency.requestId,
          },
          executionIds: {
            success: successRows.execution?.id ?? null,
            validation: validationRows.execution?.id ?? null,
            dependency: dependencyRows.execution?.id ?? null,
          },
          finalStatus: {
            success: successRows.execution?.final_status ?? null,
            validation: validationRows.execution?.final_status ?? null,
            dependency: dependencyRows.execution?.final_status ?? null,
          },
          auditMetadata: {
            success: successRows.audit?.metadata ?? null,
            validation: validationRows.audit?.metadata ?? null,
            dependency: dependencyRows.audit?.metadata ?? null,
          },
        },
      },
      null,
      2,
    ),
  );

  if (!Object.values(checks).every(Boolean)) process.exit(1);
  process.exit(0);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
