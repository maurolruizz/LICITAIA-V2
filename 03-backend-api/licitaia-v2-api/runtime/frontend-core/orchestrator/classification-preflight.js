"use strict";
/**
 * ETAPA A — Pré-verificação de coerência classificação ↔ payload (Frente 2).
 * Executada no motor após snapshot inicial; falhas geram HALTED_BY_VALIDATION.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASSIFICATION_PREFLIGHT_CODES = void 0;
exports.runClassificationPreflight = runClassificationPreflight;
const object_structure_extractor_1 = require("../domain/shared/object-structure.extractor");
exports.CLASSIFICATION_PREFLIGHT_CODES = {
    CLASSIFICATION_PAYLOAD_MISMATCH: 'CLASSIFICATION_PAYLOAD_MISMATCH',
    PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION: 'PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION',
    CLASSIFICATION_INTERNAL_CONFLICT: 'CLASSIFICATION_INTERNAL_CONFLICT',
};
const DECLARED_TO_EXTRACTED = {
    ITEM_UNICO: 'single_item',
    MULTIPLOS_ITENS: 'multiple_items',
    LOTE: 'lot',
};
/** Modalidades de competição típicas de licitação (não são contratação direta). */
const LICITATION_MODALITIES = new Set([
    'PREGAO',
    'CONCORRENCIA',
    'CONCURSO',
    'LEILAO',
    'DIALOGO_COMPETITIVO',
    'CREDENCIAMENTO',
]);
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
function collectStrategyModalities(snapshot) {
    const out = [];
    const ps = asRecord(snapshot['procurementStrategy']);
    if (ps) {
        const m = getText(ps['procurementModality']).toUpperCase();
        if (m)
            out.push(m);
    }
    const arr = snapshot['procurementStrategies'];
    if (Array.isArray(arr)) {
        for (const raw of arr) {
            const e = asRecord(raw);
            if (e) {
                const m = getText(e['procurementModality']).toUpperCase();
                if (m)
                    out.push(m);
            }
        }
    }
    return out;
}
/**
 * Verifica coerência entre classificadores declarados e material extraível do snapshot.
 */
function runClassificationPreflight(snapshot) {
    const declaredStructure = getText(snapshot['objectStructure']);
    const expectedExtracted = DECLARED_TO_EXTRACTED[declaredStructure];
    if (!expectedExtracted) {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION,
            message: 'objectStructure declarado não é reconhecido para pré-verificação estrutural.',
        };
    }
    const extracted = (0, object_structure_extractor_1.extractProcurementStructure)(snapshot);
    if (extracted.structureType !== expectedExtracted) {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
            message: `objectStructure declarado (${declaredStructure}) não corresponde à estrutura derivada do payload (${extracted.structureType}).`,
        };
    }
    const legalRegime = getText(snapshot['legalRegime']);
    const modality = getProcessProcurementModality(snapshot);
    if (!modality) {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.PAYLOAD_INSUFFICIENT_FOR_CLASSIFICATION,
            message: 'procurementStrategy.procurementModality ausente: insuficiente para validar coerência com legalRegime.',
        };
    }
    if (legalRegime === 'LICITACAO') {
        if (modality === 'DISPENSA' || modality === 'INEXIGIBILIDADE') {
            return {
                ok: false,
                code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
                message: 'legalRegime LICITACAO incompatível com modalidade de contratação direta declarada na estratégia.',
            };
        }
        if (!LICITATION_MODALITIES.has(modality)) {
            return {
                ok: false,
                code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
                message: 'legalRegime LICITACAO exige modalidade de licitação reconhecida na estratégia.',
            };
        }
    }
    if (legalRegime === 'DISPENSA' && modality !== 'DISPENSA') {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
            message: 'legalRegime DISPENSA exige procurementModality DISPENSA na estratégia de processo.',
        };
    }
    if (legalRegime === 'INEXIGIBILIDADE' && modality !== 'INEXIGIBILIDADE') {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_PAYLOAD_MISMATCH,
            message: 'legalRegime INEXIGIBILIDADE exige procurementModality INEXIGIBILIDADE na estratégia de processo.',
        };
    }
    const modalities = collectStrategyModalities(snapshot);
    const distinct = Array.from(new Set(modalities));
    if (distinct.length > 1) {
        return {
            ok: false,
            code: exports.CLASSIFICATION_PREFLIGHT_CODES.CLASSIFICATION_INTERNAL_CONFLICT,
            message: 'Existem modalidades de contratação distintas entre estratégia de processo e estratégias por item.',
        };
    }
    return { ok: true };
}
