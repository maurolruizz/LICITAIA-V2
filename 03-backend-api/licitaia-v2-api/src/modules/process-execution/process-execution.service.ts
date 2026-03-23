/**
 * FASE 40 — Serviço de execuções persistidas.
 * FASE 42 — Blindagem: derivação centralizada e defensiva do summary operacional.
 *
 * Camada de negócio entre controller e repositório.
 * Responsável por: gerar ID único, montar a entidade, delegar ao repositório,
 * e derivar deterministicamente o summary a partir da entidade normalizada.
 */

import { randomUUID } from 'crypto';
import type { ProcessExecution, ProcessExecutionSummary } from './process-execution.entity';
import {
  saveExecution as repoSave,
  findAllExecutions,
  findExecutionById,
} from './process-execution.repository';

export interface SaveExecutionParams {
  requestPayload: Record<string, unknown>;
  response: Record<string, unknown>;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  httpStatus: number;
  modulesExecuted: string[];
  validationCodes: string[];
}

export function saveExecution(params: SaveExecutionParams): ProcessExecution {
  const execution: ProcessExecution = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    requestPayload: params.requestPayload,
    response: params.response,
    finalStatus: params.finalStatus,
    halted: params.halted,
    ...(params.haltedBy !== undefined ? { haltedBy: params.haltedBy } : {}),
    httpStatus: params.httpStatus,
    modulesExecuted: params.modulesExecuted,
    validationCodes: params.validationCodes,
  };
  repoSave(execution);
  return execution;
}

/**
 * FASE 42 — Derivação centralizada e determinística do summary operacional.
 *
 * Todo campo do summary é derivado exclusivamente a partir da entidade
 * normalizada. O frontend não precisa interpretar nem inferir nada.
 * A presença de `haltedBy` é propagada apenas quando o campo existe,
 * evitando que o summary carregue chaves com valor undefined.
 */
export function buildExecutionSummary(e: ProcessExecution): ProcessExecutionSummary {
  const summary: ProcessExecutionSummary = {
    id:                  e.id,
    createdAt:           e.createdAt,
    processId:           typeof e.requestPayload['processId'] === 'string'
                           ? (e.requestPayload['processId'] as string)
                           : undefined,
    finalStatus:         e.finalStatus,
    halted:              e.halted,
    httpStatus:          e.httpStatus,
    validationCodesCount: e.validationCodes.length,
    modulesExecuted:     e.modulesExecuted,
  };
  if (e.haltedBy !== undefined) {
    summary.haltedBy = e.haltedBy;
  }
  return summary;
}

export function listExecutions(): ProcessExecutionSummary[] {
  return findAllExecutions()
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(buildExecutionSummary);
}

export function getExecutionById(id: string): ProcessExecution | undefined {
  return findExecutionById(id);
}
