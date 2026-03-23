/**
 * Mappers do módulo Pricing.
 * Normalização do payload com conversão segura de números e fallback para campos ausentes.
 */

import type { ModuleInputContract } from '../../core/contracts/module-input.contract';
import type { PricingPayload } from './pricing.types';

const PRICING_PAYLOAD_KEYS: (keyof PricingPayload)[] = [
  'pricingSourceDescription',
  'referenceItemsDescription',
  'estimatedUnitValue',
  'estimatedTotalValue',
  'pricingJustification',
  'requestingDepartment',
  'responsibleAnalyst',
  'referenceDate',
  'additionalNotes',
];

/**
 * Converte valor para número de forma segura.
 * Retorna número ou NaN se inválido.
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/,/g, '.');
    const num = Number(trimmed);
    return Number.isNaN(num) ? Number.NaN : num;
  }
  const num = Number(value);
  return Number.isNaN(num) ? Number.NaN : num;
}

/**
 * Normaliza o payload recebido para o formato esperado pelo Pricing.
 * Conversão segura de números; fallback consistente para textos (string vazia) e números (0 para ausente, usado na validação para detectar inválido).
 */
export function normalizePricingPayload(
  payload: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const raw = payload ?? {};
  const normalized: Record<string, unknown> = {};

  for (const key of PRICING_PAYLOAD_KEYS) {
    if (key === 'estimatedUnitValue' || key === 'estimatedTotalValue') {
      const num = toNumber(raw[key]);
      normalized[key] = Number.isNaN(num) ? 0 : num;
    } else if (key === 'additionalNotes') {
      const value = raw[key];
      normalized[key] = value === undefined || value === null ? '' : (typeof value === 'string' ? value : String(value));
    } else {
      const value = raw[key];
      normalized[key] = value === undefined || value === null ? '' : (typeof value === 'string' ? value : String(value));
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
export function mapPricingPayloadToContext(input: ModuleInputContract): Record<string, unknown> {
  return {
    pricingId: input.payload?.pricingId,
    phase: input.phase,
    ...input.context,
  };
}
