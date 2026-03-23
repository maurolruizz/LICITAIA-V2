const PROHIBITED_PATTERN = /\b(art\.?|artigo|lei|decreto|jurisprud[eê]ncia)\b/i;

function normalizeForSemanticComparison(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateSemanticPreservation(
  originalText: string,
  refinedText: string
): 'preserved' | 'not_preserved' {
  const o = normalizeForSemanticComparison(originalText);
  const r = normalizeForSemanticComparison(refinedText);
  return o === r ? 'preserved' : 'not_preserved';
}

export function validateProhibitedContent(
  originalText: string,
  refinedText: string
): 'clean' | 'violated' {
  const originalHasLegalPattern = PROHIBITED_PATTERN.test(originalText);
  const refinedHasLegalPattern = PROHIBITED_PATTERN.test(refinedText);
  if (!originalHasLegalPattern && refinedHasLegalPattern) {
    return 'violated';
  }
  return 'clean';
}
