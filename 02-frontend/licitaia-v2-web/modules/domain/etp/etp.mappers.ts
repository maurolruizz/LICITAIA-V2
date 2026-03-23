/**
 * Mappers do módulo ETP.
 * Normalização do payload antes da validação e extração de contexto.
 */

import type { ModuleInputContract } from '../../core/contracts/module-input.contract';
import type { EtpPayload } from './etp.types';

const ETP_PAYLOAD_KEYS: (keyof EtpPayload)[] = [
  'needDescription',
  'expectedResults',
  'solutionSummary',
  'technicalJustification',
  'requestingDepartment',
  'responsibleAnalyst',
  'analysisDate',
  'additionalNotes',
];

/**
 * Normaliza o payload recebido para o formato esperado pelo ETP.
 * Garante presença das chaves obrigatórias (string vazia se ausente) para validação.
 */
export function normalizeEtpPayload(
  payload: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const raw = payload ?? {};
  const normalized: Record<string, unknown> = {};
  for (const key of ETP_PAYLOAD_KEYS) {
    const value = raw[key];
    if (value === undefined || value === null) {
      normalized[key] = '';
    } else {
      normalized[key] = typeof value === 'string' ? value : String(value);
    }
  }
  // Preserva estrutura de objeto (retrocompatível; não altera contratos centrais)
  if (raw['structureType'] !== undefined) normalized['structureType'] = raw['structureType'];
  if (raw['items'] !== undefined) normalized['items'] = raw['items'];
  if (raw['lots'] !== undefined) normalized['lots'] = raw['lots'];
  if (raw['lotJustification'] !== undefined) normalized['lotJustification'] = raw['lotJustification'];
  if (raw['calculationMemories'] !== undefined) normalized['calculationMemories'] = raw['calculationMemories'];
  if (raw['calculationMemory'] !== undefined) normalized['calculationMemory'] = raw['calculationMemory'];
  if (raw['administrativeJustifications'] !== undefined) normalized['administrativeJustifications'] = raw['administrativeJustifications'];
  if (raw['administrativeJustification'] !== undefined) normalized['administrativeJustification'] = raw['administrativeJustification'];
  if (raw['administrativeNeeds'] !== undefined) normalized['administrativeNeeds'] = raw['administrativeNeeds'];
  if (raw['administrativeNeed'] !== undefined) normalized['administrativeNeed'] = raw['administrativeNeed'];
  if (raw['procurementStrategies'] !== undefined) normalized['procurementStrategies'] = raw['procurementStrategies'];
  if (raw['procurementStrategy'] !== undefined) normalized['procurementStrategy'] = raw['procurementStrategy'];
  return normalized;
}

/**
 * Extrai contexto do input para uso interno (metadados, eventos).
 */
export function mapEtpPayloadToContext(input: ModuleInputContract): Record<string, unknown> {
  return {
    studyId: input.payload?.studyId,
    phase: input.phase,
    ...input.context,
  };
}
