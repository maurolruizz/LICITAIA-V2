"use strict";
/**
 * Validações do Motor de Necessidade Administrativa.
 * Fase 26 — Problema público, necessidade administrativa, resultado esperado.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAdministrativeNeedValidations = applyAdministrativeNeedValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
const administrative_semantic_boundary_1 = require("./administrative-semantic-boundary");
const MIN_MATERIAL_LENGTH = 20;
function rawNeedEntryContainsStrategyFields(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return false;
    const obj = raw;
    return administrative_semantic_boundary_1.STRATEGY_FIELD_NAMES.some((key) => Object.prototype.hasOwnProperty.call(obj, key));
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
/**
 * Aplica validações do Motor de Necessidade Administrativa.
 *
 * - NEED_TARGET_NOT_FOUND: necessidade aponta item/lote inexistente
 * - OBJECT_WITHOUT_NEED: item ou lote existe sem necessidade administrativa
 * - NEED_WITHOUT_PROBLEM: necessidade declarada sem descrição do problema público
 * - NEED_WITHOUT_EXPECTED_OUTCOME: necessidade declarada sem resultado esperado
 * - ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS: necessidade contém campos de estratégia (blindagem semântica)
 */
function applyAdministrativeNeedValidations(extractedStructure, entries, items, rawNeedEntries) {
    if (rawNeedEntries && Array.isArray(rawNeedEntries)) {
        for (let i = 0; i < rawNeedEntries.length; i++) {
            if (rawNeedEntryContainsStrategyFields(rawNeedEntries[i])) {
                items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS', `Necessidade administrativa #${i + 1} contém campos de estratégia de contratação (use procurementStrategies).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
            }
        }
    }
    const validItemIds = collectValidItemIds(extractedStructure);
    const validLotIds = collectValidLotIds(extractedStructure);
    const needItemIds = new Set();
    const needLotIds = new Set();
    for (const e of entries) {
        if (e.targetType === 'item' && e.targetId)
            needItemIds.add(getText(e.targetId));
        if (e.targetType === 'lot' && e.targetId)
            needLotIds.add(getText(e.targetId));
    }
    // NEED_TARGET_NOT_FOUND
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.targetType !== 'item' && e.targetType !== 'lot')
            continue;
        const targetId = getText(e.targetId);
        if (!targetId)
            continue;
        const exists = e.targetType === 'item' ? validItemIds.has(targetId) : validLotIds.has(targetId);
        if (!exists && (validItemIds.size > 0 || validLotIds.size > 0)) {
            items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_TARGET_NOT_FOUND', `Necessidade administrativa #${i + 1} referencia ${e.targetType} inexistente: ${targetId}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
        }
    }
    // OBJECT_WITHOUT_NEED
    if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
        for (const item of extractedStructure.structure.items) {
            if (!needItemIds.has(item.id)) {
                items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_OBJECT_WITHOUT_NEED', `Item "${item.id}" não possui necessidade administrativa associada.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
            }
        }
    }
    if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
        for (const lot of extractedStructure.structure.lots) {
            if (!needLotIds.has(lot.id)) {
                items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_OBJECT_WITHOUT_NEED', `Lote "${lot.id}" não possui necessidade administrativa associada.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
            }
        }
    }
    // NEED_WITHOUT_PROBLEM
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (getText(e.problemDescription).length < MIN_MATERIAL_LENGTH) {
            items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_WITHOUT_PROBLEM', `Necessidade administrativa #${i + 1} não possui descrição do problema público (mínimo ${MIN_MATERIAL_LENGTH} caracteres).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
        }
    }
    // NEED_WITHOUT_EXPECTED_OUTCOME
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (getText(e.expectedOutcome).length < MIN_MATERIAL_LENGTH) {
            items.push((0, validation_result_factory_1.createValidationItem)('ADMINISTRATIVE_NEED_WITHOUT_EXPECTED_OUTCOME', `Necessidade administrativa #${i + 1} não possui resultado esperado (mínimo ${MIN_MATERIAL_LENGTH} caracteres).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'administrativeNeeds' }));
        }
    }
}
