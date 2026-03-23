export type LegalRegime = 'LICITACAO' | 'DISPENSA' | 'INEXIGIBILIDADE';

export type ObjectType =
  | 'MATERIAL_CONSUMO'
  | 'BEM_PERMANENTE'
  | 'SERVICO_COMUM'
  | 'SERVICO_CONTINUO'
  | 'SERVICO_TECNICO_ESPECIALIZADO'
  | 'OBRA_ENGENHARIA'
  | 'LOCACAO';

export type ObjectStructure = 'ITEM_UNICO' | 'MULTIPLOS_ITENS' | 'LOTE';

export type ExecutionForm =
  | 'ENTREGA_UNICA'
  | 'ENTREGA_PARCELADA'
  | 'EXECUCAO_CONTINUA'
  | 'EXECUCAO_POR_ETAPAS';

export type CoverageStatus = 'SOLID' | 'PARTIAL' | 'NOT_COVERED';

export interface CoverageDimensions {
  legalRegime: LegalRegime;
  objectType: ObjectType;
  objectStructure: ObjectStructure;
  executionForm: ExecutionForm;
}

export interface CoverageMatrixRow {
  scenarioId: string;
  scenarioName: string;
  dimensions: CoverageDimensions;
  coverageStatus: CoverageStatus;
  note: string;
}

export const COVERAGE_DIMENSIONS = {
  legalRegime: ['LICITACAO', 'DISPENSA', 'INEXIGIBILIDADE'] as const,
  objectType: [
    'MATERIAL_CONSUMO',
    'BEM_PERMANENTE',
    'SERVICO_COMUM',
    'SERVICO_CONTINUO',
    'SERVICO_TECNICO_ESPECIALIZADO',
    'OBRA_ENGENHARIA',
    'LOCACAO',
  ] as const,
  objectStructure: ['ITEM_UNICO', 'MULTIPLOS_ITENS', 'LOTE'] as const,
  executionForm: [
    'ENTREGA_UNICA',
    'ENTREGA_PARCELADA',
    'EXECUCAO_CONTINUA',
    'EXECUCAO_POR_ETAPAS',
  ] as const,
} as const;

export function formatDimensions(d: CoverageDimensions): string {
  return `${d.legalRegime} | ${d.objectType} | ${d.objectStructure} | ${d.executionForm}`;
}

