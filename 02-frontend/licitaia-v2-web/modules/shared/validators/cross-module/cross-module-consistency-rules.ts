/**
 * Regras de validação cruzada entre módulos do processo administrativo.
 * Comparação estrutural mínima entre descrições (DFD↔ETP, ETP↔TR, TR↔Pricing).
 * Sem IA, NLP ou análise semântica complexa.
 */

import type { ValidationItemContract } from '../../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../../core/factories/validation-result.factory';
import type { ModuleId } from '../../../core/enums/module-id.enum';

/** Par de módulos para validação cruzada: anterior → atual */
export type CrossModulePair = 'DFD_ETP' | 'ETP_TR' | 'TR_PRICING';

/** Comprimento mínimo de token para considerar na comparação (evita "de", "da", etc.) */
const MIN_TOKEN_LENGTH = 3;

/** Palavras triviais ignoradas no overlap (evita falsos positivos) */
const TRIVIAL_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'por', 'que',
  'em', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'à', 'às', 'um', 'uma',
  'os', 'as', 'o', 'a', 'e', 'ou', 'serviço', 'contratação', 'aquisição',
  'item', 'produto', 'objeto',
]);

/** Chaves do payload para extrair texto "principal" por módulo (para comparação) */
export const MODULE_DESCRIPTION_KEYS: Record<
  ModuleId,
  { main: string[]; label: string }
> = {
  DFD: { main: ['demandDescription'], label: 'demanda' },
  ETP: { main: ['needDescription', 'solutionSummary'], label: 'objeto/solução' },
  TR: { main: ['objectDescription'], label: 'objeto técnico' },
  PRICING: {
    main: ['referenceItemsDescription', 'pricingSourceDescription'],
    label: 'item precificado',
  },
};

/**
 * Extrai texto normalizado para comparação a partir de um objeto (payload ou result.data).
 * Proteção contra null, undefined e string vazia.
 */
export function extractDescriptionFromPayload(
  payload: Record<string, unknown> | null | undefined,
  moduleId: ModuleId
): string {
  const raw = payload ?? {};
  if (typeof raw !== 'object') return '';
  const config = MODULE_DESCRIPTION_KEYS[moduleId];
  const parts: string[] = [];
  for (const key of config.main) {
    const v = raw[key];
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s !== '') parts.push(s);
  }
  return parts.join(' ').trim();
}

/**
 * Normalização morfológica mínima para comparação: reduz variações simples singular/plural.
 * Apenas regras determinísticas e conservadoras (ex.: token terminado em "s" → forma sem "s").
 * Não usa stemmer complexo nem NLP.
 */
export function normalizeTokenForComparison(token: string): string {
  if (token == null || typeof token !== 'string') return token;
  const t = token.trim().toLowerCase();
  if (t.length < MIN_TOKEN_LENGTH) return t;
  if (t.endsWith('es') && t.length >= 5) {
    const base = t.slice(0, -2);
    if (base.length >= MIN_TOKEN_LENGTH) return base;
  }
  if (t.endsWith('s') && t.length >= 4) {
    const base = t.slice(0, -1);
    if (base.length >= MIN_TOKEN_LENGTH) return base;
  }
  return t;
}

/**
 * Tokeniza texto em palavras (minúsculas, sem pontuação) para comparação estrutural.
 * Retorna apenas tokens significativos: length >= MIN_TOKEN_LENGTH e não triviais.
 */
export function tokenizeForComparison(text: string): string[] {
  if (text == null || typeof text !== 'string') return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim();
  return normalized
    .split(/\s+/)
    .filter(
      (s) =>
        s.length >= MIN_TOKEN_LENGTH && !TRIVIAL_WORDS.has(s)
    );
}

/**
 * Retorna conjunto de formas normalizadas para overlap (singular/plural mínimo).
 * Exclui formas que, após normalização, caem em TRIVIAL_WORDS.
 */
function getNormalizedTokenSet(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of tokens) {
    const n = normalizeTokenForComparison(t);
    if (n.length >= MIN_TOKEN_LENGTH && !TRIVIAL_WORDS.has(n)) set.add(n);
  }
  return set;
}

/**
 * Verifica se há overlap mínimo de termos entre dois textos (pelo menos uma palavra significativa em comum).
 * Usa normalização morfológica mínima (ex.: notebook ↔ notebooks) para reduzir falsos warnings.
 */
export function hasMinimumTermOverlap(textPrevious: string, textCurrent: string): boolean {
  const prev = textPrevious != null ? String(textPrevious).trim() : '';
  const curr = textCurrent != null ? String(textCurrent).trim() : '';
  if (prev === '' || curr === '') return false;
  const tokensPrev = tokenizeForComparison(prev);
  const tokensCurr = tokenizeForComparison(curr);
  const setPrev = getNormalizedTokenSet(tokensPrev);
  if (setPrev.size === 0) return false;
  for (const t of tokensCurr) {
    const n = normalizeTokenForComparison(t);
    if (n.length >= MIN_TOKEN_LENGTH && !TRIVIAL_WORDS.has(n) && setPrev.has(n)) return true;
  }
  return false;
}

/**
 * Identificador da regra de validação cruzada para o par.
 */
export function getCrossValidationRuleId(pair: CrossModulePair): string {
  return `CROSS_MODULE_${pair}`;
}

/**
 * Aplica regra de consistência entre descrição do módulo anterior e do atual.
 * - BLOCK: quando o módulo atual tem objeto vazio e o anterior tem conteúdo (perda evidente).
 * - WARNING: quando ambos têm conteúdo mas não há overlap mínimo de termos.
 * - INFO: quando há overlap ou quando ambos vazios (apenas registro).
 */
export function applyConsistencyRule(
  pair: CrossModulePair,
  previousDescription: string,
  currentDescription: string,
  previousModuleId: ModuleId,
  currentModuleId: ModuleId
): ValidationItemContract[] {
  const ruleId = getCrossValidationRuleId(pair);
  const items: ValidationItemContract[] = [];
  const prevLabel = MODULE_DESCRIPTION_KEYS[previousModuleId].label;
  const currLabel = MODULE_DESCRIPTION_KEYS[currentModuleId].label;

  const prevStr = previousDescription != null ? String(previousDescription).trim() : '';
  const currStr = currentDescription != null ? String(currentDescription).trim() : '';
  const prevEmpty = prevStr === '';
  const currEmpty = currStr === '';

  if (currEmpty && !prevEmpty) {
    items.push(
      createValidationItem(
        `${ruleId}_OBJECT_MISSING`,
        `Objeto do módulo ${currentModuleId} está vazio enquanto ${prevLabel} do módulo ${previousModuleId} possui conteúdo. Inconsistência estrutural.`,
        ValidationSeverity.BLOCK,
        {
          field: MODULE_DESCRIPTION_KEYS[currentModuleId].main[0],
          details: {
            pair,
            previousModuleId,
            currentModuleId,
            previousLength: prevStr.length,
          },
        }
      )
    );
    return items;
  }

  if (prevEmpty && currEmpty) {
    items.push(
      createValidationItem(
        `${ruleId}_BOTH_EMPTY`,
        `Módulos ${previousModuleId} e ${currentModuleId} sem descrição principal. Verificar preenchimento.`,
        ValidationSeverity.INFO,
        { details: { pair } }
      )
    );
    return items;
  }

  if (!hasMinimumTermOverlap(prevStr, currStr)) {
    // ETAPA A — overlap lexical sem regra normativa associada: WARNING (não bloqueia pipeline).
    items.push(
      createValidationItem(
        `${ruleId}_NO_OVERLAP`,
        `Pouca correspondência lexical entre ${prevLabel} (${previousModuleId}) e ${currLabel} (${currentModuleId}). Revisar coerência.`,
        ValidationSeverity.WARNING,
        {
          details: {
            pair,
            previousModuleId,
            currentModuleId,
            previousLength: prevStr.length,
            currentLength: currStr.length,
          },
        }
      )
    );
    return items;
  }

  return items;
}
