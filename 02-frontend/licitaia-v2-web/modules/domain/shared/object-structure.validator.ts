import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type { ExtractedProcurementStructure } from './object-structure.extractor';

function getText(value: unknown): string {
  if (value === undefined || value === null) return '';
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
export function applyObjectStructureValidations(
  extracted: ExtractedProcurementStructure,
  payload: Record<string, unknown>,
  items: ValidationItemContract[]
): void {
  if (extracted.structureType !== 'lot') return;

  const lots = extracted.structure.lots ?? [];

  if (lots.length === 0) {
    items.push(
      createValidationItem(
        'OBJECT_STRUCTURE_LOT_EMPTY',
        'Estrutura de lote informada, mas nenhum lote foi fornecido.',
        ValidationSeverity.BLOCK,
        { field: 'lots' }
      )
    );
    return;
  }

  for (const lot of lots) {
    if (!lot.items || lot.items.length === 0) {
      items.push(
        createValidationItem(
          'OBJECT_STRUCTURE_LOT_WITHOUT_ITEMS',
          `Lote ${lot.id} não possui itens.`,
          ValidationSeverity.BLOCK,
          { field: 'lots' }
        )
      );
    }
  }

  const justification = getText(payload['lotJustification']);
  if (justification.length < 20) {
    items.push(
      createValidationItem(
        'OBJECT_STRUCTURE_LOT_JUSTIFICATION_MISSING',
        'Agrupamento em lote detectado sem justificativa técnica/econômica mínima.',
        ValidationSeverity.WARNING,
        { field: 'lotJustification' }
      )
    );
  }
}

