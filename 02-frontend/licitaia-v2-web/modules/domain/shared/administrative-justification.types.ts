/**
 * Tipos da justificativa administrativa estruturada.
 * Fase 24 — Consolidação da justificativa administrativa no núcleo.
 *
 * BLINDAGEM SEMÂNTICA (Need × Justification × Strategy):
 * Este domínio modela exclusivamente o vínculo administrativo entre necessidade e objeto:
 * justificativa para existência do processo/item/lote e contexto administrativo da contratação.
 * NÃO substitui a necessidade pública (problema/resultado esperado), que é responsabilidade
 * de AdministrativeNeed. NÃO define modalidade nem estratégia de contratação (responsabilidade
 * de ProcurementStrategy).
 */

export type AdministrativeJustificationTargetType = 'process' | 'item' | 'lot';

/**
 * Entrada de justificativa. targetType pode ser string quando o valor bruto
 * não for process/item/lot, para que o validator emita bloqueio (sem perda silenciosa).
 * Campos permitidos semanticamente: targetType, targetId, context, problemStatement,
 * administrativeNeed, expectedOutcome, legalBasis, sourcePath, extractedFrom.
 * Campos de estratégia (procurementModality, competitionStrategy, etc.) não pertencem a este domínio.
 */
export interface AdministrativeJustificationEntry {
  targetType: AdministrativeJustificationTargetType | string;
  targetId?: string;
  context?: string;
  problemStatement?: string;
  administrativeNeed?: string;
  expectedOutcome?: string;
  legalBasis?: string;
  sourcePath?: string;
  extractedFrom?: string[];
}

export interface ExtractedAdministrativeJustification {
  entries: AdministrativeJustificationEntry[];
  count: number;
  processJustificationCount: number;
  itemJustificationCount: number;
  lotJustificationCount: number;
  withLegalBasisCount: number;
  missingCriticalFieldsCount: number;
}
