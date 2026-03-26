/**
 * FASE 40 — Entidade de execução persistida do motor DECYON.
 *
 * Registra 100% bruto de cada execução: payload de entrada, resposta do motor,
 * metadados derivados. Nenhum dado é transformado, limpo ou resumido.
 */

export interface ProcessExecution {
  id: string;
  tenantId: string;
  executedBy: string;
  createdAt: string;
  requestPayload: Record<string, unknown>;
  response: Record<string, unknown>;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  httpStatus: number;
  modulesExecuted: string[];
  validationCodes: string[];
}

export interface ProcessExecutionSummary {
  id: string;
  executedBy: string;
  createdAt: string;
  processId?: string;
  finalStatus: string;
  halted: boolean;
  haltedBy?: string;
  httpStatus: number;
  validationCodesCount: number;
  modulesExecuted: string[];
}
