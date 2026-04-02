/**
 * Verificação determinística de referência normativa mínima (auditável, sem NLP).
 * Exige indício estrutural: artigo numerado, lei numerada, decreto/portaria numerados ou inciso.
 */

/** Padrões que comprovam citação normativa verificável (não bastam termos genéricos). */
const NORMATIVE_STRUCTURE_PATTERNS: RegExp[] = [
  /\bart\.?\s*\d+/i,
  /\bartigos?\s+\d+/i,
  /\blei\s*(?:complementar\s*)?(?:n[º°.]?\s*)?[\d.]+/i,
  /\blei\s+n[º°]?\s*14[./]?\s*133/i,
  /\b(?:decreto|portaria|instru[cç][aã]o\s+normativa)\s*(?:n[º°.]?\s*)?\d+/i,
  /\binciso\s+[ivxlcdm\d]+/i,
  /§\s*\d+/,
];

/**
 * Termos isolados que não constituem base legal (rejeição quando não há padrão normativo).
 */
const GENERIC_ISOLATED_BASIS = new Set([
  'dispensa',
  'dispensa de licitação',
  'dispensa de licitaçao',
  'inexigibilidade',
  'inexigibilidade de licitação',
  'licitação',
  'licitacao',
  'pregão',
  'pregao',
  'contratação direta',
  'contratacao direta',
]);

/**
 * Retorna true se o texto contém referência normativa estruturalmente identificável.
 */
export function hasVerifiableNormativeStructure(text: string): boolean {
  const t = text?.trim() ?? '';
  if (t.length === 0) return false;
  return NORMATIVE_STRUCTURE_PATTERNS.some((re) => re.test(t));
}

/**
 * True se o texto normalizado é só linguagem genérica, sem citação normativa.
 */
export function isIsolatedGenericLegalLanguage(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t.length === 0) return true;
  if (hasVerifiableNormativeStructure(t)) return false;
  return GENERIC_ISOLATED_BASIS.has(t);
}
