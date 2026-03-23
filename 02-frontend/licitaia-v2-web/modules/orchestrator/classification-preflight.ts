/**
 * ETAPA A — Pré-verificação de coerência classificação ↔ payload (Frente 2).
 * Executada no motor após snapshot inicial; falhas geram HALTED_BY_VALIDATION.
 */

import { extractProcurementStructure } from '../domain/shared/object-structure.extractor';

export const CLASSIFICATION_PREFLIGHT_CODES = {
  CLASSIFICATION_PAYLOAD_MISMATCH: 'CLASSIFICATION_PAYLOAD_MISMATCH',
  PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION: 'PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION',
  CLASSIFICATION_INTERNAL_CONFLICT: 'CLASSIFICATION_INTERNAL_CONFLICT',
} as const;

export type ClassificationPreflightResult =
  | { ok: true }
  | {
      ok: false;
      code: (typeof CLASSIFICATION_PREFLIGHT_CODES)[keyof typeof CLASSIFICATION_PREFLIGHT_CODES];
      message: string;
    };

const DECLARED_TO_EXTRACTED: Record<string, 'single_item' | 'multiple_items' | 'lot'> = {
  ITEM_UNICO: 'single_item',
  MULTIPLOS_ITENS: 'multiple_items',
  LOTE: 'lot',
};

/** Modalidades de competição típicas de licitação (não são contratação direta). */
const LICITATION_MODALITIES = new Set([
  'PREGAO',
  'CONCORRENCIA',
  'CONCURSO',
  'LEILAO',
  'DIALOGO_COMPETITIVO',
  'CREDENCIAMENTO',
]);

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function getText(v: unknown): string {
  if (v === undefined || v === null) return '';
  return typeof v === 'string' ? v.trim() : String(v).trim();
}

function getProcessProcurementModality(snapshot: Record<string, unknown>): string {
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps) {
    const m = getText(ps['procurementModality']).toUpperCase();
    if (m) return m;
  }
  const arr = snapshot['procurementStrategies'];
  if (Array.isArray(arr) && arr.length > 0) {
    const first = asRecord(arr[0]);
    if (first) {
      const m = getText(first['procurementModality']).toUpperCase();
      if (m) return m;
    }
  }
  return '';
}

function collectStrategyModalities(snapshot: Record<string, unknown>): string[] {
  const out: string[] = [];
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps) {
    const m = getText(ps['procurementModality']).toUpperCase();
    if (m) out.push(m);
  }
  const arr = snapshot['procurementStrategies'];
  if (Array.isArray(arr)) {
    for (const raw of arr) {
      const e = asRecord(raw);
      if (e) {
        const m = getText(e['procurementModality']).toUpperCase();
        if (m) out.push(m);
      }
    }
  }
  return out;
}

/**
 * Verifica coerência entre classificadores declarados e material extraível do snapshot.
 */
export function runClassificationPreflight(
  snapshot: Record<string, unknown>
): ClassificationPreflightResult {
  const declaredStructure = getText(snapshot['objectStructure']);
  const expectedExtracted = DECLARED_TO_EXTRACTED[declaredStructure];
  if (!expectedExtracted) {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION,
      message: 'objectStructure declarado não é reconhecido para pré-verificação estrutural.',
    };
  }

  const extracted = extractProcurementStructure(snapshot);
  if (extracted.structureType !== expectedExtracted) {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
      message: `objectStructure declarado (${declaredStructure}) não corresponde à estrutura derivada do payload (${extracted.structureType}).`,
    };
  }

  const legalRegime = getText(snapshot['legalRegime']);
  const modality = getProcessProcurementModality(snapshot);

  if (!modality) {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION,
      message: 'procurementStrategy.procurementModality ausente: insuficiente para validar coerência com legalRegime.',
    };
  }

  if (legalRegime === 'LICITACAO') {
    if (modality === 'DISPENSA' || modality === 'INEXIGIBILIDADE') {
      return {
        ok: false,
        code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
        message: 'legalRegime LICITACAO incompatível com modalidade de contratação direta declarada na estratégia.',
      };
    }
    if (!LICITATION_MODALITIES.has(modality)) {
      return {
        ok: false,
        code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
        message: 'legalRegime LICITACAO exige modalidade de licitação reconhecida na estratégia.',
      };
    }
  }

  if (legalRegime === 'DISPENSA' && modality !== 'DISPENSA') {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
      message: 'legalRegime DISPENSA exige procurementModality DISPENSA na estratégia de processo.',
    };
  }

  if (legalRegime === 'INEXIGIBILIDADE' && modality !== 'INEXIGIBILIDADE') {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
      message: 'legalRegime INEXIGIBILIDADE exige procurementModality INEXIGIBILIDADE na estratégia de processo.',
    };
  }

  const modalities = collectStrategyModalities(snapshot);
  const distinct = Array.from(new Set(modalities));
  if (distinct.length > 1) {
    return {
      ok: false,
      code: CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_INTERNAL_CONFLICT,
      message: 'Existem modalidades de contratação distintas entre estratégia de processo e estratégias por item.',
    };
  }

  return { ok: true };
}
