import type { AdministrativeProcessResult } from '../../../dto/administrative-process.types';
import type {
  ReviewResultContract,
  ReviewResultFinalStatus,
} from './review-adapter.types';

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeFinalStatus(value: unknown): ReviewResultFinalStatus {
  if (
    value === 'SUCCESS' ||
    value === 'HALTED_BY_VALIDATION' ||
    value === 'HALTED_BY_DEPENDENCY' ||
    value === 'HALTED_BY_MODULE'
  ) {
    return value;
  }
  throw new Error('FLOW_ADAPTER_INVALID_FINAL_STATUS');
}

function mapValidationsToFlowShape(
  validations: unknown,
): Array<{ issueTrace: readonly string[]; severity: 'ERROR' | 'BLOCK' }> {
  if (!Array.isArray(validations)) {
    throw new Error('FLOW_ADAPTER_INVALID_VALIDATIONS');
  }

  return validations
    .filter((v) => isObject(v))
    .map((v) => {
      const code = typeof v['code'] === 'string' && v['code'].trim() !== '' ? v['code'].trim() : 'VALIDATION';
      const field = typeof v['field'] === 'string' && v['field'].trim() !== '' ? v['field'].trim() : undefined;
      const details = isObject(v['details']) ? v['details'] : null;
      const moduleId =
        details && typeof details['moduleId'] === 'string' && details['moduleId'].trim() !== ''
          ? String(details['moduleId'])
          : undefined;

      const severityRaw = typeof v['severity'] === 'string' ? v['severity'] : 'error';
      // Contrato do flow só aceita ERROR/BLOCK.
      // Política: BLOCK -> BLOCK, ERROR -> ERROR, WARNING/INFO -> ERROR (não descartamos sinal).
      const severity =
        severityRaw === 'block' || severityRaw === 'BLOCK' ? 'BLOCK' : 'ERROR';

      const trace = [
        `code:${code}`,
        ...(field ? [`field:${field}`] : []),
        ...(moduleId ? [`module:${moduleId}`] : []),
      ];

      return { issueTrace: trace, severity };
    });
}

function mapExecutedModules(executedModules: unknown): string[] {
  if (!Array.isArray(executedModules)) {
    throw new Error('FLOW_ADAPTER_INVALID_EXECUTED_MODULES');
  }
  return executedModules.map((m) => String(m));
}

function mapHaltedDetail(result: AdministrativeProcessResult): ReviewResultContract['haltedDetail'] {
  const raw = (result as unknown as Record<string, unknown>)['haltedDetail'];
  if (raw === undefined || raw === null) return null;
  if (!isObject(raw)) throw new Error('FLOW_ADAPTER_INVALID_HALTED_DETAIL');

  const type = raw['type'];
  const origin = raw['origin'];
  const haltedByModuleToken =
    typeof (result as any).haltedBy !== 'undefined' && (result as any).haltedBy !== null
      ? String((result as any).haltedBy)
      : null;

  if (type !== 'DEPENDENCY' && type !== 'VALIDATION' && type !== 'MODULE') {
    throw new Error('FLOW_ADAPTER_INVALID_HALTED_DETAIL_TYPE');
  }
  if (
    origin !== 'DEPENDENCY' &&
    origin !== 'CROSS_VALIDATION' &&
    origin !== 'LEGAL_VALIDATION' &&
    origin !== 'MODULE_SIGNAL' &&
    origin !== 'CLASSIFICATION_PREFLIGHT' &&
    origin !== 'REGIME_BEHAVIOR_ENGINE'
  ) {
    throw new Error('FLOW_ADAPTER_INVALID_HALTED_DETAIL_ORIGIN');
  }

  const code = typeof raw['code'] === 'string' && raw['code'].trim() !== '' ? raw['code'].trim() : undefined;
  const message =
    typeof raw['message'] === 'string' && raw['message'].trim() !== '' ? raw['message'].trim() : undefined;

  const motorOpaqueSegments = [
    `origin:${origin}`,
    `type:${type}`,
    ...(haltedByModuleToken ? [`haltedBy:${haltedByModuleToken}`] : []),
    ...(code ? [`code:${code}`] : []),
    ...(message ? [`message:${message}`] : []),
  ];

  return {
    type,
    origin,
    motorOpaqueSegments,
    haltedByModuleToken,
  };
}

/**
 * Adaptador puro: converte o resultado real do motor administrativo para o contrato atual do FlowController (`reviewResult`).
 *
 * Campos do motor que NÃO cabem em `reviewResult` (ex.: decisionMetadata, processSnapshot completo, events)
 * são intencionalmente descartados aqui. A perda é deliberada e deve ser tratada pela futura Etapa A
 * (ex.: persistência paralela, ou ampliação do contrato de review do flow).
 *
 * POLÍTICA ARQUITETURAL OBRIGATÓRIA:
 * `reviewSnapshotHash` NÃO é responsabilidade deste adaptador.
 * O hash deve ser calculado na orquestração do TRIGGER_REVIEW, a partir do snapshot
 * do FlowController no momento da revisão (flow-session.service), e nunca a partir
 * de `processSnapshot` retornado pelo motor.
 */
export function motorResultToReviewResult(result: AdministrativeProcessResult): ReviewResultContract {
  const finalStatus = normalizeFinalStatus((result as any).finalStatus);
  const validations = mapValidationsToFlowShape((result as any).validations);
  const executedModules = mapExecutedModules((result as any).executedModules);
  const haltedDetail = mapHaltedDetail(result);

  return {
    phase: 'POST_REVIEW',
    finalStatus,
    haltedDetail,
    validations,
    executedModules,
  };
}

