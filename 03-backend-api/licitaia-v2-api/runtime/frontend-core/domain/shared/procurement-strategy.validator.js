"use strict";
/**
 * Validações do Motor de Estratégia de Contratação.
 * Fase 27 — Decisão sobre como a contratação será conduzida.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProcurementStrategyValidations = applyProcurementStrategyValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const administrative_semantic_boundary_1 = require("./administrative-semantic-boundary");
const MIN_JUSTIFICATION_LENGTH = 20;
function rawStrategyEntryContainsNeedFields(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return false;
    const obj = raw;
    return administrative_semantic_boundary_1.NEED_FIELD_NAMES.some((key) => Object.prototype.hasOwnProperty.call(obj, key));
}
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
/** Modalidades que dispensam competição (contratação direta). */
const DIRECT_MODALITIES = new Set(['DISPENSA', 'INEXIGIBILIDADE']);
/** Estratégias de competição que exigem licitação. */
const COMPETITION_STRATEGIES = new Set(['OPEN_COMPETITION', 'RESTRICTED_COMPETITION']);
function isModalityIncompatibleWithCompetition(modality, competitionStrategy) {
    if (!modality || !competitionStrategy)
        return false;
    const mod = modality.toUpperCase().trim();
    const comp = competitionStrategy.toUpperCase().trim();
    return DIRECT_MODALITIES.has(mod) && COMPETITION_STRATEGIES.has(comp);
}
/**
 * Aplica validações do Motor de Estratégia de Contratação.
 *
 * - PROCUREMENT_STRATEGY_TARGET_NOT_FOUND: estratégia aponta item/lote inexistente
 * - PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY: item ou lote existe sem estratégia
 * - PROCUREMENT_STRATEGY_WITHOUT_MODALITY: estratégia declarada sem modalidade
 * - PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION: estratégia sem justificativa mínima
 * - PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH: ex. DISPENSA + OPEN_COMPETITION
 * - PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS: estratégia contém campos de necessidade (blindagem semântica)
 */
function applyProcurementStrategyValidations(extractedStructure, entries, items, rawStrategyEntries) {
    if (rawStrategyEntries && Array.isArray(rawStrategyEntries)) {
        for (let i = 0; i < rawStrategyEntries.length; i++) {
            if (rawStrategyEntryContainsNeedFields(rawStrategyEntries[i])) {
                items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS', `Estratégia de contratação #${i + 1} contém campos de necessidade administrativa (use administrativeNeeds).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
            }
        }
    }
    const validItemIds = collectValidItemIds(extractedStructure);
    const validLotIds = collectValidLotIds(extractedStructure);
    const hasProcessLevelStrategy = entries.some((e) => e.targetType === 'process');
    const strategyItemIds = new Set();
    const strategyLotIds = new Set();
    for (const e of entries) {
        if (e.targetType === 'item' && e.targetId)
            strategyItemIds.add(getText(e.targetId));
        if (e.targetType === 'lot' && e.targetId)
            strategyLotIds.add(getText(e.targetId));
    }
    // PROCUREMENT_STRATEGY_TARGET_NOT_FOUND
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.targetType !== 'item' && e.targetType !== 'lot')
            continue;
        const targetId = getText(e.targetId);
        if (!targetId)
            continue;
        const exists = e.targetType === 'item' ? validItemIds.has(targetId) : validLotIds.has(targetId);
        if (!exists && (validItemIds.size > 0 || validLotIds.size > 0)) {
            items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_TARGET_NOT_FOUND', `Estratégia de contratação #${i + 1} referencia ${e.targetType} inexistente: ${targetId}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
        }
    }
    // PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY
    if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
        for (const item of extractedStructure.structure.items) {
            // Estratégia em nível de processo cobre itens quando não houver estratégia específica por item.
            if (!hasProcessLevelStrategy && !strategyItemIds.has(item.id)) {
                items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY', `Item "${item.id}" não possui estratégia de contratação associada.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
            }
        }
    }
    if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
        for (const lot of extractedStructure.structure.lots) {
            // Estratégia em nível de processo cobre lotes quando não houver estratégia específica por lote.
            if (!hasProcessLevelStrategy && !strategyLotIds.has(lot.id)) {
                items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY', `Lote "${lot.id}" não possui estratégia de contratação associada.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
            }
        }
    }
    // PROCUREMENT_STRATEGY_WITHOUT_MODALITY
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (!getText(e.procurementModality).length) {
            items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_WITHOUT_MODALITY', `Estratégia de contratação #${i + 1} não possui modalidade definida.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
        }
    }
    // PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (getText(e.contractingJustification).length < MIN_JUSTIFICATION_LENGTH) {
            items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION', `Estratégia de contratação #${i + 1} não possui justificativa administrativa mínima (mínimo ${MIN_JUSTIFICATION_LENGTH} caracteres).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
        }
    }
    // PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const modality = getText(e.procurementModality);
        const competition = getText(e.competitionStrategy);
        if (isModalityIncompatibleWithCompetition(modality, competition)) {
            items.push((0, validation_result_factory_1.createValidationItem)('PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH', `Estratégia #${i + 1}: modalidade ${modality} é incompatível com competição ${competition}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'procurementStrategies' }));
        }
    }
}
