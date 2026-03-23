import type {
  ObjectStructureType,
  ProcurementItem,
  ProcurementLot,
  ProcurementStructure,
} from './object-structure.types';

const DEFAULT_ITEM_ID_PREFIX = 'item';
const DEFAULT_LOT_ID_PREFIX = 'lot';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function normalizeStructureType(value: unknown): ObjectStructureType | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'single_item') return 'single_item';
  if (v === 'multiple_items') return 'multiple_items';
  if (v === 'lot') return 'lot';
  return null;
}

function normalizeItem(raw: unknown, index: number): ProcurementItem | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const idRaw = rec.id;
  const id = typeof idRaw === 'string' && idRaw.trim() !== '' ? idRaw.trim() : `${DEFAULT_ITEM_ID_PREFIX}-${index + 1}`;

  const descRaw = rec.description;
  const description = typeof descRaw === 'string' ? descRaw.trim() : String(descRaw ?? '').trim();

  const quantityRaw = rec.quantity;
  const quantity =
    typeof quantityRaw === 'number'
      ? quantityRaw
      : typeof quantityRaw === 'string' && quantityRaw.trim() !== ''
      ? Number(quantityRaw)
      : undefined;
  const safeQuantity = quantity !== undefined && Number.isFinite(quantity) ? quantity : undefined;

  const unitRaw = rec.unit;
  const unit = typeof unitRaw === 'string' && unitRaw.trim() !== '' ? unitRaw.trim() : undefined;

  return {
    id,
    description,
    quantity: safeQuantity,
    unit,
  };
}

function normalizeLot(raw: unknown, index: number): ProcurementLot | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const idRaw = rec.id;
  const id = typeof idRaw === 'string' && idRaw.trim() !== '' ? idRaw.trim() : `${DEFAULT_LOT_ID_PREFIX}-${index + 1}`;

  const descRaw = rec.description;
  const description = typeof descRaw === 'string' ? descRaw.trim() : String(descRaw ?? '').trim();

  const itemsRaw = asArray(rec.items) ?? [];
  const items: ProcurementItem[] = [];
  for (let i = 0; i < itemsRaw.length; i++) {
    const item = normalizeItem(itemsRaw[i], i);
    if (item) items.push(item);
  }

  return { id, description, items };
}

export interface ExtractedProcurementStructure {
  structure: ProcurementStructure;
  structureType: ObjectStructureType;
  lotCount: number;
  itemCount: number;
}

/**
 * Extrai e normaliza a estrutura de compras a partir do payload genérico.
 *
 * Regras de detecção:
 * - se payload.structureType existir → usar
 * - senão, se payload.lots existir → lot
 * - senão, se payload.items existir → multiple_items
 * - senão → single_item
 *
 * Observação: este extractor é retrocompatível. Não exige alterações em contratos centrais.
 */
export function extractProcurementStructure(
  payload: Record<string, unknown> | null | undefined
): ExtractedProcurementStructure {
  const raw = payload ?? {};

  const explicitType = normalizeStructureType(raw['structureType']);
  const lotsRaw = asArray(raw['lots']);
  const itemsRaw = asArray(raw['items']);

  let structureType: ObjectStructureType =
    explicitType ??
    (lotsRaw ? 'lot' : itemsRaw ? 'multiple_items' : 'single_item');

  const items: ProcurementItem[] = [];
  if (itemsRaw) {
    for (let i = 0; i < itemsRaw.length; i++) {
      const item = normalizeItem(itemsRaw[i], i);
      if (item) items.push(item);
    }
  }

  const lots: ProcurementLot[] = [];
  if (lotsRaw) {
    for (let i = 0; i < lotsRaw.length; i++) {
      const lot = normalizeLot(lotsRaw[i], i);
      if (lot) lots.push(lot);
    }
  }

  if (structureType === 'lot' && !lotsRaw && itemsRaw) {
    // Compat: se structureType foi explicitamente 'lot' mas só houver items, mantemos 'lot'
    // e deixamos lots como vazio; a validação cuidará da coerência.
  }

  const itemCount =
    structureType === 'lot'
      ? lots.reduce((acc, l) => acc + (l.items?.length ?? 0), 0)
      : items.length;
  const lotCount = structureType === 'lot' ? lots.length : 0;

  const structure: ProcurementStructure =
    structureType === 'lot'
      ? { structureType, lots }
      : structureType === 'multiple_items'
      ? { structureType, items }
      : { structureType };

  return { structure, structureType, lotCount, itemCount };
}

