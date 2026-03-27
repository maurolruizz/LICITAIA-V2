"use strict";
/**
 * Extrator de necessidade administrativa do payload.
 * Fase 26 — Motor de Necessidade Administrativa.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAdministrativeNeed = extractAdministrativeNeed;
const administrative_justification_extractor_1 = require("./administrative-justification.extractor");
/** Mínimo de caracteres para considerar problema ou resultado esperado presentes (auditável). */
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
/**
 * Normaliza uma entrada bruta. Preserva entradas estruturalmente inválidas
 * para o validator bloquear (evita perda silenciosa).
 */
function normalizeEntry(raw) {
    const rec = asRecord(raw);
    if (!rec)
        return null;
    const targetTypeNormalized = normalizeTargetType(rec.targetType);
    const targetType = targetTypeNormalized ?? (getText(rec.targetType) || 'unknown');
    const targetId = getText(rec.targetId) || undefined;
    const context = getText(rec.context) || undefined;
    const problemDescription = getText(rec.problemDescription) || undefined;
    const administrativeNeed = getText(rec.administrativeNeed) || undefined;
    const publicBenefit = getText(rec.publicBenefit) || undefined;
    const expectedOutcome = getText(rec.expectedOutcome) || undefined;
    return {
        targetType,
        targetId,
        context: context || undefined,
        problemDescription: problemDescription || undefined,
        administrativeNeed: administrativeNeed || undefined,
        publicBenefit: publicBenefit || undefined,
        expectedOutcome: expectedOutcome || undefined,
    };
}
/**
 * Extrai e normaliza a necessidade administrativa do payload.
 *
 * Aceita:
 * - administrativeNeed (objeto único)
 * - administrativeNeeds (array)
 *
 * Nunca lança erro; validações estruturais ficam no validator.
 */
function extractAdministrativeNeed(payload) {
    const raw = payload ?? {};
    const listRaw = asArray(raw['administrativeNeeds']);
    const singleRaw = asRecord(raw['administrativeNeed']);
    // Política: quando ambos existem, preserva ambos (evita perda silenciosa em cenários multi-itens/lote).
    const candidates = [
        ...(listRaw ?? []),
        ...(singleRaw ? [singleRaw] : []),
    ];
    const listLength = listRaw?.length ?? 0;
    const entries = [];
    for (let i = 0; i < candidates.length; i++) {
        const e = normalizeEntry(candidates[i]);
        if (!e)
            continue;
        const fromArray = i < listLength;
        const origin = fromArray
            ? { kind: 'NATIVE', sourceField: 'administrativeNeeds', sourceIndex: i }
            : { kind: 'NATIVE', sourceField: 'administrativeNeed' };
        entries.push({ ...e, origin });
    }
    // Fallback mínimo e auditável:
    // quando o payload não traz administrativeNeed(s), mas traz administrativeJustification(s) com campos equivalentes,
    // deriva entradas de NEED a partir dessas justificativas (sem inventar conteúdo).
    let fallbackApplied = false;
    if (entries.length === 0) {
        const extractedJustification = (0, administrative_justification_extractor_1.extractAdministrativeJustification)(raw);
        if (extractedJustification.entries.length > 0)
            fallbackApplied = true;
        for (let jIndex = 0; jIndex < extractedJustification.entries.length; jIndex++) {
            const j = extractedJustification.entries[jIndex];
            if (j.targetType !== 'process' && j.targetType !== 'item' && j.targetType !== 'lot')
                continue;
            const derivedFrom = Array.isArray(raw['administrativeJustifications'])
                ? 'administrativeJustifications'
                : 'administrativeJustification';
            entries.push({
                targetType: j.targetType,
                targetId: j.targetId,
                context: j.context,
                problemDescription: j.problemStatement,
                administrativeNeed: j.administrativeNeed,
                expectedOutcome: j.expectedOutcome,
                publicBenefit: undefined,
                origin: {
                    kind: 'DERIVED_FALLBACK',
                    derivedFrom,
                    derivedFromIndex: derivedFrom === 'administrativeJustifications' ? jIndex : undefined,
                    mappedFields: {
                        problemDescriptionFrom: 'problemStatement',
                        administrativeNeedFrom: 'administrativeNeed',
                        expectedOutcomeFrom: 'expectedOutcome',
                    },
                },
            });
        }
    }
    const processNeedCount = entries.filter((e) => e.targetType === 'process').length;
    const itemNeedCount = entries.filter((e) => e.targetType === 'item').length;
    const lotNeedCount = entries.filter((e) => e.targetType === 'lot').length;
    const needWithoutProblemCount = entries.filter((e) => getText(e.problemDescription).length < MIN_MATERIAL_LENGTH).length;
    const needWithoutOutcomeCount = entries.filter((e) => getText(e.expectedOutcome).length < MIN_MATERIAL_LENGTH).length;
    return {
        entries,
        count: entries.length,
        processNeedCount,
        itemNeedCount,
        lotNeedCount,
        needWithoutProblemCount,
        needWithoutOutcomeCount,
        fallbackApplied,
        nativeCount: entries.filter((e) => e.origin?.kind === 'NATIVE').length,
        derivedFallbackCount: entries.filter((e) => e.origin?.kind === 'DERIVED_FALLBACK').length,
    };
}
