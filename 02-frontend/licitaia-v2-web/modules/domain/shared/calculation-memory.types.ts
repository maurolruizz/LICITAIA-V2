export type CalculationType = 'CONSUMPTION' | 'INSTITUTIONAL_SIZING';

export type CalculationTargetType = 'ITEM' | 'LOT';

export interface CalculationMemoryParameter {
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
}

export interface CalculationMemoryEntry {
  calculationType: CalculationType;
  targetType: CalculationTargetType;
  targetId: string;
  parameters: CalculationMemoryParameter[];
  formula: string;
  result: number;
  justification: string;
}

export interface ExtractedCalculationMemory {
  entries: CalculationMemoryEntry[];
  count: number;
  calculationTypes: CalculationType[];
  calculationTargets: { targetType: CalculationTargetType; targetId: string }[];
  consumptionCount: number;
  institutionalSizingCount: number;
}

