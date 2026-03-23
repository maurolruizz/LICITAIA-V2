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

export function listExecutionsController(_req: Request, res: Response): void {
  const executions = listExecutions();
  res.status(200).json(
    withInstitutionalMeta(res, {
      success: true,
      data: executions,
      total: executions.length,
    }),
  );
}

export function getExecutionController(req: Request, res: Response): void {
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
  const execution = getExecutionById(id);
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
