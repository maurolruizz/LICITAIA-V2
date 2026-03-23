/**
 * FASE 40 — Repositório de execuções persistidas.
 * FASE 42 — Blindagem: normalização defensiva + filtragem de registros inválidos.
 *
 * Armazenamento em arquivo JSON local.
 * Zero dependências externas além do Node.js built-in (fs, path).
 *
 * Caminho do arquivo: <package-root>/data/executions.json
 * Operações síncronas — seguras no contexto single-thread do Node.js.
 */

import fs from 'fs';
import path from 'path';
import type { ProcessExecution } from './process-execution.entity';

const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'executions.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * FASE 42 — Predicado de identidade estrutural mínima.
 *
 * Um registro só pode participar do conjunto operacional se possuir um `id`
 * string não vazio. O campo `id` é insubstituível: sem ele não há trilha de
 * auditoria, não há detalhe recuperável, não há identidade de execução.
 *
 * Todos os demais campos (modulesExecuted, validationCodes, finalStatus, etc.)
 * são toleráveis como ausentes — há defaults auditáveis ([], 'UNKNOWN', 0).
 * O `id` não tem default válido: nenhum valor artificial pode substituir a
 * identidade que o sistema deveria ter gerado no momento da persistência.
 *
 * Registros que falham neste predicado são silenciosamente descartados da
 * leitura operacional. Eles permanecem no arquivo físico sem alteração.
 */
function hasValidIdentity(raw: Record<string, unknown>): boolean {
  return typeof raw['id'] === 'string' && raw['id'].length > 0;
}

/**
 * FASE 42 — Normaliza um registro estruturalmente identificável.
 *
 * Pré-condição: o registro já passou por `hasValidIdentity()`.
 * Portanto, `id` é garantidamente uma string não vazia neste ponto.
 *
 * Campos opcionais ausentes recebem defaults auditáveis:
 *   - modulesExecuted → []  (módulos não registrados nesta execução)
 *   - validationCodes → []  (sem códigos de validação registrados)
 *   - finalStatus     → 'UNKNOWN'  (status não registrado)
 *   - halted          → false  (conservador: não bloquear sem evidência)
 *   - httpStatus      → 0  (HTTP não registrado)
 *   - createdAt       → epoch ISO  (data não registrada)
 *
 * Esses defaults permitem leitura degradada sem mascarar identidade:
 * o auditor vê os dados faltantes como ausentes, não como fabricados.
 */
function normalizeExecution(raw: Record<string, unknown>): ProcessExecution {
  return {
    id:              raw['id'] as string,
    createdAt:       typeof raw['createdAt'] === 'string'   ? raw['createdAt']    : new Date(0).toISOString(),
    requestPayload:  (raw['requestPayload'] !== null && typeof raw['requestPayload'] === 'object' && !Array.isArray(raw['requestPayload']))
      ? (raw['requestPayload'] as Record<string, unknown>)
      : {},
    response:        (raw['response'] !== null && typeof raw['response'] === 'object' && !Array.isArray(raw['response']))
      ? (raw['response'] as Record<string, unknown>)
      : {},
    finalStatus:     typeof raw['finalStatus'] === 'string'  ? raw['finalStatus'] : 'UNKNOWN',
    halted:          typeof raw['halted'] === 'boolean'       ? raw['halted']      : false,
    haltedBy:        typeof raw['haltedBy'] === 'string'      ? raw['haltedBy']    : undefined,
    httpStatus:      typeof raw['httpStatus'] === 'number'    ? raw['httpStatus']  : 0,
    modulesExecuted: Array.isArray(raw['modulesExecuted'])
      ? (raw['modulesExecuted'] as unknown[]).filter((m): m is string => typeof m === 'string')
      : [],
    validationCodes: Array.isArray(raw['validationCodes'])
      ? (raw['validationCodes'] as unknown[]).filter((c): c is string => typeof c === 'string')
      : [],
  };
}

function readAll(): ProcessExecution[] {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
      )
      .filter(hasValidIdentity)
      .map(normalizeExecution);
  } catch {
    return [];
  }
}

function writeAll(executions: ProcessExecution[]): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(executions, null, 2), 'utf-8');
}

export function saveExecution(execution: ProcessExecution): void {
  const all = readAll();
  all.push(execution);
  writeAll(all);
}

export function findAllExecutions(): ProcessExecution[] {
  return readAll();
}

export function findExecutionById(id: string): ProcessExecution | undefined {
  return readAll().find((e) => e.id === id);
}
