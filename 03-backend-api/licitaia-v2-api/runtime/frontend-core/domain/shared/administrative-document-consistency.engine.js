"use strict";
/**
 * Motor de Consistência Documental Administrativa.
 * Fase 28 — Verifica coerência cruzada entre Need, Structure, Calculation, Justification e Strategy.
 * Regra removida por duplicidade: NEED_STRUCTURE_MISMATCH (coberto por ADMINISTRATIVE_NEED_TARGET_NOT_FOUND na Fase 26).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAdministrativeDocumentConsistencyEngine = executeAdministrativeDocumentConsistencyEngine;
const administrative_document_consistency_types_1 = require("./administrative-document-consistency.types");
function getText(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
}
/** Need menciona demanda/consumo (compatível com CONSUMPTION). Usa NEED_CONSUMPTION_KEYWORDS. */
function needSuggestsConsumption(needText) {
    return administrative_document_consistency_types_1.NEED_CONSUMPTION_KEYWORDS.some((t) => needText.includes(t));
}
/** Need menciona dimensionamento institucional (compatível com INSTITUTIONAL_SIZING). Usa NEED_SIZING_KEYWORDS. */
function needSuggestsSizing(needText) {
    return administrative_document_consistency_types_1.NEED_SIZING_KEYWORDS.some((t) => needText.includes(t));
}
/** Texto sugere necessidade recorrente ou previsível. Usa NEED_RECURRING_KEYWORDS. */
function textSuggestsRecurring(text) {
    return administrative_document_consistency_types_1.NEED_RECURRING_KEYWORDS.some((t) => text.includes(t));
}
/** Justificativa menciona base legal para dispensa/inexigibilidade. Usa LEGAL_BASIS_REQUIRED_KEYWORDS. */
function justificationMentionsDirectProcurement(text) {
    return administrative_document_consistency_types_1.LEGAL_BASIS_REQUIRED_KEYWORDS.some((t) => text.includes(t));
}
/** Strategy é modalidade que exige base legal. Usa LEGAL_BASIS_REQUIRED_MODALITIES. */
function isDirectModality(modality) {
    const m = modality.toUpperCase().trim();
    return administrative_document_consistency_types_1.LEGAL_BASIS_REQUIRED_MODALITIES.includes(m);
}
/**
 * Executa o Motor de Consistência Documental.
 * Recebe os extraídos de structure, calculationMemory, need, justification e strategy;
 * retorna resultado com issues e contagens.
 */
function executeAdministrativeDocumentConsistencyEngine(structure, calculationMemory, administrativeNeed, administrativeJustification, procurementStrategy) {
    const issues = [];
    // NEED_STRUCTURE_MISMATCH removido: validação duplicada de Fase 26 (ADMINISTRATIVE_NEED_TARGET_NOT_FOUND).
    // A Fase 28 trata apenas inconsistências cruzadas entre motores.
    // --- CALCULATION_NEED_MISMATCH
    // detectionCriteria: mesmo targetId (item/lote); needText contém NEED_CONSUMPTION_KEYWORDS sem NEED_SIZING_KEYWORDS
    //   e calculationType === INSTITUTIONAL_SIZING, OU needText contém NEED_SIZING_KEYWORDS sem NEED_CONSUMPTION_KEYWORDS
    //   e calculationType === CONSUMPTION. Severidade: BLOCK (DOCUMENT_CONSISTENCY_SEVERITY_MATRIX).
    // ---
    for (let cIdx = 0; cIdx < calculationMemory.entries.length; cIdx++) {
        const calc = calculationMemory.entries[cIdx];
        const needForTarget = administrativeNeed.entries.find((n) => (n.targetType === 'item' && n.targetId === calc.targetId) || (n.targetType === 'lot' && n.targetId === calc.targetId));
        if (!needForTarget)
            continue;
        const needText = [
            needForTarget.problemDescription,
            needForTarget.administrativeNeed,
            needForTarget.publicBenefit,
            needForTarget.expectedOutcome,
        ]
            .filter(Boolean)
            .map(getText)
            .join(' ');
        const needConsumption = needSuggestsConsumption(needText);
        const needSizing = needSuggestsSizing(needText);
        if (calc.calculationType === 'INSTITUTIONAL_SIZING' && needConsumption && !needSizing) {
            issues.push({
                issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.CALCULATION_NEED_MISMATCH,
                severity: 'BLOCK',
                message: `Memória de cálculo #${cIdx + 1} (INSTITUTIONAL_SIZING) não corresponde à necessidade declarada (demanda/consumo) para alvo ${calc.targetId}.`,
                relatedNeed: administrativeNeed.entries.indexOf(needForTarget) + 1,
                relatedCalculation: cIdx + 1,
            });
        }
        if (calc.calculationType === 'CONSUMPTION' && needSizing && !needConsumption) {
            issues.push({
                issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.CALCULATION_NEED_MISMATCH,
                severity: 'BLOCK',
                message: `Memória de cálculo #${cIdx + 1} (CONSUMPTION) não corresponde à necessidade declarada (dimensionamento) para alvo ${calc.targetId}.`,
                relatedNeed: administrativeNeed.entries.indexOf(needForTarget) + 1,
                relatedCalculation: cIdx + 1,
            });
        }
    }
    // --- STRATEGY_STRUCTURE_MISMATCH
    // detectionCriteria: structure.structureType === 'single_item' e (divisionStrategy normalizado === 'lots'|'lotes'|'multiple_items'|contém 'multiple');
    //   OU structure.structureType !== 'lot' e divisionStrategy indica lotes. Severidade: BLOCK.
    // ---
    const divisionStrategy = procurementStrategy.entries.map((e) => getText(e.divisionStrategy ?? '')).find((s) => s.length > 0);
    const strategyLots = divisionStrategy === 'lots' || divisionStrategy === 'lotes';
    const strategyMultiple = divisionStrategy === 'multiple_items' || divisionStrategy?.includes('multiple');
    if (structure.structureType === 'single_item' && (strategyLots || strategyMultiple)) {
        issues.push({
            issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.STRATEGY_STRUCTURE_MISMATCH,
            severity: 'BLOCK',
            message: 'Estrutura do objeto é single_item, mas a estratégia de parcelamento indica LOTS ou multiple_items.',
            relatedStructure: 'single_item',
            relatedStrategy: divisionStrategy ?? 'divisionStrategy',
        });
    }
    else if (structure.structureType !== 'lot' && strategyLots) {
        issues.push({
            issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.STRATEGY_STRUCTURE_MISMATCH,
            severity: 'BLOCK',
            message: 'Estratégia indica parcelamento em lotes, mas a estrutura do objeto não é em lotes.',
            relatedStructure: structure.structureType,
            relatedStrategy: divisionStrategy ?? 'LOTS',
        });
    }
    // --- STRATEGY_NEED_MISMATCH
    // detectionCriteria: procurementModality em LEGAL_BASIS_REQUIRED_MODALITIES (DISPENSA/INEXIGIBILIDADE) e texto agregado
    //   das need.entries contém algum NEED_RECURRING_KEYWORDS. Severidade: WARNING.
    // ---
    const modality = procurementStrategy.entries.map((e) => getText(e.procurementModality ?? '')).find((s) => s.length > 0);
    if (isDirectModality(modality ?? '')) {
        const allNeedText = administrativeNeed.entries
            .map((e) => [e.problemDescription, e.administrativeNeed, e.expectedOutcome].filter(Boolean).map(getText).join(' '))
            .join(' ');
        if (textSuggestsRecurring(allNeedText)) {
            issues.push({
                issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.STRATEGY_NEED_MISMATCH,
                severity: 'WARNING',
                message: 'Modalidade de dispensa/inexigibilidade pode ser incompatível com necessidade recorrente ou previsível declarada.',
                relatedNeed: 1,
                relatedStrategy: modality,
            });
        }
    }
    // --- JUSTIFICATION_NEED_MISMATCH
    // detectionCriteria: targetType (item|lote) e targetId iguais entre justificativa e necessidade; needText e justText
    //   com comprimento >= 20; needWords (palavras > 3 chars) sem nenhuma presente em justText; needWords.length >= 3.
    // Objetivo: ausência de termos compartilhados entre justificationText e need.problemDescription/administrativeNeed.
    // Severidade: WARNING.
    // ---
    for (let jIdx = 0; jIdx < administrativeJustification.entries.length; jIdx++) {
        const j = administrativeJustification.entries[jIdx];
        if (j.targetType !== 'item' && j.targetType !== 'lot' || !j.targetId)
            continue;
        const needForTarget = administrativeNeed.entries.find((n) => (n.targetType === 'item' && n.targetId === j.targetId) || (n.targetType === 'lot' && n.targetId === j.targetId));
        if (!needForTarget)
            continue;
        const needText = [needForTarget.problemDescription, needForTarget.administrativeNeed].filter(Boolean).map(getText).join(' ');
        const justText = [j.problemStatement, j.administrativeNeed, j.expectedOutcome].filter(Boolean).map(getText).join(' ');
        if (needText.length >= 20 && justText.length >= 20) {
            const needWords = needText.split(/\s+/).filter((w) => w.length > 3);
            const overlap = needWords.some((w) => justText.includes(w));
            if (!overlap && needWords.length >= 3) {
                issues.push({
                    issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.JUSTIFICATION_NEED_MISMATCH,
                    severity: 'WARNING',
                    message: `Justificativa #${jIdx + 1} para ${j.targetType} ${j.targetId} não parece responder à necessidade declarada para o mesmo alvo.`,
                    relatedNeed: administrativeNeed.entries.indexOf(needForTarget) + 1,
                    relatedJustification: jIdx + 1,
                });
            }
        }
    }
    // --- JUSTIFICATION_STRATEGY_MISMATCH
    // detectionCriteria: modality em LEGAL_BASIS_REQUIRED_MODALITIES; texto agregado das justificativas (problemStatement,
    //   administrativeNeed, legalBasis) com comprimento >= 10; ausência de qualquer LEGAL_BASIS_REQUIRED_KEYWORDS no texto.
    // Severidade: WARNING.
    // ---
    if (modality && isDirectModality(modality)) {
        const justTexts = administrativeJustification.entries
            .map((e) => [e.problemStatement, e.administrativeNeed, e.legalBasis].filter(Boolean).map(getText).join(' '))
            .join(' ');
        if (justTexts.length >= 10 && !justificationMentionsDirectProcurement(justTexts)) {
            issues.push({
                issueType: administrative_document_consistency_types_1.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES.JUSTIFICATION_STRATEGY_MISMATCH,
                severity: 'WARNING',
                message: 'Estratégia de dispensa/inexigibilidade exige que a justificativa mencione base legal (ex.: art. 75 Lei 14.133/2021).',
                relatedJustification: 1,
                relatedStrategy: modality,
            });
        }
    }
    const blockingIssues = issues.filter((i) => i.severity === 'BLOCK').length;
    const warningIssues = issues.filter((i) => i.severity === 'WARNING').length;
    const issueTypes = [...new Set(issues.map((i) => i.issueType))];
    return {
        issues,
        issueTypes,
        hasIssues: issues.length > 0,
        totalIssues: issues.length,
        blockingIssues,
        warningIssues,
    };
}
