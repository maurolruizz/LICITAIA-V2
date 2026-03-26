/**
 * FASE 40 — Controller dos endpoints de execuções persistidas.
 * FASE 48 — Respostas com `meta` institucional; erros com `error.code` padronizado.
 *
 * GET /api/process-executions        → lista resumida (id, data, status, halted)
 * GET /api/process-executions/:id    → execução completa (payload, resposta, validações)
 */

import type { Request, Response } from 'express';
import { withInstitutionalMeta } from '../../lib/response-meta';
import { listExecutions, getExecutionById } from './process-execution.service';
import type { AuthenticatedContext } from '../auth/auth.types';

export async function listExecutionsController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  const tenantId = ctx.authenticatedTenantId;
  if (!tenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }

  const limitParam = req.query['limit'];
  const limit =
    typeof limitParam === 'string' && limitParam.trim() !== '' ? Number(limitParam) : undefined;
  const executions = await listExecutions({
    tenantId,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  res.status(200).json(
    withInstitutionalMeta(res, {
      success: true,
      data: executions,
      total: executions.length,
    }),
  );
}

export async function getExecutionController(req: Request, res: Response): Promise<void> {
  const ctx = res.locals as Partial<AuthenticatedContext>;
  const tenantId = ctx.authenticatedTenantId;
  if (!tenantId) {
    res.status(401).json(
      withInstitutionalMeta(res, {
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Contexto de tenant ausente.' },
      }),
    );
    return;
  }

  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    res.status(400).json(
      withInstitutionalMeta(res, {
        success: false,
        error: {
          code: 'INVALID_EXECUTION_ID',
          message: 'id é obrigatório.',
        },
      }),
    );
    return;
  }
  const execution = await getExecutionById({ tenantId, id });
  if (!execution) {
    res.status(404).json(
      withInstitutionalMeta(res, {
        success: false,
        error: {
          code: 'EXECUTION_NOT_FOUND',
          message: `Execução ${id} não encontrada.`,
        },
      }),
    );
    return;
  }
  res.status(200).json(withInstitutionalMeta(res, { success: true, data: execution }));
}
