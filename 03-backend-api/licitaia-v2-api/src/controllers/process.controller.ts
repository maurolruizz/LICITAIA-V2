import type { Request, Response } from 'express';
import type {
  AdministrativeProcessContext,
  AdministrativeProcessResult,
} from '../dto/administrative-process.types';
import type { ProcessRunResponseBody } from '../dto/process-run-response.types';
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

const { runAdministrativeProcess } = require(
  '../../../../02-frontend/licitaia-v2-web/modules-dist'
) as {
  runAdministrativeProcess(
    context: AdministrativeProcessContext
  ): Promise<AdministrativeProcessResult>;
};

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

    const context = normalizeToContext(validation.data);
    const rawEngineResult: AdministrativeProcessResult =
      await runAdministrativeProcess(context);
    const engineResult: AdministrativeProcessResult = applyAiAssistiveLayer(rawEngineResult);

    const responseBody: ProcessRunResponseBody = buildEngineResponse(engineResult);

    const httpStatus = engineResult.success ? 200 : engineResult.halted ? 409 : 422;

    // Persiste a execução — falha de persistência não bloqueia a resposta da API.
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

      saveExecution({
        requestPayload: body as Record<string, unknown>,
        response: responseBody as unknown as Record<string, unknown>,
        finalStatus: engineResult.finalStatus,
        halted: engineResult.halted,
        ...(haltedBy !== undefined ? { haltedBy } : {}),
        httpStatus,
        modulesExecuted,
        validationCodes,
      });
    } catch (saveError) {
      logger.error(`${rid}[PERSIST_FAIL] Falha ao persistir execução — ${saveError instanceof Error ? saveError.message : String(saveError)}`);
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
    const context = normalizeToContext(validation.data);
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

