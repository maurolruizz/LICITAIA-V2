"use strict";
/**
 * Extração objetiva de fatos do snapshot para o regime-behavior-engine.
 * Não substitui validators; apenas lê campos para política normativa.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegalRegimeRaw = getLegalRegimeRaw;
exports.getProcessProcurementModality = getProcessProcurementModality;
exports.getCompetitionStrategy = getCompetitionStrategy;
exports.hasMinimumLegalBasisSupport = hasMinimumLegalBasisSupport;
exports.hasInviabilitySupport = hasInviabilitySupport;
exports.isPricingExigibleForDispensa = isPricingExigibleForDispensa;
exports.hasAnyPricingPresence = hasAnyPricingPresence;
exports.hasMinimumPricingSupport = hasMinimumPricingSupport;
exports.evaluateRegimeModalityCompatibility = evaluateRegimeModalityCompatibility;
exports.isOrdinaryCompetitionIncompatibleWithInexigibility = isOrdinaryCompetitionIncompatibleWithInexigibility;
const legal_basis_structure_util_1 = require("../shared/validators/legal/legal-basis-structure.util");
const LICITATION_MODALITIES = new Set([
    'PREGAO',
    'CONCORRENCIA',
    'CONCURSO',
    'LEILAO',
    'DIALOGO_COMPETITIVO',
    'CREDENCIAMENTO',
]);
/** Sinais objetivos de inviabilidade de competição (texto em campos de estratégia). */
const INVIABILITY_SIGNAL_KEYWORDS = [
    'inviabilidade',
    'inviável',
    'inviavel',
    'singular',
    'exclusiv',
    'inexistência',
    'inexistencia',
    'art. 74',
    'art 74',
];
function asRecord(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return null;
    return v;
}
function getText(v) {
    if (v === undefined || v === null)
        return '';
    return typeof v === 'string' ? v.trim() : String(v).trim();
}
function getLegalRegimeRaw(snapshot) {
    return getText(snapshot['legalRegime']).toUpperCase();
}
function getProcessProcurementModality(snapshot) {
    const ps = asRecord(snapshot['procurementStrategy']);
    if (ps) {
        const m = getText(ps['procurementModality']).toUpperCase();
        if (m)
            return m;
    }
    const arr = snapshot['procurementStrategies'];
    if (Array.isArray(arr) && arr.length > 0) {
        const first = asRecord(arr[0]);
        if (first) {
            const m = getText(first['procurementModality']).toUpperCase();
            if (m)
                return m;
        }
    }
    return '';
}
function getCompetitionStrategy(snapshot) {
    const ps = asRecord(snapshot['procurementStrategy']);
    if (ps) {
        const c = getText(ps['competitionStrategy']).toUpperCase();
        if (c)
            return c;
    }
    return '';
}
function collectJustificationTextsForBasis(snapshot) {
    const parts = [];
    const dfd = asRecord(snapshot['dfd']);
    if (dfd) {
        parts.push(getText(dfd['hiringJustification']));
    }
    parts.push(getText(snapshot['hiringJustification']));
    const etp = asRecord(snapshot['etp']);
    if (etp) {
        parts.push(getText(etp['technicalJustification']));
    }
    parts.push(getText(snapshot['technicalJustification']));
    const ps = asRecord(snapshot['procurementStrategy']);
    if (ps) {
        parts.push(getText(ps['contractingJustification']));
    }
    return parts.join(' ').toLowerCase();
}
/** Comprimento mínimo agregado para aceitar via keywords (evita acerto acidental em frase curta). */
const MIN_AGGREGATE_LENGTH_FOR_LEGAL_BASIS_KEYWORD_PATH = 40;
/**
 * Fundamento mínimo para regimes diretos: citação normativa estruturalmente verificável
 * (artigo, lei, decreto/portaria numerados), alinhada ao validador jurídico central.
 */
function hasMinimumLegalBasisSupport(snapshot) {
    const ps = asRecord(snapshot['procurementStrategy']);
    const psLb = ps ? getText(ps['legalBasis']) : '';
    if (psLb.length >= 8 && (0, legal_basis_structure_util_1.hasVerifiableNormativeStructure)(psLb)) {
        return true;
    }
    const aj = asRecord(snapshot['administrativeJustification']);
    const ajLb = aj ? getText(aj['legalBasis']) : '';
    if (ajLb.length >= 8 && (0, legal_basis_structure_util_1.hasVerifiableNormativeStructure)(ajLb)) {
        return true;
    }
    const combined = collectJustificationTextsForBasis(snapshot);
    const trimmed = combined.trim();
    if (trimmed.length < MIN_AGGREGATE_LENGTH_FOR_LEGAL_BASIS_KEYWORD_PATH) {
        return false;
    }
    return (0, legal_basis_structure_util_1.hasVerifiableNormativeStructure)(trimmed);
}
const MIN_STRATEGY_TEXT_FOR_INVIABILITY_KEYWORD_PATH = 28;
/**
 * Suporte a inexigibilidade: (1) `procurementStrategy.legalBasis` preenchido (fato objetivo) OU
 * (2) sinais textuais em campos de estratégia com comprimento mínimo (keywords como auxiliar, não isoladas).
 */
function hasInviabilitySupport(snapshot) {
    const ps = asRecord(snapshot['procurementStrategy']);
    if (ps && getText(ps['legalBasis']).length >= 8) {
        return true;
    }
    const cj = ps ? getText(ps['contractingJustification']) : '';
    const tj = getText(snapshot['technicalJustification']);
    const combined = `${cj} ${tj}`.toLowerCase().trim();
    if (combined.length < MIN_STRATEGY_TEXT_FOR_INVIABILITY_KEYWORD_PATH) {
        return false;
    }
    return INVIABILITY_SIGNAL_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
}
/** Dispensa: pricing exigível quando há sinal objetivo de valor estimado ou objeto de compra estruturado. */
function isPricingExigibleForDispensa(snapshot) {
    const v = snapshot['estimatedTotalValue'];
    if (typeof v === 'number' && !Number.isNaN(v) && v > 0)
        return true;
    const ot = getText(snapshot['objectType']);
    const ef = getText(snapshot['executionForm']);
    return ot.length > 0 && ef.length > 0;
}
/**
 * Presença de pricing (ainda que insuficiente): qualquer sinal de valor ou justificativa.
 * Usado para diferenciar ausência total vs insuficiência normativa.
 */
function hasAnyPricingPresence(snapshot) {
    const unit = snapshot['estimatedUnitValue'];
    const total = snapshot['estimatedTotalValue'];
    const pj = getText(snapshot['pricingJustification']);
    return (typeof unit === 'number' ||
        typeof total === 'number' ||
        pj.length > 0);
}
function hasMinimumPricingSupport(snapshot) {
    const unit = snapshot['estimatedUnitValue'];
    const total = snapshot['estimatedTotalValue'];
    const hasValue = (typeof unit === 'number' && !Number.isNaN(unit) && unit > 0) ||
        (typeof total === 'number' && !Number.isNaN(total) && total > 0);
    const pj = getText(snapshot['pricingJustification']);
    return hasValue && pj.length > 0;
}
function evaluateRegimeModalityCompatibility(regime, modality) {
    if (!modality)
        return { ok: false };
    if (regime === 'LICITACAO') {
        if (modality === 'DISPENSA' || modality === 'INEXIGIBILIDADE')
            return { ok: false };
        return { ok: LICITATION_MODALITIES.has(modality) };
    }
    if (regime === 'DISPENSA') {
        return { ok: modality === 'DISPENSA' };
    }
    if (regime === 'INEXIGIBILIDADE') {
        return { ok: modality === 'INEXIGIBILIDADE' };
    }
    return { ok: false };
}
function isOrdinaryCompetitionIncompatibleWithInexigibility(snapshot) {
    const regime = getLegalRegimeRaw(snapshot);
    if (regime !== 'INEXIGIBILIDADE')
        return false;
    return getCompetitionStrategy(snapshot) === 'OPEN_COMPETITION';
}
