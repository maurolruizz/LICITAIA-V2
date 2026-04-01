import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type {
  AdministrativeProcessContext,
  AdministrativeProcessResult,
} from '../dto/administrative-process.types';
import type {
  ProcessRunEngineResponseBody,
  ProcessRunResponseBody,
} from '../dto/process-run-response.types';
import { validateProcessRunRequest } from '../validators/process-run-request.validator';
import { normalizeToContext } from '../normalizers/process-run-request.normalizer';
import {
  buildEngineResponse,
  buildInternalErrorResponse,
  buildValidationErrorResponse,
} from '../factories/process-run-response.factory';
import { saveExecution } from '../modules/process-execution/process-execution.service';
import { logger } from '../middleware/logger';
import { withInstitutionalMeta } from '../lib/response-meta';
import { applyAiAssistiveLayer } from '../modules/ai-assistive/ai-assistive.service';
import { COVERAGE_DIMENSIONS } from '../phase35/coverage-matrix';
import { getRunAdministrativeProcess } from '../lib/frontend-core-loader';
import {
  executeFlowAction,
  FlowOperationError,
  getPersistedFlowState,
  isFlowStateStaleError,
} from '../modules/flow/flow-session.service';
import type { AuthenticatedContext } from '../modules/auth/auth.types';
import {
  createProcessSession,
  executeProcessAction,
  getProcessById,
  getProcessHistory,
} from '../modules/process/process.service';
import {
  buildComplianceReport,
  ComplianceReportBuildError,
} from '../modules/compliance/compliance-report.service';
import { buildComplianceDossier } from '../modules/compliance/compliance-dossier.service';

export async function runProcessController(req: Request, res: Response): Promise<void> {
  const requestId = (res.locals['requestId'] as string | undefined) ?? '';
  const rid = requestId ? `[rid:${requestId}] ` : '';

  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: 'Request body must be a JSON object.',
        details: [{ field: 'body', reason: 'Request body must be a JSON object.' }],
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }
    if (!('payload' in body)) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: 'payload is required.',
        details: [{ field: 'payload', reason: 'payload is required.' }],
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }

    const validation = validateProcessRunRequest(body);
    if (!validation.success) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: validation.error.message,
        details: validation.error.details,
        code: validation.error.code,
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }

    const processId = randomUUID();
    const context = normalizeToContext({ ...validation.data, processId });
    const runAdministrativeProcess = getRunAdministrativeProcess();
    const locals = res.locals as Record<string, unknown>;
    const authenticatedTenantId =
      typeof locals['authenticatedTenantId'] === 'string'
        ? locals['authenticatedTenantId']
        : undefined;
    const authenticatedUserId =
      typeof locals['authenticatedUserId'] === 'string'
        ? locals['authenticatedUserId']
        : undefined;
    context.tenantId = authenticatedTenantId;
    context.userId = authenticatedUserId;
    // CorrelationId confiável da borda HTTP: nunca confiar em valor enviado pelo cliente.
    context.correlationId = requestId || context.correlationId;
    const rawEngineResult: AdministrativeProcessResult =
      await runAdministrativeProcess(context);
    const engineResult: AdministrativeProcessResult = applyAiAssistiveLayer(rawEngineResult);

    const responseBody: ProcessRunEngineResponseBody = buildEngineResponse(engineResult);

    const httpStatus = engineResult.success ? 200 : engineResult.halted ? 409 : 422;

    // Persiste a execução. Em caso de falha, não bloquear a resposta principal do motor.
    try {
      const modulesExecuted = Array.isArray(engineResult['executedModules'])
        ? (engineResult['executedModules'] as unknown[]).filter((m): m is string => typeof m === 'string')
        : [];
      const validationCodes = Array.isArray(engineResult.validations)
        ? (engineResult.validations as unknown[])
            .filter((v): v is Record<string, unknown> => v !== null && typeof v === 'object')
            .map((v) => (typeof v['code'] === 'string' ? v['code'] : ''))
            .filter(Boolean)
        : [];
      const haltedBy =
        typeof engineResult['haltedBy'] === 'string' ? engineResult['haltedBy'] : undefined;
      const tenantId = authenticatedTenantId ?? null;
      const userId = authenticatedUserId ?? null;

      if (tenantId && userId) {
        await saveExecution({
          tenantId,
          executedBy: userId,
          requestPayload: {
            ...(body as Record<string, unknown>),
            correlationId: context.correlationId,
            processId: context.processId,
          },
          response: responseBody as unknown as Record<string, unknown>,
          processId: context.processId,
          correlationId: context.correlationId,
          requestId,
          finalStatus: engineResult.finalStatus,
          halted: engineResult.halted,
          ...(haltedBy !== undefined ? { haltedBy } : {}),
          httpStatus,
          modulesExecuted,
          validationCodes,
          eventsCount: Array.isArray(engineResult.events) ? engineResult.events.length : 0,
          decisionMetadataCount: Array.isArray(engineResult.decisionMetadata)
            ? engineResult.decisionMetadata.length
            : 0,
          audit: {
            userId,
            ipAddress: typeof req.ip === 'string' ? req.ip : null,
            userAgent:
              typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
          },
        });
      }
    } catch (saveError) {
      logger.error(`${rid}[PERSIST_FAIL] Falha ao persistir execução — ${saveError instanceof Error ? saveError.message : String(saveError)}`);
      responseBody.metadata = {
        ...(responseBody.metadata ?? {}),
        persistence: {
          saved: false,
          errorCode: 'PERSIST_FAIL',
          message: 'Falha ao persistir trilha critica da execucao.',
        },
      };
    }

    res.status(httpStatus).json(withInstitutionalMeta(res, responseBody));
  } catch (error) {
    logger.error(`${rid}[PROCESS_ERROR] Erro ao executar processo administrativo — ${error instanceof Error ? error.message : String(error)}`);
    const responseBody: ProcessRunResponseBody = buildInternalErrorResponse(error);
    res.status(500).json(withInstitutionalMeta(res, responseBody));
  }
}

export async function preflightProcessController(req: Request, res: Response): Promise<void> {
  const requestId = (res.locals['requestId'] as string | undefined) ?? '';
  const rid = requestId ? `[rid:${requestId}] ` : '';
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: 'Request body must be a JSON object.',
        details: [{ field: 'body', reason: 'Request body must be a JSON object.' }],
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }
    if (!('payload' in body)) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: 'payload is required.',
        details: [{ field: 'payload', reason: 'payload is required.' }],
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }
    const validation = validateProcessRunRequest(body);
    if (!validation.success) {
      const responseBody: ProcessRunResponseBody = buildValidationErrorResponse({
        message: validation.error.message,
        details: validation.error.details,
        code: validation.error.code,
      });
      res.status(400).json(withInstitutionalMeta(res, responseBody));
      return;
    }
    const processId = randomUUID();
    const context = normalizeToContext({ ...validation.data, processId });
    const runAdministrativeProcess = getRunAdministrativeProcess();
    const rawEngineResult: AdministrativeProcessResult = await runAdministrativeProcess(context);
    const engineResult: AdministrativeProcessResult = applyAiAssistiveLayer(rawEngineResult);
    const responseBody: ProcessRunResponseBody = buildEngineResponse(engineResult);
    const httpStatus = engineResult.success ? 200 : engineResult.halted ? 409 : 422;
    // Endpoint de preflight: sem persistencia por desenho.
    res.status(httpStatus).json(
      withInstitutionalMeta(res, {
        ...responseBody,
        preflight: true,
        persisted: false,
      })
    );
  } catch (error) {
    logger.error(`${rid}[PROCESS_PREFLIGHT_ERROR] Erro ao executar preflight — ${error instanceof Error ? error.message : String(error)}`);
    const responseBody: ProcessRunResponseBody = buildInternalErrorResponse(error);
    res.status(500).json(withInstitutionalMeta(res, responseBody));
  }
}

export function guidanceOptionsController(_req: Request, res: Response): void {
  res.status(200).json(
    withInstitutionalMeta(res, {
      success: true,
      data: {
        legalRegime: [...COVERAGE_DIMENSIONS.legalRegime],
        objectType: [...COVERAGE_DIMENSIONS.objectType],
        objectStructure: [...COVERAGE_DIMENSIONS.objectStructure],
        executionForm: [...COVERAGE_DIMENSIONS.executionForm],
      },
      source: 'coverage-matrix',
    })
  );
}

export function createFlowSessionController(req: Request, res: Response): void {
  void (async () => {
    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const processId = typeof body['processId'] === 'string' ? body['processId'] : undefined;
    const ctx = res.locals as Partial<AuthenticatedContext>;
    if (!ctx.authenticatedTenantId || !ctx.authenticatedUserId) {
      res.status(401).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto de autenticação ausente.' },
        }),
      );
      return;
    }

    const created = await createProcessSession({
      tenantId: ctx.authenticatedTenantId,
      userId: ctx.authenticatedUserId,
      processId,
      ipAddress: typeof req.ip === 'string' ? req.ip : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
    res.status(200).json(
      withInstitutionalMeta(res, {
        success: true,
        data: { processId: created.process.id, state: created.flowSession.snapshot },
      }),
    );
  })().catch((error) => {
    res.status(500).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'FLOW_SESSION_CREATE_ERROR', message: error instanceof Error ? error.message : String(error) },
      }),
    );
  });
}

export function getFlowStateController(req: Request, res: Response): void {
  void (async () => {
    const processId = typeof req.query['processId'] === 'string' ? req.query['processId'] : '';
    if (!processId) {
      res.status(400).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'FLOW_PROCESS_ID_REQUIRED', message: 'processId is required.' },
        }),
      );
      return;
    }
    const ctx = res.locals as Partial<AuthenticatedContext>;
    if (!ctx.authenticatedTenantId) {
      res.status(401).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
        }),
      );
      return;
    }
    const session = await getPersistedFlowState({ tenantId: ctx.authenticatedTenantId, processId });
    res.status(200).json(
      withInstitutionalMeta(res, {
        success: true,
        data: { processId, state: session.snapshot },
      }),
    );
  })().catch((error) => {
    const code = error instanceof Error ? error.message : 'FLOW_STATE_READ_ERROR';
    const status = code === 'FLOW_SESSION_NOT_FOUND' ? 404 : 500;
    res.status(status).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code, message: code },
      }),
    );
  });
}

export async function flowCommandController(req: Request, res: Response): Promise<void> {
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null;
  if (!body) {
    res.status(400).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'FLOW_COMMAND_INVALID_BODY', message: 'Request body must be a JSON object.' },
      })
    );
    return;
  }
  const processId = typeof body['processId'] === 'string' ? body['processId'] : '';
  const action = typeof body['action'] === 'string' ? body['action'] : '';
  const guard = (body['guard'] ?? null) as
    | { expectedRevision: unknown; expectedRenderToken: unknown }
    | null;

  if (!processId || !action || !guard) {
    res.status(400).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'FLOW_COMMAND_INVALID_INPUT', message: 'processId, action and guard are required.' },
      })
    );
    return;
  }

  try {
    const ctx = res.locals as Partial<AuthenticatedContext>;
    if (!ctx.authenticatedTenantId || !ctx.authenticatedUserId) {
      res.status(401).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto de autenticação ausente.' },
        }),
      );
      return;
    }
    const state = await executeFlowAction({
      tenantId: ctx.authenticatedTenantId,
      userId: ctx.authenticatedUserId,
      processId,
      action,
      guard: {
        expectedRevision: Number(guard.expectedRevision),
        expectedRenderToken: String(guard.expectedRenderToken ?? ''),
      },
      updates: Array.isArray(body['updates']) ? (body['updates'] as never[]) : [],
      ipAddress: typeof req.ip === 'string' ? req.ip : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
    res.status(200).json(
      withInstitutionalMeta(res, {
        success: true,
        data: { processId, state },
      })
    );
  } catch (error) {
    if (isFlowStateStaleError(error)) {
      let freshState: unknown = null;
      try {
        const ctx = res.locals as Partial<AuthenticatedContext>;
        if (ctx.authenticatedTenantId) {
          const session = await getPersistedFlowState({
            tenantId: ctx.authenticatedTenantId,
            processId,
          });
          freshState = session.snapshot;
        }
      } catch {
        freshState = null;
      }
      res.status(409).json(
        withInstitutionalMeta(res, {
          success: false,
          error: {
            code: 'STATE_STALE',
            messageKey: 'ERROR_STATE_STALE',
            message: 'STATE_STALE',
          },
          data: { processId, state: freshState },
        })
      );
      return;
    }
    const code = error instanceof Error ? error.message : 'FLOW_COMMAND_ERROR';
    const status = code === 'FLOW_SESSION_NOT_FOUND' ? 404 : code === 'FLOW_ACTION_NOT_SUPPORTED' ? 400 : 409;
    res.status(status).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code, message: code },
      })
    );
  }
}

export async function createProcessController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId || !ctx.authenticatedUserId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto de autenticação ausente.' },
      }),
    );
    return;
  }
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const processId = typeof body['processId'] === 'string' ? body['processId'] : undefined;
  const created = await createProcessSession({
    tenantId: ctx.authenticatedTenantId,
    userId: ctx.authenticatedUserId,
    processId,
    ipAddress: typeof req.ip === 'string' ? req.ip : null,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
  });
  res.status(201).json(
    withInstitutionalMeta(res, {
      success: true,
      data: {
        process: created.process,
        state: created.flowSession.snapshot,
      },
    }),
  );
}

export async function getProcessController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }
  const processId = req.params['id'];
  const result = await getProcessById({ tenantId: ctx.authenticatedTenantId, processId });
  if (!result) {
    res.status(404).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'PROCESS_NOT_FOUND', message: 'Processo não encontrado.' },
      }),
    );
    return;
  }
  res.status(200).json(
    withInstitutionalMeta(res, {
      success: true,
      data: {
        process: result.process,
        state: result.flowSession.snapshot,
      },
    }),
  );
}

export async function getProcessHistoryController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }
  const processId = req.params['id'];
  const data = await getProcessHistory({ tenantId: ctx.authenticatedTenantId, processId });
  res.status(200).json(withInstitutionalMeta(res, { success: true, data }));
}

export async function executeProcessActionController(req: Request, res: Response): Promise<void> {
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : null;
  if (!body) {
    res.status(400).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'PROCESS_EXECUTE_INVALID_BODY', message: 'Request body must be a JSON object.' },
      }),
    );
    return;
  }
  const processId = typeof body['processId'] === 'string' ? body['processId'] : '';
  const action = typeof body['action'] === 'string' ? body['action'] : '';
  const guard = (body['guard'] ?? null) as
    | { expectedRevision: unknown; expectedRenderToken: unknown }
    | null;
  if (!processId || !action || !guard) {
    res.status(400).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'PROCESS_EXECUTE_INVALID_INPUT', message: 'processId, action and guard são obrigatórios.' },
      }),
    );
    return;
  }
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId || !ctx.authenticatedUserId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_AUTH_CONTEXT', message: 'Contexto de autenticação ausente.' },
      }),
    );
    return;
  }
  try {
    const state = await executeProcessAction({
      tenantId: ctx.authenticatedTenantId,
      userId: ctx.authenticatedUserId,
      processId,
      action,
      guard: {
        expectedRevision: Number(guard.expectedRevision),
        expectedRenderToken: String(guard.expectedRenderToken ?? ''),
      },
      updates: Array.isArray(body['updates']) ? (body['updates'] as never[]) : [],
      ipAddress: typeof req.ip === 'string' ? req.ip : null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
    res.status(200).json(withInstitutionalMeta(res, { success: true, data: { processId, state } }));
  } catch (error) {
    if (isFlowStateStaleError(error)) {
      res.status(409).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'STALE_STATE', message: 'Estado desatualizado.' },
        }),
      );
      return;
    }
    if (error instanceof FlowOperationError && error.code === 'PROCESS_NOT_FOUND') {
      res.status(404).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: 'PROCESS_NOT_FOUND', message: 'Processo não encontrado.' },
        }),
      );
      return;
    }
    const code = error instanceof Error ? error.message : 'PROCESS_EXECUTE_ERROR';
    const status = code === 'FLOW_ACTION_NOT_SUPPORTED' ? 400 : 500;
    res.status(status).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code, message: code },
      }),
    );
  }
}

export async function getComplianceReportController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }

  const processId = req.params['id'];
  try {
    const report = await buildComplianceReport({
      tenantId: ctx.authenticatedTenantId,
      processId,
    });
    res.status(200).json(
      withInstitutionalMeta(res, {
        success: true,
        data: report,
      }),
    );
  } catch (error) {
    if (error instanceof ComplianceReportBuildError) {
      if (error.code === 'PROCESS_NOT_FOUND') {
        res.status(404).json(
          withInstitutionalMeta(res, {
            success: false,
            error: { code: 'PROCESS_NOT_FOUND', message: 'Processo não encontrado.' },
          }),
        );
        return;
      }
      if (error.code === 'FLOW_SESSION_NOT_FOUND') {
        res.status(404).json(
          withInstitutionalMeta(res, {
            success: false,
            error: { code: 'FLOW_SESSION_NOT_FOUND', message: 'Sessão de fluxo não encontrada.' },
          }),
        );
        return;
      }
    }

    const code = error instanceof Error ? error.message : 'COMPLIANCE_REPORT_READ_ERROR';
    res.status(500).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'COMPLIANCE_REPORT_READ_ERROR', message: code },
      }),
    );
  }
}

export async function getComplianceDossierController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  if (!ctx.authenticatedTenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }

  const processId = req.params['id'];
  try {
    const dossier = await buildComplianceDossier({
      tenantId: ctx.authenticatedTenantId,
      processId,
    });
    res.status(200).json(
      withInstitutionalMeta(res, {
        success: true,
        data: dossier,
      }),
    );
  } catch (error) {
    if (error instanceof ComplianceReportBuildError) {
      const status = error.code === 'PROCESS_NOT_FOUND' || error.code === 'FLOW_SESSION_NOT_FOUND' ? 404 : 500;
      res.status(status).json(
        withInstitutionalMeta(res, {
          success: false,
          error: { code: error.code, message: error.message },
        }),
      );
      return;
    }
    const code = error instanceof Error ? error.message : 'COMPLIANCE_DOSSIER_READ_ERROR';
    res.status(500).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'COMPLIANCE_DOSSIER_READ_ERROR', message: code },
      }),
    );
  }
}

