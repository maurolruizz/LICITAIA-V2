/**
 * Extração objetiva de fatos do snapshot para o regime-behavior-engine.
 * Não substitui validators; apenas lê campos para política normativa.
 */

import { LEGAL_BASIS_REQUIRED_KEYWORDS } from '../domain/shared/administrative-document-consistency.types';

const LICITATION_MODALITIES = new Set([
  'PREGAO',
  'CONCORRENCIA',
  'CONCURSO',
  'LEILAO',
  'DIALOGO_COMPETITIVO',
  'CREDENCIAMENTO',
]);

/** Sinais objetivos de inviabilidade de competição (texto em campos de estratégia). */
const INVIABILITY_SIGNAL_KEYWORDS = [
  'inviabilidade',
  'inviável',
  'inviavel',
  'singular',
  'exclusiv',
  'inexistência',
  'inexistencia',
  'art. 74',
  'art 74',
] as const;

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function getText(v: unknown): string {
  if (v === undefined || v === null) return '';
  return typeof v === 'string' ? v.trim() : String(v).trim();
}

export function getLegalRegimeRaw(snapshot: Record<string, unknown>): string {
  return getText(snapshot['legalRegime']).toUpperCase();
}

export function getProcessProcurementModality(snapshot: Record<string, unknown>): string {
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

export function getCompetitionStrategy(snapshot: Record<string, unknown>): string {
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps) {
    const c = getText(ps['competitionStrategy']).toUpperCase();
    if (c) return c;
  }
  return '';
}

function collectJustificationTextsForBasis(snapshot: Record<string, unknown>): string {
  const parts: string[] = [];
  const dfd = asRecord(snapshot['dfd']);
  if (dfd) {
    parts.push(getText(dfd['hiringJustification']));
  }
  parts.push(getText(snapshot['hiringJustification']));
  const etp = asRecord(snapshot['etp']);
  if (etp) {
    parts.push(getText(etp['technicalJustification']));
  }
  parts.push(getText(snapshot['technicalJustification']));
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps) {
    parts.push(getText(ps['contractingJustification']));
  }
  return parts.join(' ').toLowerCase();
}

/** Comprimento mínimo agregado para aceitar via keywords (evita acerto acidental em frase curta). */
const MIN_AGGREGATE_LENGTH_FOR_LEGAL_BASIS_KEYWORD_PATH = 40;

/**
 * Fundamento mínimo para regimes diretos: (1) base legal declarada em campo estruturado OU
 * (2) keywords normativas em textos agregados com comprimento mínimo.
 * Keywords não são critério isolado — exigem lastro de texto ou campo objetivo.
 */
export function hasMinimumLegalBasisSupport(snapshot: Record<string, unknown>): boolean {
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps && getText(ps['legalBasis']).length >= 8) {
    return true;
  }
  const aj = asRecord(snapshot['administrativeJustification']);
  if (aj && getText(aj['legalBasis']).length >= 8) {
    return true;
  }
  const combined = collectJustificationTextsForBasis(snapshot);
  const trimmed = combined.trim();
  if (trimmed.length < MIN_AGGREGATE_LENGTH_FOR_LEGAL_BASIS_KEYWORD_PATH) {
    return false;
  }
  return (LEGAL_BASIS_REQUIRED_KEYWORDS as readonly string[]).some((kw) =>
    trimmed.includes(kw.toLowerCase())
  );
}

const MIN_STRATEGY_TEXT_FOR_INVIABILITY_KEYWORD_PATH = 28;

/**
 * Suporte a inexigibilidade: (1) `procurementStrategy.legalBasis` preenchido (fato objetivo) OU
 * (2) sinais textuais em campos de estratégia com comprimento mínimo (keywords como auxiliar, não isoladas).
 */
export function hasInviabilitySupport(snapshot: Record<string, unknown>): boolean {
  const ps = asRecord(snapshot['procurementStrategy']);
  if (ps && getText(ps['legalBasis']).length >= 8) {
    return true;
  }
  const cj = ps ? getText(ps['contractingJustification']) : '';
  const tj = getText(snapshot['technicalJustification']);
  const combined = `${cj} ${tj}`.toLowerCase().trim();
  if (combined.length < MIN_STRATEGY_TEXT_FOR_INVIABILITY_KEYWORD_PATH) {
    return false;
  }
  return INVIABILITY_SIGNAL_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
}

/** Dispensa: pricing exigível quando há sinal objetivo de valor estimado ou objeto de compra estruturado. */
export function isPricingExigibleForDispensa(snapshot: Record<string, unknown>): boolean {
  const v = snapshot['estimatedTotalValue'];
  if (typeof v === 'number' && !Number.isNaN(v) && v > 0) return true;
  const ot = getText(snapshot['objectType']);
  const ef = getText(snapshot['executionForm']);
  return ot.length > 0 && ef.length > 0;
}

/**
 * Presença de pricing (ainda que insuficiente): qualquer sinal de valor ou justificativa.
 * Usado para diferenciar ausência total vs insuficiência normativa.
 */
export function hasAnyPricingPresence(snapshot: Record<string, unknown>): boolean {
  const unit = snapshot['estimatedUnitValue'];
  const total = snapshot['estimatedTotalValue'];
  const pj = getText(snapshot['pricingJustification']);
  return (
    typeof unit === 'number' ||
    typeof total === 'number' ||
    pj.length > 0
  );
}

export function hasMinimumPricingSupport(snapshot: Record<string, unknown>): boolean {
  const unit = snapshot['estimatedUnitValue'];
  const total = snapshot['estimatedTotalValue'];
  const hasValue =
    (typeof unit === 'number' && !Number.isNaN(unit) && unit > 0) ||
    (typeof total === 'number' && !Number.isNaN(total) && total > 0);
  const pj = getText(snapshot['pricingJustification']);
  return hasValue && pj.length > 0;
}

export function evaluateRegimeModalityCompatibility(
  regime: string,
  modality: string
): { ok: boolean } {
  if (!modality) return { ok: false };
  if (regime === 'LICITACAO') {
    if (modality === 'DISPENSA' || modality === 'INEXIGIBILIDADE') return { ok: false };
    return { ok: LICITATION_MODALITIES.has(modality) };
  }
  if (regime === 'DISPENSA') {
    return { ok: modality === 'DISPENSA' };
  }
  if (regime === 'INEXIGIBILIDADE') {
    return { ok: modality === 'INEXIGIBILIDADE' };
  }
  return { ok: false };
}

export function isOrdinaryCompetitionIncompatibleWithInexigibility(
  snapshot: Record<string, unknown>
): boolean {
  const regime = getLegalRegimeRaw(snapshot);
  if (regime !== 'INEXIGIBILIDADE') return false;
  return getCompetitionStrategy(snapshot) === 'OPEN_COMPETITION';
}
