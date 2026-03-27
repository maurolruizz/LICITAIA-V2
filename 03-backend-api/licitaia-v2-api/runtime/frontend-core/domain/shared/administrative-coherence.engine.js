"use strict";
/**
 * Motor de Coerência Administrativa.
 * Fase 25 — Verificação de consistência entre justificativa, objeto e memória de cálculo.
 * Não altera documentos; apenas valida coerência administrativa.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAdministrativeCoherenceEngine = executeAdministrativeCoherenceEngine;
const administrative_coherence_types_1 = require("./administrative-coherence.types");
const SEVERITY_BLOCK = 'BLOCK';
function getText(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
}
function collectValidItemIds(extracted) {
    const ids = new Set();
    if (extracted.structureType === 'multiple_items') {
        for (const it of extracted.structure.items ?? [])
            ids.add(it.id);
    }
    if (extracted.structureType === 'lot') {
        for (const lot of extracted.structure.lots ?? []) {
            for (const it of lot.items ?? [])
                ids.add(it.id);
        }
    }
    return ids;
}
function collectValidLotIds(extracted) {
    const ids = new Set();
    if (extracted.structureType === 'lot') {
        for (const lot of extracted.structure.lots ?? [])
            ids.add(lot.id);
    }
    return ids;
}
/** Palavras-chave que indicam justificativa baseada em consumo/demanda histórica. */
const CONSUMPTION_KEYWORDS = ['consumo', 'demanda', 'histórico'];
/** Palavras-chave que indicam justificativa baseada em dimensionamento institucional. */
const SIZING_KEYWORDS = ['dimensionamento', 'dimensionar'];
function getJustificationText(entry) {
    const parts = [
        getText(entry.context),
        getText(entry.problemStatement),
        getText(entry.administrativeNeed),
    ].filter(Boolean);
    return parts.join(' ').toLowerCase();
}
function hasKeyword(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k));
}
function addIssue(issues, type, targetType, targetId, message, severity = SEVERITY_BLOCK) {
    issues.push({ type, targetType, targetId, message, severity });
}
/**
 * Executa o Motor de Coerência Administrativa.
 * Verifica consistência entre justificativa, estrutura do objeto e memória de cálculo.
 */
function executeAdministrativeCoherenceEngine(extractedStructure, extractedCalculationMemory, extractedAdministrativeJustification) {
    const issues = [];
    const validItemIds = collectValidItemIds(extractedStructure);
    const validLotIds = collectValidLotIds(extractedStructure);
    let justificationWithoutTargetCount = 0;
    let objectWithoutJustificationCount = 0;
    let calculationWithoutJustificationCount = 0;
    let justificationCalculationMismatchCount = 0;
    // 1 — JUSTIFICATION_TARGET_NOT_FOUND: justificativa aponta item/lote inexistente
    for (const entry of extractedAdministrativeJustification.entries) {
        if (entry.targetType !== 'item' && entry.targetType !== 'lot')
            continue;
        const targetId = getText(entry.targetId);
        if (!targetId)
            continue;
        const exists = entry.targetType === 'item'
            ? validItemIds.has(targetId)
            : validLotIds.has(targetId);
        if (!exists && (validItemIds.size > 0 || validLotIds.size > 0)) {
            addIssue(issues, administrative_coherence_types_1.ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.JUSTIFICATION_TARGET_NOT_FOUND, entry.targetType, targetId, `Justificativa administrativa referencia ${entry.targetType} inexistente: ${targetId}.`);
            justificationWithoutTargetCount++;
        }
    }
    // 2 — OBJECT_WITHOUT_JUSTIFICATION: item ou lote existe sem justificativa associada
    const justificationItemIds = new Set();
    const justificationLotIds = new Set();
    for (const entry of extractedAdministrativeJustification.entries) {
        if (entry.targetType === 'item' && entry.targetId)
            justificationItemIds.add(getText(entry.targetId));
        if (entry.targetType === 'lot' && entry.targetId)
            justificationLotIds.add(getText(entry.targetId));
    }
    if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
        for (const item of extractedStructure.structure.items) {
            if (!justificationItemIds.has(item.id)) {
                addIssue(issues, administrative_coherence_types_1.ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.OBJECT_WITHOUT_JUSTIFICATION, 'item', item.id, `Item "${item.id}" não possui justificativa administrativa associada.`);
                objectWithoutJustificationCount++;
            }
        }
    }
    if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
        for (const lot of extractedStructure.structure.lots) {
            if (!justificationLotIds.has(lot.id)) {
                addIssue(issues, administrative_coherence_types_1.ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.OBJECT_WITHOUT_JUSTIFICATION, 'lot', lot.id, `Lote "${lot.id}" não possui justificativa administrativa associada.`);
                objectWithoutJustificationCount++;
            }
        }
    }
    // 3 — CALCULATION_WITHOUT_JUSTIFICATION: memória de cálculo sem justificativa correspondente
    for (const calc of extractedCalculationMemory.entries) {
        const targetId = getText(calc.targetId);
        if (!targetId)
            continue;
        const hasJustification = calc.targetType === 'ITEM'
            ? justificationItemIds.has(targetId)
            : justificationLotIds.has(targetId);
        if (!hasJustification) {
            addIssue(issues, administrative_coherence_types_1.ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.CALCULATION_WITHOUT_JUSTIFICATION, calc.targetType === 'ITEM' ? 'item' : 'lot', targetId, `Memória de cálculo para ${calc.targetType} "${targetId}" sem justificativa administrativa correspondente.`);
            calculationWithoutJustificationCount++;
        }
    }
    // 4 — JUSTIFICATION_CALCULATION_MISMATCH: justificativa indica consumo histórico mas cálculo é institutional sizing (ou vice-versa)
    const justificationByTarget = new Map();
    for (const entry of extractedAdministrativeJustification.entries) {
        if (entry.targetType !== 'item' && entry.targetType !== 'lot')
            continue;
        const key = `${entry.targetType}:${getText(entry.targetId)}`;
        if (!justificationByTarget.has(key))
            justificationByTarget.set(key, []);
        justificationByTarget.get(key).push(entry);
    }
    for (const calc of extractedCalculationMemory.entries) {
        const targetId = getText(calc.targetId);
        if (!targetId)
            continue;
        const targetTypeKey = calc.targetType === 'ITEM' ? 'item' : 'lot';
        const key = `${targetTypeKey}:${targetId}`;
        const justifications = justificationByTarget.get(key) ?? [];
        for (const j of justifications) {
            const text = getJustificationText(j);
            const suggestsConsumption = hasKeyword(text, CONSUMPTION_KEYWORDS);
            const suggestsSizing = hasKeyword(text, SIZING_KEYWORDS);
            const mismatch = (suggestsConsumption && calc.calculationType === 'INSTITUTIONAL_SIZING') ||
                (suggestsSizing && calc.calculationType === 'CONSUMPTION');
            if (mismatch) {
                addIssue(issues, administrative_coherence_types_1.ADMINISTRATIVE_COHERENCE_ISSUE_TYPES.JUSTIFICATION_CALCULATION_MISMATCH, targetTypeKey, targetId, `Incompatibilidade: justificativa sugere ${suggestsConsumption ? 'consumo/demanda histórica' : 'dimensionamento institucional'}, mas memória de cálculo é ${calc.calculationType}.`);
                justificationCalculationMismatchCount++;
            }
        }
    }
    const totalIssues = issues.length;
    return {
        hasCoherenceIssues: totalIssues > 0,
        totalIssues,
        justificationWithoutTargetCount,
        objectWithoutJustificationCount,
        calculationWithoutJustificationCount,
        justificationCalculationMismatchCount,
        issues,
    };
}
