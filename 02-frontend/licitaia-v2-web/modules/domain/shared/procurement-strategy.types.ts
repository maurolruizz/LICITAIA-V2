/**
 * Tipos do Motor de Estratégia de Contratação.
 * Fase 27 — Decisão administrativa sobre como a contratação será conduzida.
 *
 * BLINDAGEM SEMÂNTICA (Need × Justification × Strategy):
 * Este domínio modela exclusivamente a forma de condução da contratação: modalidade,
 * parcelamento, centralização, competição e base legal estratégica.
 * NÃO substitui problema público nem necessidade administrativa (responsabilidade de
 * AdministrativeNeed). NÃO substitui a justificativa do objeto (responsabilidade de
 * AdministrativeJustification). Campos de necessidade (problemDescription, publicBenefit,
 * expectedOutcome) não pertencem a este domínio.
 */

export type ProcurementStrategyTargetType = 'process' | 'item' | 'lot';

/** Abordagem de contratação (como será conduzida). */
export type ContractingApproach =
  | 'DIRECT_CONTRACT'
  | 'PUBLIC_TENDER'
  | 'FRAMEWORK_AGREEMENT'
  | string;

/** Modalidade de contratação (Lei 14.133). */
export type ProcurementModality =
  | 'PREGAO'
  | 'CONCORRENCIA'
  | 'DISPENSA'
  | 'INEXIGIBILIDADE'
  | string;

/** Estratégia de parcelamento. */
export type DivisionStrategy =
  | 'SINGLE_CONTRACT'
  | 'MULTIPLE_ITEMS'
  | 'LOTS'
  | string;

/** Estratégia de centralização. */
export type CentralizationStrategy =
  | 'CENTRALIZED'
  | 'DECENTRALIZED'
  | string;

/** Estratégia de competição. */
export type CompetitionStrategy =
  | 'OPEN_COMPETITION'
  | 'RESTRICTED_COMPETITION'
  | 'DIRECT_SELECTION'
  | string;

/**
 * Entrada de estratégia de contratação.
 * targetType pode ser string quando o valor bruto não for process/item/lot,
 * para que o validator emita bloqueio (sem perda silenciosa).
 * Campos permitidos semanticamente: contractingApproach, contractingJustification,
 * procurementModality, divisionStrategy, centralizationStrategy, competitionStrategy,
 * legalBasis, targetType, targetId. Campos de necessidade (problemDescription,
 * publicBenefit, expectedOutcome, administrativeNeed) não pertencem a este domínio.
 */
export interface ProcurementStrategyEntry {
  contractingApproach?: ContractingApproach;
  contractingJustification?: string;
  procurementModality?: ProcurementModality;
  divisionStrategy?: DivisionStrategy;
  centralizationStrategy?: CentralizationStrategy;
  competitionStrategy?: CompetitionStrategy;
  legalBasis?: string;
  targetType: ProcurementStrategyTargetType | string;
  targetId?: string;
}

export interface ExtractedProcurementStrategy {
  entries: ProcurementStrategyEntry[];
  count: number;
  processStrategyCount: number;
  itemStrategyCount: number;
  lotStrategyCount: number;
  strategyWithoutModalityCount: number;
  strategyWithoutJustificationCount: number;
}
