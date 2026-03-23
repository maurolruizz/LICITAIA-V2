export type ObjectStructureType = 'single_item' | 'multiple_items' | 'lot';

export interface ProcurementItem {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
}

export interface ProcurementLot {
  id: string;
  description: string;
  items: ProcurementItem[];
}

export interface ProcurementStructure {
  structureType: ObjectStructureType;
  items?: ProcurementItem[];
  lots?: ProcurementLot[];
}

