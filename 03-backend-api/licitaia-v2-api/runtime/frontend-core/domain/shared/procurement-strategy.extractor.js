"use strict";
/**
 * Extrator de estratégia de contratação do payload.
 * Fase 27 — Motor de Estratégia de Contratação.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProcurementStrategy = extractProcurementStrategy;
/** Mínimo de caracteres para considerar justificativa presente (auditável). */
const MIN_JUSTIFICATION_LENGTH = 20;
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
    const contractingApproach = getText(rec.contractingApproach) || undefined;
    const contractingJustification = getText(rec.contractingJustification) || undefined;
    const procurementModality = getText(rec.procurementModality) || undefined;
    const divisionStrategy = getText(rec.divisionStrategy) || undefined;
    const centralizationStrategy = getText(rec.centralizationStrategy) || undefined;
    const competitionStrategy = getText(rec.competitionStrategy) || undefined;
    const legalBasis = getText(rec.legalBasis) || undefined;
    const targetId = getText(rec.targetId) || undefined;
    return {
        contractingApproach: contractingApproach || undefined,
        contractingJustification: contractingJustification || undefined,
        procurementModality: procurementModality || undefined,
        divisionStrategy: divisionStrategy || undefined,
        centralizationStrategy: centralizationStrategy || undefined,
        competitionStrategy: competitionStrategy || undefined,
        legalBasis: legalBasis || undefined,
        targetType,
        targetId: targetId || undefined,
    };
}
/**
 * Extrai e normaliza a estratégia de contratação do payload.
 *
 * Aceita:
 * - procurementStrategy (objeto único)
 * - procurementStrategies (array)
 *
 * Nunca lança erro; validações estruturais ficam no validator.
 */
function extractProcurementStrategy(payload) {
    const raw = payload ?? {};
    const listRaw = asArray(raw['procurementStrategies']);
    const singleRaw = asRecord(raw['procurementStrategy']);
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
    const processStrategyCount = entries.filter((e) => e.targetType === 'process').length;
    const itemStrategyCount = entries.filter((e) => e.targetType === 'item').length;
    const lotStrategyCount = entries.filter((e) => e.targetType === 'lot').length;
    const strategyWithoutModalityCount = entries.filter((e) => !getText(e.procurementModality).length).length;
    const strategyWithoutJustificationCount = entries.filter((e) => getText(e.contractingJustification).length < MIN_JUSTIFICATION_LENGTH).length;
    return {
        entries,
        count: entries.length,
        processStrategyCount,
        itemStrategyCount,
        lotStrategyCount,
        strategyWithoutModalityCount,
        strategyWithoutJustificationCount,
    };
}
