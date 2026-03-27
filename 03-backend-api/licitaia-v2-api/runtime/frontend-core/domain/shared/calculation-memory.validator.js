"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCalculationMemoryValidations = applyCalculationMemoryValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
function getText(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
}
function isFinitePositiveNumber(value) {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) && num > 0;
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
const CONSUMPTION_HINT_PARAMS = new Set([
    'historicalConsumption',
    'monthlyAverage',
    'frequency',
    'coveragePeriod',
    'technicalMargin',
]);
const SIZING_HINT_PARAMS = new Set([
    'operationalUnits',
    'workstations',
    'institutionalCapacity',
    'plannedExpansion',
    'technicalReserve',
]);
function hasAnyHintParam(entry, type) {
    const names = new Set(entry.parameters.map((p) => p.name));
    const hints = type === 'CONSUMPTION' ? CONSUMPTION_HINT_PARAMS : SIZING_HINT_PARAMS;
    for (const h of hints)
        if (names.has(h))
            return true;
    return false;
}
/**
 * Aplica travas estruturais mínimas para memória de cálculo, sem alterar contratos centrais.
 *
 * Política:
 * - se não houver entries → no-op (retrocompatível)
 * - se houver entries inválidas → BLOCK (a memória virou parte auditável do núcleo)
 */
function applyCalculationMemoryValidations(extractedStructure, entries, items) {
    if (!entries || entries.length === 0)
        return;
    const validItemIds = collectValidItemIds(extractedStructure);
    const validLotIds = collectValidLotIds(extractedStructure);
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const idx = i + 1;
        if (e.calculationType !== 'CONSUMPTION' && e.calculationType !== 'INSTITUTIONAL_SIZING') {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_TYPE_INVALID', `Memória de cálculo #${idx} possui calculationType inválido.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (e.targetType !== 'ITEM' && e.targetType !== 'LOT') {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_TARGET_TYPE_INVALID', `Memória de cálculo #${idx} possui targetType inválido.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (getText(e.targetId).length === 0) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_TARGET_ID_MISSING', `Memória de cálculo #${idx} não possui targetId.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        else if (e.targetType === 'ITEM' && validItemIds.size > 0 && !validItemIds.has(e.targetId)) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_TARGET_ITEM_NOT_FOUND', `Memória de cálculo #${idx} referencia item inexistente: ${e.targetId}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        else if (e.targetType === 'LOT' && validLotIds.size > 0 && !validLotIds.has(e.targetId)) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_TARGET_LOT_NOT_FOUND', `Memória de cálculo #${idx} referencia lote inexistente: ${e.targetId}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (!Array.isArray(e.parameters) || e.parameters.length === 0) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_PARAMETERS_MISSING', `Memória de cálculo #${idx} não possui parâmetros.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        else if (!e.parameters.every((p) => getText(p.name).length > 0 && getText(p.value).length > 0)) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_PARAMETERS_INVALID', `Memória de cálculo #${idx} possui parâmetros inválidos (name/value).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (getText(e.formula).length < 3) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_FORMULA_MISSING', `Memória de cálculo #${idx} não possui fórmula auditável.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (!isFinitePositiveNumber(e.result)) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_RESULT_INVALID', `Memória de cálculo #${idx} não possui resultado numérico válido (> 0).`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (getText(e.justification).length < 20) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_JUSTIFICATION_MISSING', `Memória de cálculo #${idx} não possui justificativa administrativa mínima.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'calculationMemories' }));
        }
        if (!hasAnyHintParam(e, e.calculationType)) {
            items.push((0, validation_result_factory_1.createValidationItem)('CALCULATION_MEMORY_PARAMETERS_INCOHERENT', `Memória de cálculo #${idx} não apresenta parâmetros típicos coerentes com ${e.calculationType}.`, validation_severity_enum_1.ValidationSeverity.WARNING, { field: 'calculationMemories' }));
        }
    }
}
