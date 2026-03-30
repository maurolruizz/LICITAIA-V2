/**
 * Tipos do Motor de Consistência Documental Administrativa.
 * Fase 28 — Validação da coerência cruzada entre Need, Structure, Calculation, Justification e Strategy.
 * Não repete validações estruturais locais (ex.: necessidade referenciando item inexistente é Fase 26).
 */

/** Severidade da inconsistência (crítica → BLOCK; menor → WARNING). */
export type DocumentConsistencySeverity = 'BLOCK' | 'WARNING';

/** Tipos oficiais de inconsistência documental (apenas regras cruzadas; NEED_STRUCTURE_MISMATCH removido por duplicidade com Fase 26). */
export const ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES = {
  CALCULATION_NEED_MISMATCH: 'CALCULATION_NEED_MISMATCH',
  STRATEGY_STRUCTURE_MISMATCH: 'STRATEGY_STRUCTURE_MISMATCH',
  STRATEGY_NEED_MISMATCH: 'STRATEGY_NEED_MISMATCH',
  JUSTIFICATION_NEED_MISMATCH: 'JUSTIFICATION_NEED_MISMATCH',
  JUSTIFICATION_STRATEGY_MISMATCH: 'JUSTIFICATION_STRATEGY_MISMATCH',
} as const;

export type AdministrativeDocumentConsistencyIssueType =
  keyof typeof ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES;

/**
 * Matriz formal de severidade: issueCode, severity e rationale para cada regra da Fase 28.
 * Todas as regras possuem justificativa técnica clara.
 */
export interface DocumentConsistencySeverityMatrixEntry {
  issueCode: AdministrativeDocumentConsistencyIssueType;
  severity: DocumentConsistencySeverity;
  rationale: string;
}

export const DOCUMENT_CONSISTENCY_SEVERITY_MATRIX: DocumentConsistencySeverityMatrixEntry[] = [
  {
    issueCode: 'CALCULATION_NEED_MISMATCH',
    severity: 'BLOCK',
    rationale:
      'Cálculo incompatível com a natureza da necessidade (consumo vs dimensionamento) compromete a decisão administrativa e a rastreabilidade do objeto.',
  },
  {
    issueCode: 'STRATEGY_STRUCTURE_MISMATCH',
    severity: 'BLOCK',
    rationale:
      'Estratégia de parcelamento (LOTS/multiple_items) incompatível com a estrutura do objeto (single_item/não-lote) invalida a decisão de como contratar.',
  },
  {
    issueCode: 'STRATEGY_NEED_MISMATCH',
    severity: 'WARNING',
    rationale:
      'Modalidade de dispensa/inexigibilidade com necessidade declarada como recorrente ou previsível pode exigir licitação; alerta para revisão.',
  },
  {
    issueCode: 'JUSTIFICATION_NEED_MISMATCH',
    severity: 'WARNING',
    rationale:
      'Justificativa para o mesmo alvo sem termos compartilhados com a necessidade declarada indica possível desconexão documental.',
  },
  {
    issueCode: 'JUSTIFICATION_STRATEGY_MISMATCH',
    severity: 'WARNING',
    rationale:
      'Estratégia de dispensa/inexigibilidade exige que a justificativa mencione base legal (ex.: art. 75 Lei 14.133/2021); ausência sugere incompletude.',
  },
];

// --- Heurísticas explicitadas (Fase 28): listas utilizadas pelo engine para detecção objetiva ---

/** Termos que indicam necessidade recorrente ou previsível (incompatível com dispensa típica). */
export const NEED_RECURRING_KEYWORDS = [
  'recorrente',
  'previsivel',
  'previsível',
  'anual',
  'continuo',
  'contínuo',
  'permanente',
  'contrato',
] as const;

/** Termos que indicam demanda/consumo (compatível com cálculo tipo CONSUMPTION). */
export const NEED_CONSUMPTION_KEYWORDS = [
  'consumo',
  'demanda',
  'historico',
  'histórico',
  'mensal',
  'anual',
  'reposicao',
  'reposição',
] as const;

/** Termos que indicam dimensionamento institucional (compatível com INSTITUTIONAL_SIZING). */
export const NEED_SIZING_KEYWORDS = [
  'dimensionamento',
  'postos',
  'estrutura',
  'quantidade de',
  'numero de',
  'número de',
  'vagas',
] as const;

/** Modalidades que exigem menção a base legal na justificativa (dispensa/inexigibilidade). */
export const LEGAL_BASIS_REQUIRED_MODALITIES = ['DISPENSA', 'INEXIGIBILIDADE'] as const;

/** Termos que indicam base legal para dispensa/inexigibilidade na justificativa. */
export const LEGAL_BASIS_REQUIRED_KEYWORDS = [
  'art. 74',
  'art 74',
  'art. 75',
  'art 75',
  'lei 14.133',
  'lei nº 14.133',
  'lei n° 14.133',
] as const;

/**
 * Uma inconsistência detectada entre elementos administrativos.
 */
export interface AdministrativeDocumentConsistencyIssue {
  issueType: AdministrativeDocumentConsistencyIssueType;
  severity: DocumentConsistencySeverity;
  message: string;
  relatedNeed?: string | number;
  relatedStructure?: string;
  relatedCalculation?: string | number;
  relatedJustification?: string | number;
  relatedStrategy?: string | number;
}

/**
 * Resultado da execução do Motor de Consistência Documental.
 */
export interface AdministrativeDocumentConsistencyResult {
  issues: AdministrativeDocumentConsistencyIssue[];
  issueTypes: AdministrativeDocumentConsistencyIssueType[];
  hasIssues: boolean;
  totalIssues: number;
  blockingIssues: number;
  warningIssues: number;
}
