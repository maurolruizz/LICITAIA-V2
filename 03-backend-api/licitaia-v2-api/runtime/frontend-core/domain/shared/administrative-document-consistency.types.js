"use strict";
/**
 * Tipos do Motor de Consistência Documental Administrativa.
 * Fase 28 — Validação da coerência cruzada entre Need, Structure, Calculation, Justification e Strategy.
 * Não repete validações estruturais locais (ex.: necessidade referenciando item inexistente é Fase 26).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_BASIS_REQUIRED_KEYWORDS = exports.LEGAL_BASIS_REQUIRED_MODALITIES = exports.NEED_SIZING_KEYWORDS = exports.NEED_CONSUMPTION_KEYWORDS = exports.NEED_RECURRING_KEYWORDS = exports.DOCUMENT_CONSISTENCY_SEVERITY_MATRIX = exports.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES = void 0;
/** Tipos oficiais de inconsistência documental (apenas regras cruzadas; NEED_STRUCTURE_MISMATCH removido por duplicidade com Fase 26). */
exports.ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES = {
    CALCULATION_NEED_MISMATCH: 'CALCULATION_NEED_MISMATCH',
    STRATEGY_STRUCTURE_MISMATCH: 'STRATEGY_STRUCTURE_MISMATCH',
    STRATEGY_NEED_MISMATCH: 'STRATEGY_NEED_MISMATCH',
    JUSTIFICATION_NEED_MISMATCH: 'JUSTIFICATION_NEED_MISMATCH',
    JUSTIFICATION_STRATEGY_MISMATCH: 'JUSTIFICATION_STRATEGY_MISMATCH',
};
exports.DOCUMENT_CONSISTENCY_SEVERITY_MATRIX = [
    {
        issueCode: 'CALCULATION_NEED_MISMATCH',
        severity: 'BLOCK',
        rationale: 'Cálculo incompatível com a natureza da necessidade (consumo vs dimensionamento) compromete a decisão administrativa e a rastreabilidade do objeto.',
    },
    {
        issueCode: 'STRATEGY_STRUCTURE_MISMATCH',
        severity: 'BLOCK',
        rationale: 'Estratégia de parcelamento (LOTS/multiple_items) incompatível com a estrutura do objeto (single_item/não-lote) invalida a decisão de como contratar.',
    },
    {
        issueCode: 'STRATEGY_NEED_MISMATCH',
        severity: 'WARNING',
        rationale: 'Modalidade de dispensa/inexigibilidade com necessidade declarada como recorrente ou previsível pode exigir licitação; alerta para revisão.',
    },
    {
        issueCode: 'JUSTIFICATION_NEED_MISMATCH',
        severity: 'WARNING',
        rationale: 'Justificativa para o mesmo alvo sem termos compartilhados com a necessidade declarada indica possível desconexão documental.',
    },
    {
        issueCode: 'JUSTIFICATION_STRATEGY_MISMATCH',
        severity: 'WARNING',
        rationale: 'Estratégia de dispensa/inexigibilidade exige que a justificativa mencione base legal (ex.: art. 75 Lei 14.133/2021); ausência sugere incompletude.',
    },
];
// --- Heurísticas explicitadas (Fase 28): listas utilizadas pelo engine para detecção objetiva ---
/** Termos que indicam necessidade recorrente ou previsível (incompatível com dispensa típica). */
exports.NEED_RECURRING_KEYWORDS = [
    'recorrente',
    'previsivel',
    'previsível',
    'anual',
    'continuo',
    'contínuo',
    'permanente',
    'contrato',
];
/** Termos que indicam demanda/consumo (compatível com cálculo tipo CONSUMPTION). */
exports.NEED_CONSUMPTION_KEYWORDS = [
    'consumo',
    'demanda',
    'historico',
    'histórico',
    'mensal',
    'anual',
    'reposicao',
    'reposição',
];
/** Termos que indicam dimensionamento institucional (compatível com INSTITUTIONAL_SIZING). */
exports.NEED_SIZING_KEYWORDS = [
    'dimensionamento',
    'postos',
    'estrutura',
    'quantidade de',
    'numero de',
    'número de',
    'vagas',
];
/** Modalidades que exigem menção a base legal na justificativa (dispensa/inexigibilidade). */
exports.LEGAL_BASIS_REQUIRED_MODALITIES = ['DISPENSA', 'INEXIGIBILIDADE'];
/** Termos que indicam base legal para dispensa/inexigibilidade na justificativa. */
exports.LEGAL_BASIS_REQUIRED_KEYWORDS = [
    'art. 74',
    'art 74',
    'art. 75',
    'art 75',
    'lei 14.133',
    'lei nº 14.133',
    'lei n° 14.133',
];
