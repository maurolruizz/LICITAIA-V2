"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSemanticPreservation = validateSemanticPreservation;
exports.validateProhibitedContent = validateProhibitedContent;
const PROHIBITED_PATTERN = /\b(art\.?|artigo|lei|decreto|jurisprud[eê]ncia)\b/i;
function normalizeForSemanticComparison(input) {
    return input
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function validateSemanticPreservation(originalText, refinedText) {
    const o = normalizeForSemanticComparison(originalText);
    const r = normalizeForSemanticComparison(refinedText);
    return o === r ? 'preserved' : 'not_preserved';
}
function validateProhibitedContent(originalText, refinedText) {
    const originalHasLegalPattern = PROHIBITED_PATTERN.test(originalText);
    const refinedHasLegalPattern = PROHIBITED_PATTERN.test(refinedText);
    if (!originalHasLegalPattern && refinedHasLegalPattern) {
        return 'violated';
    }
    return 'clean';
}
