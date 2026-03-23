/**
 * Validações estruturais da justificativa administrativa.
 * Fase 24 — Consolidação da justificativa administrativa no núcleo.
 */

import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { AdministrativeJustificationEntry } from './administrative-justification.types';
import { STRATEGY_FIELD_NAMES } from './administrative-semantic-boundary';

/** Pelo menos um de problemStatement/administrativeNeed/expectedOutcome deve ter este mínimo de caracteres (conteúdo material auditável). */
const MIN_MATERIAL_LENGTH = 20;

function rawJustificationEntryContainsStrategyFields(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  return STRATEGY_FIELD_NAMES.some((key) => Object.prototype.hasOwnProperty.call(obj, key));
}

function getText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value.trim() : String(value).trim();
}

function collectValidItemIds(extracted: ExtractedProcurementStructure): Set<string> {
  const ids = new Set<string>();
  if (extracted.structureType === 'multiple_items') {
    for (const it of extracted.structure.items ?? []) ids.add(it.id);
  }
  if (extracted.structureType === 'lot') {
    for (const lot of extracted.structure.lots ?? []) {
      for (const it of lot.items ?? []) ids.add(it.id);
    }
  }
  return ids;
}

function collectValidLotIds(extracted: ExtractedProcurementStructure): Set<string> {
  const ids = new Set<string>();
  if (extracted.structureType === 'lot') {
    for (const lot of extracted.structure.lots ?? []) ids.add(lot.id);
  }
  return ids;
}

function hasMaterialContent(entry: AdministrativeJustificationEntry): boolean {
  const p = getText(entry.problemStatement).length >= MIN_MATERIAL_LENGTH;
  const n = getText(entry.administrativeNeed).length >= MIN_MATERIAL_LENGTH;
  const o = getText(entry.expectedOutcome).length >= MIN_MATERIAL_LENGTH;
  return p || n || o;
}

/**
 * Aplica validações estruturais da justificativa administrativa.
 *
 * Política:
 * - se não houver entries → no-op (retrocompatível)
 * - se houver entries inválidas → BLOCK (justificativa é parte auditável do núcleo)
 * - ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS: justificativa contém campos de estratégia (blindagem semântica)
 */
export function applyAdministrativeJustificationValidations(
  extractedStructure: ExtractedProcurementStructure,
  entries: AdministrativeJustificationEntry[],
  items: ValidationItemContract[],
  rawJustificationEntries?: unknown[]
): void {
  if (!entries || entries.length === 0) return;

  if (rawJustificationEntries && Array.isArray(rawJustificationEntries)) {
    for (let i = 0; i < rawJustificationEntries.length; i++) {
      if (rawJustificationEntryContainsStrategyFields(rawJustificationEntries[i])) {
        items.push(
          createValidationItem(
            'ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS',
            `Justificativa administrativa #${i + 1} contém campos de estratégia de contratação (use procurementStrategies).`,
            ValidationSeverity.BLOCK,
            { field: 'administrativeJustifications' }
          )
        );
      }
    }
  }

  const validItemIds = collectValidItemIds(extractedStructure);
  const validLotIds = collectValidLotIds(extractedStructure);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const idx = i + 1;

    if (e.targetType !== 'process' && e.targetType !== 'item' && e.targetType !== 'lot') {
      items.push(
        createValidationItem(
          'ADMINISTRATIVE_JUSTIFICATION_TARGET_TYPE_INVALID',
          `Justificativa administrativa #${idx} possui targetType inválido.`,
          ValidationSeverity.BLOCK,
          { field: 'administrativeJustifications' }
        )
      );
    }

    if ((e.targetType === 'item' || e.targetType === 'lot') && getText(e.targetId).length === 0) {
      items.push(
        createValidationItem(
          'ADMINISTRATIVE_JUSTIFICATION_TARGET_ID_MISSING',
          `Justificativa administrativa #${idx} (${e.targetType}) não possui targetId.`,
          ValidationSeverity.BLOCK,
          { field: 'administrativeJustifications' }
        )
      );
    } else if (e.targetType === 'item' && validItemIds.size > 0 && e.targetId && !validItemIds.has(e.targetId)) {
      items.push(
        createValidationItem(
          'ADMINISTRATIVE_JUSTIFICATION_TARGET_ITEM_NOT_FOUND',
          `Justificativa administrativa #${idx} referencia item inexistente: ${e.targetId}.`,
          ValidationSeverity.BLOCK,
          { field: 'administrativeJustifications' }
        )
      );
    } else if (e.targetType === 'lot' && validLotIds.size > 0 && e.targetId && !validLotIds.has(e.targetId)) {
      items.push(
        createValidationItem(
          'ADMINISTRATIVE_JUSTIFICATION_TARGET_LOT_NOT_FOUND',
          `Justificativa administrativa #${idx} referencia lote inexistente: ${e.targetId}.`,
          ValidationSeverity.BLOCK,
          { field: 'administrativeJustifications' }
        )
      );
    }

    if (!hasMaterialContent(e)) {
      items.push(
        createValidationItem(
          'ADMINISTRATIVE_JUSTIFICATION_MISSING_CRITICAL_FIELDS',
          `Justificativa administrativa #${idx} não possui conteúdo material mínimo (problemStatement, administrativeNeed ou expectedOutcome com pelo menos ${MIN_MATERIAL_LENGTH} caracteres).`,
          ValidationSeverity.BLOCK,
          { field: 'administrativeJustifications' }
        )
      );
    }
  }
}
