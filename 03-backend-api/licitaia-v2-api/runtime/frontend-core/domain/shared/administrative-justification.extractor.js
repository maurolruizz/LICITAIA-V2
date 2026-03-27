"use strict";
/**
 * Extrator de justificativa administrativa do payload.
 * Fase 24 — Consolidação da justificativa administrativa no núcleo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAdministrativeJustification = extractAdministrativeJustification;
/** Mínimo de caracteres para um dos campos problemStatement/administrativeNeed/expectedOutcome contar como conteúdo material (regra auditável). */
const MIN_MATERIAL_LENGTH = 20;
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
}
function asArray(value) {
    return Array.isArray(value) ? value : null;
}
function getText(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
}
function normalizeTargetType(value) {
    if (typeof value !== 'string')
        return null;
    const v = value.trim().toLowerCase();
    if (v === 'process')
        return 'process';
    if (v === 'item')
        return 'item';
    if (v === 'lot')
        return 'lot';
    return null;
}
function hasMaterialContent(...texts) {
    return texts.some((t) => t.length >= MIN_MATERIAL_LENGTH);
}
/**
 * Normaliza uma entrada bruta. Não descarta entradas estruturalmente inválidas:
 * preserva-as para o validator bloquear (evita perda silenciosa de informação).
 * Retorna null apenas quando o valor não é um objeto (ex.: elemento do array não é objeto).
 */
function normalizeEntry(raw) {
    const rec = asRecord(raw);
    if (!rec)
        return null;
    const targetTypeNormalized = normalizeTargetType(rec.targetType);
    const targetType = targetTypeNormalized ?? (getText(rec.targetType) || 'unknown');
    const targetId = getText(rec.targetId) || undefined;
    const context = getText(rec.context) || undefined;
    const problemStatement = getText(rec.problemStatement) || undefined;
    const administrativeNeed = getText(rec.administrativeNeed) || undefined;
    const expectedOutcome = getText(rec.expectedOutcome) || undefined;
    const legalBasis = getText(rec.legalBasis) || undefined;
    const sourcePath = getText(rec.sourcePath) || undefined;
    const extractedFromRaw = asArray(rec.extractedFrom);
    const extractedFrom = extractedFromRaw && extractedFromRaw.length > 0
        ? extractedFromRaw.map((x) => getText(x)).filter(Boolean)
        : undefined;
    return {
        targetType,
        targetId,
        context: context || undefined,
        problemStatement: problemStatement || undefined,
        administrativeNeed: administrativeNeed || undefined,
        expectedOutcome: expectedOutcome || undefined,
        legalBasis: legalBasis || undefined,
        sourcePath: sourcePath || undefined,
        extractedFrom,
    };
}
/**
 * Extrai e normaliza a justificativa administrativa do payload.
 *
 * Política de retrocompatibilidade:
 * - ausência de justificativa → retorna lista vazia
 * - aceita administrativeJustifications (array) ou administrativeJustification (objeto único)
 * - nunca lança erro; validações estruturais ficam no validator.
 */
function extractAdministrativeJustification(payload) {
    const raw = payload ?? {};
    const listRaw = asArray(raw['administrativeJustifications']);
    const singleRaw = asRecord(raw['administrativeJustification']);
    // Política: quando ambos existem, preserva ambos (evita perda silenciosa em cenários multi-itens/lote).
    const candidates = [
        ...(listRaw ?? []),
        ...(singleRaw ? [singleRaw] : []),
    ];
    const entries = [];
    for (const c of candidates) {
        const e = normalizeEntry(c);
        if (e)
            entries.push(e);
    }
    const processJustificationCount = entries.filter((e) => e.targetType === 'process').length;
    const itemJustificationCount = entries.filter((e) => e.targetType === 'item').length;
    const lotJustificationCount = entries.filter((e) => e.targetType === 'lot').length;
    /* withLegalBasisCount e missingCriticalFieldsCount consideram todas as entradas extraídas (incl. inválidas) para rastreabilidade. */
    const withLegalBasisCount = entries.filter((e) => (e.legalBasis ?? '').length > 0).length;
    const missingCriticalFieldsCount = entries.filter((e) => !hasMaterialContent(e.problemStatement ?? '', e.administrativeNeed ?? '', e.expectedOutcome ?? '')).length;
    return {
        entries,
        count: entries.length,
        processJustificationCount,
        itemJustificationCount,
        lotJustificationCount,
        withLegalBasisCount,
        missingCriticalFieldsCount,
    };
}
