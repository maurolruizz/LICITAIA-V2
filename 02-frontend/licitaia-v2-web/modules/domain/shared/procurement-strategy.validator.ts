/**
 * Validações do Motor de Estratégia de Contratação.
 * Fase 27 — Decisão sobre como a contratação será conduzida.
 */

import type { ValidationItemContract } from '../../core/contracts/validation.contract';
import { ValidationSeverity } from '../../core/enums/validation-severity.enum';
import { createValidationItem } from '../../core/factories/validation-result.factory';
import type { ExtractedProcurementStructure } from './object-structure.extractor';
import type { ProcurementStrategyEntry } from './procurement-strategy.types';
import { NEED_FIELD_NAMES } from './administrative-semantic-boundary';

const MIN_JUSTIFICATION_LENGTH = 20;

function rawStrategyEntryContainsNeedFields(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  return NEED_FIELD_NAMES.some((key) => Object.prototype.hasOwnProperty.call(obj, key));
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

/** Modalidades que dispensam competição (contratação direta). */
const DIRECT_MODALITIES = new Set(['DISPENSA', 'INEXIGIBILIDADE']);

/** Estratégias de competição que exigem licitação. */
const COMPETITION_STRATEGIES = new Set(['OPEN_COMPETITION', 'RESTRICTED_COMPETITION']);

function isModalityIncompatibleWithCompetition(
  modality: string,
  competitionStrategy: string
): boolean {
  if (!modality || !competitionStrategy) return false;
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
export function applyProcurementStrategyValidations(
  extractedStructure: ExtractedProcurementStructure,
  entries: ProcurementStrategyEntry[],
  items: ValidationItemContract[],
  rawStrategyEntries?: unknown[]
): void {
  if (rawStrategyEntries && Array.isArray(rawStrategyEntries)) {
    for (let i = 0; i < rawStrategyEntries.length; i++) {
      if (rawStrategyEntryContainsNeedFields(rawStrategyEntries[i])) {
        items.push(
          createValidationItem(
            'PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS',
            `Estratégia de contratação #${i + 1} contém campos de necessidade administrativa (use administrativeNeeds).`,
            ValidationSeverity.BLOCK,
            { field: 'procurementStrategies' }
          )
        );
      }
    }
  }

  const validItemIds = collectValidItemIds(extractedStructure);
  const validLotIds = collectValidLotIds(extractedStructure);

  const hasProcessLevelStrategy = entries.some((e) => e.targetType === 'process');

  const strategyItemIds = new Set<string>();
  const strategyLotIds = new Set<string>();
  for (const e of entries) {
    if (e.targetType === 'item' && e.targetId) strategyItemIds.add(getText(e.targetId));
    if (e.targetType === 'lot' && e.targetId) strategyLotIds.add(getText(e.targetId));
  }

  // PROCUREMENT_STRATEGY_TARGET_NOT_FOUND
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (e.targetType !== 'item' && e.targetType !== 'lot') continue;
    const targetId = getText(e.targetId);
    if (!targetId) continue;
    const exists =
      e.targetType === 'item' ? validItemIds.has(targetId) : validLotIds.has(targetId);
    if (!exists && (validItemIds.size > 0 || validLotIds.size > 0)) {
      items.push(
        createValidationItem(
          'PROCUREMENT_STRATEGY_TARGET_NOT_FOUND',
          `Estratégia de contratação #${i + 1} referencia ${e.targetType} inexistente: ${targetId}.`,
          ValidationSeverity.BLOCK,
          { field: 'procurementStrategies' }
        )
      );
    }
  }

  // PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY
  if (extractedStructure.structureType === 'multiple_items' && extractedStructure.structure.items) {
    for (const item of extractedStructure.structure.items) {
      // Estratégia em nível de processo cobre itens quando não houver estratégia específica por item.
      if (!hasProcessLevelStrategy && !strategyItemIds.has(item.id)) {
        items.push(
          createValidationItem(
            'PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY',
            `Item "${item.id}" não possui estratégia de contratação associada.`,
            ValidationSeverity.BLOCK,
            { field: 'procurementStrategies' }
          )
        );
      }
    }
  }
  if (extractedStructure.structureType === 'lot' && extractedStructure.structure.lots) {
    for (const lot of extractedStructure.structure.lots) {
      // Estratégia em nível de processo cobre lotes quando não houver estratégia específica por lote.
      if (!hasProcessLevelStrategy && !strategyLotIds.has(lot.id)) {
        items.push(
          createValidationItem(
            'PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY',
            `Lote "${lot.id}" não possui estratégia de contratação associada.`,
            ValidationSeverity.BLOCK,
            { field: 'procurementStrategies' }
          )
        );
      }
    }
  }

  // PROCUREMENT_STRATEGY_WITHOUT_MODALITY
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (!getText(e.procurementModality).length) {
      items.push(
        createValidationItem(
          'PROCUREMENT_STRATEGY_WITHOUT_MODALITY',
          `Estratégia de contratação #${i + 1} não possui modalidade definida.`,
          ValidationSeverity.BLOCK,
          { field: 'procurementStrategies' }
        )
      );
    }
  }

  // PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (getText(e.contractingJustification).length < MIN_JUSTIFICATION_LENGTH) {
      items.push(
        createValidationItem(
          'PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION',
          `Estratégia de contratação #${i + 1} não possui justificativa administrativa mínima (mínimo ${MIN_JUSTIFICATION_LENGTH} caracteres).`,
          ValidationSeverity.BLOCK,
          { field: 'procurementStrategies' }
        )
      );
    }
  }

  // PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const modality = getText(e.procurementModality);
    const competition = getText(e.competitionStrategy);
    if (isModalityIncompatibleWithCompetition(modality, competition)) {
      items.push(
        createValidationItem(
          'PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH',
          `Estratégia #${i + 1}: modalidade ${modality} é incompatível com competição ${competition}.`,
          ValidationSeverity.BLOCK,
          { field: 'procurementStrategies' }
        )
      );
    }
  }
}
