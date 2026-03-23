/**
 * Tipos do Motor de Necessidade Administrativa.
 * Fase 26 — Estruturação de problema público, necessidade administrativa e resultado esperado.
 *
 * BLINDAGEM SEMÂNTICA (Need × Justification × Strategy):
 * Este domínio modela exclusivamente o problema público e a necessidade administrativa:
 * - problemDescription, administrativeNeed, publicBenefit, expectedOutcome.
 * NÃO modela: modalidade de contratação, estratégia competitiva, parcelamento,
 * centralização nem justificativa do objeto (esta é responsabilidade de AdministrativeJustification).
 * NÃO substitui a justificativa do processo/item/lote.
 */

export type AdministrativeNeedTargetType = 'process' | 'item' | 'lot';

export type AdministrativeNeedEntryOrigin =
  | {
      kind: 'NATIVE';
      /**
       * Campo do payload de onde veio a entry:
       * - administrativeNeed (objeto único)
       * - administrativeNeeds (array)
       *
       * Nunca inferir outro domínio (ex.: justification/strategy).
       */
      sourceField: 'administrativeNeed' | 'administrativeNeeds';
      /** Índice do array quando sourceField=administrativeNeeds. */
      sourceIndex?: number;
    }
  | {
      kind: 'DERIVED_FALLBACK';
      /**
       * Origem inequívoca: fallback derivado de AdministrativeJustification.
       * Isso NÃO substitui a necessidade; apenas evita perda operacional quando o payload não envia administrativeNeed(s).
       */
      derivedFrom: 'administrativeJustification' | 'administrativeJustifications';
      /** Índice do array quando derivedFrom=administrativeJustifications. */
      derivedFromIndex?: number;
      /** Quais campos foram mapeados (sem inventar dados). */
      mappedFields: {
        problemDescriptionFrom?: 'problemStatement';
        administrativeNeedFrom?: 'administrativeNeed';
        expectedOutcomeFrom?: 'expectedOutcome';
      };
    };

/**
 * Entrada de necessidade administrativa.
 * targetType pode ser string quando o valor bruto não for process/item/lot,
 * para que o validator emita bloqueio (sem perda silenciosa).
 * Campos permitidos semanticamente: targetType, targetId, context, problemDescription,
 * administrativeNeed, publicBenefit, expectedOutcome. Campos de estratégia (ex.: procurementModality,
 * competitionStrategy, divisionStrategy) não pertencem a este domínio.
 */
export interface AdministrativeNeedEntry {
  targetType: AdministrativeNeedTargetType | string;
  targetId?: string;
  context?: string;
  problemDescription?: string;
  administrativeNeed?: string;
  publicBenefit?: string;
  expectedOutcome?: string;
  /**
   * Metadado de origem para auditoria.
   * - NATIVE: veio de administrativeNeed(s)
   * - DERIVED_FALLBACK: derivada explicitamente de administrativeJustification(s)
   */
  origin?: AdministrativeNeedEntryOrigin;
}

export interface ExtractedAdministrativeNeed {
  entries: AdministrativeNeedEntry[];
  count: number;
  processNeedCount: number;
  itemNeedCount: number;
  lotNeedCount: number;
  needWithoutProblemCount: number;
  needWithoutOutcomeCount: number;
  /** Verdadeiro quando o extrator aplicou fallback derivado de justificativa. */
  fallbackApplied: boolean;
  nativeCount: number;
  derivedFallbackCount: number;
}
