"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyObjectStructureValidations = applyObjectStructureValidations;
const validation_severity_enum_1 = require("../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../core/factories/validation-result.factory");
function getText(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
}
/**
 * Aplica regras mínimas estruturais para compras em lote e múltiplos itens,
 * sem alterar contratos centrais.
 *
 * Regras:
 * 1) lote vazio → BLOCK
 * 2) lote sem itens → BLOCK
 * 3) justificativa de agrupamento (lot) ausente → WARNING
 */
function applyObjectStructureValidations(extracted, payload, items) {
    if (extracted.structureType !== 'lot')
        return;
    const lots = extracted.structure.lots ?? [];
    if (lots.length === 0) {
        items.push((0, validation_result_factory_1.createValidationItem)('OBJECT_STRUCTURE_LOT_EMPTY', 'Estrutura de lote informada, mas nenhum lote foi fornecido.', validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'lots' }));
        return;
    }
    for (const lot of lots) {
        if (!lot.items || lot.items.length === 0) {
            items.push((0, validation_result_factory_1.createValidationItem)('OBJECT_STRUCTURE_LOT_WITHOUT_ITEMS', `Lote ${lot.id} não possui itens.`, validation_severity_enum_1.ValidationSeverity.BLOCK, { field: 'lots' }));
        }
    }
    const justification = getText(payload['lotJustification']);
    if (justification.length < 20) {
        items.push((0, validation_result_factory_1.createValidationItem)('OBJECT_STRUCTURE_LOT_JUSTIFICATION_MISSING', 'Agrupamento em lote detectado sem justificativa técnica/econômica mínima.', validation_severity_enum_1.ValidationSeverity.WARNING, { field: 'lotJustification' }));
    }
}
