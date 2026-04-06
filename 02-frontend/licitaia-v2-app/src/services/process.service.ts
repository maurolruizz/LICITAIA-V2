import { api } from "@/lib/http";
import { isApiSuccessEnvelope } from "@/lib/api-envelope";

/** Registro de processo administrativo (tabela `processes` no backend). */
export type ProcessRecord = {
  id: string;
  tenantId: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Resumo de execução persistida do motor (GET /api/process/executions). */
export type ProcessExecutionSummary = {
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
};

export type CreateProcessResult = {
  process: ProcessRecord;
  state: Record<string, unknown>;
};

export type GetProcessResult = CreateProcessResult;

function isProcessRecord(value: unknown): value is ProcessRecord {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.tenantId === "string" &&
    (o.createdBy === null || typeof o.createdBy === "string") &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function isExecutionSummary(value: unknown): value is ProcessExecutionSummary {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.executedBy === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.finalStatus === "string" &&
    typeof o.halted === "boolean" &&
    typeof o.httpStatus === "number" &&
    typeof o.validationCodesCount === "number" &&
    Array.isArray(o.modulesExecuted) &&
    o.modulesExecuted.every((m) => typeof m === "string") &&
    (o.processId === undefined || typeof o.processId === "string") &&
    (o.haltedBy === undefined || typeof o.haltedBy === "string")
  );
}

function parseCreateOrGetEnvelope(body: unknown): CreateProcessResult | null {
  if (!isApiSuccessEnvelope(body)) return null;
  const d = body.data;
  if (!d || typeof d !== "object") return null;
  const rec = (d as Record<string, unknown>).process;
  const state = (d as Record<string, unknown>).state;
  if (!isProcessRecord(rec) || typeof state !== "object" || state === null || Array.isArray(state)) {
    return null;
  }
  return { process: rec, state: state as Record<string, unknown> };
}

/**
 * Lista execuções persistidas do motor no tenant autenticado.
 * Backend: GET /api/process-executions?limit=
 * (Usa-se o alias com hífen: /api/process/executions colide com GET /api/process/:id no Express.)
 * Não existe GET /api/process para listar só processos de fluxo; esta é a listagem operacional disponível.
 */
export async function listProcessExecutions(limit = 50): Promise<{
  items: ProcessExecutionSummary[];
  total: number;
}> {
  /** Alias oficial sem colisão com GET /api/process/:id (id="executions"). */
  const { data: body } = await api.get<unknown>("/api/process-executions", {
    params: { limit },
  });
  if (!isApiSuccessEnvelope(body) || !Array.isArray(body.data)) {
    throw new Error("Resposta de listagem de execuções em formato inesperado.");
  }
  const items = body.data.filter(isExecutionSummary);
  if (items.length !== body.data.length) {
    throw new Error("Itens de execução com formato inesperado.");
  }
  const raw = body as unknown as Record<string, unknown>;
  const total =
    typeof raw["total"] === "number" ? raw["total"] : items.length;
  return { items, total };
}

/**
 * Cria processo administrativo de fluxo e sessão inicial.
 * Backend: POST /api/process/ — body opcional { processId?: string }
 */
export async function createAdministrativeProcess(
  payload: { processId?: string } = {},
): Promise<CreateProcessResult> {
  const { data: body } = await api.post<unknown>("/api/process", payload);
  const parsed = parseCreateOrGetEnvelope(body);
  if (!parsed) {
    throw new Error("Resposta de criação de processo em formato inesperado.");
  }
  return parsed;
}

/**
 * Obtém processo administrativo e snapshot do fluxo.
 * Backend: GET /api/process/:id
 */
export async function getAdministrativeProcess(
  processId: string,
): Promise<GetProcessResult> {
  const { data: body } = await api.get<unknown>(`/api/process/${encodeURIComponent(processId)}`);
  const parsed = parseCreateOrGetEnvelope(body);
  if (!parsed) {
    throw new Error("Resposta de detalhe do processo em formato inesperado.");
  }
  return parsed;
}
