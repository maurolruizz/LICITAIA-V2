"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_MODULE_CONFIG = void 0;
exports.getModuleLegalConfig = getModuleLegalConfig;
exports.getLegalText = getLegalText;
exports.evaluateLegalObjectGenericity = evaluateLegalObjectGenericity;
exports.evaluateLegalJustificationStrength = evaluateLegalJustificationStrength;
exports.evaluateRegimeLegalBasisCompliance = evaluateRegimeLegalBasisCompliance;
exports.evaluateLegalObjectJustificationCoherence = evaluateLegalObjectJustificationCoherence;
const validation_severity_enum_1 = require("../../../core/enums/validation-severity.enum");
const validation_result_factory_1 = require("../../../core/factories/validation-result.factory");
const cross_module_consistency_rules_1 = require("../cross-module/cross-module-consistency-rules");
const administrative_document_consistency_types_1 = require("../../../domain/shared/administrative-document-consistency.types");
const MIN_OBJECT_LENGTH_WARNING = 20;
const MIN_OBJECT_LENGTH_INFO = 10;
const MIN_JUSTIFICATION_LENGTH_WARNING = 40;
const GENERIC_OBJECT_PATTERNS = [
    /materiais?\s+diversos?/i,
    /itens?\s+diversos?/i,
    /servi[cç]os?\s+diversos?/i,
    /compras?\s+diversas?/i,
    /aquisi[cç][aã]o\s+de\s+materiais?/i,
    /\bdiversos?\b/i,
];
exports.LEGAL_MODULE_CONFIG = [
    {
        moduleId: 'DFD',
        objectFields: [{ field: 'demandDescription', label: 'descrição da demanda' }],
        justificationFields: [
            { field: 'hiringJustification', label: 'justificativa da contratação' },
        ],
    },
    {
        moduleId: 'ETP',
        objectFields: [
            { field: 'needDescription', label: 'descrição da necessidade' },
            { field: 'solutionSummary', label: 'resumo da solução' },
        ],
        justificationFields: [
            { field: 'technicalJustification', label: 'justificativa técnica' },
        ],
    },
    {
        moduleId: 'TR',
        objectFields: [{ field: 'objectDescription', label: 'descrição do objeto' }],
        justificationFields: [
            { field: 'contractingPurpose', label: 'finalidade da contratação' },
        ],
    },
    {
        moduleId: 'PRICING',
        objectFields: [
            {
                field: 'referenceItemsDescription',
                label: 'descrição dos itens de referência',
            },
        ],
        justificationFields: [
            {
                field: 'pricingJustification',
                label: 'justificativa da estimativa de preços',
            },
        ],
    },
];
function getModuleLegalConfig(moduleId) {
    return exports.LEGAL_MODULE_CONFIG.find((c) => c.moduleId === moduleId);
}
function getLegalText(value) {
    if (value === undefined || value === null)
        return '';
    if (typeof value !== 'string')
        return String(value ?? '').trim();
    return value.trim();
}
function isGenericObject(text) {
    if (!text)
        return false;
    const trimmed = text.trim();
    if (trimmed.length < MIN_OBJECT_LENGTH_INFO)
        return true;
    const tokens = (0, cross_module_consistency_rules_1.tokenizeForComparison)(trimmed);
    if (tokens.length <= 2)
        return true;
    return GENERIC_OBJECT_PATTERNS.some((pattern) => pattern.test(trimmed));
}
function evaluateLegalObjectGenericity(moduleId, payload) {
    const cfg = getModuleLegalConfig(moduleId);
    if (!cfg)
        return [];
    const items = [];
    for (const fieldCfg of cfg.objectFields) {
        const raw = payload[fieldCfg.field];
        const text = getLegalText(raw);
        if (!text) {
            continue;
        }
        if (text.length < MIN_OBJECT_LENGTH_WARNING || isGenericObject(text)) {
            const severity = text.length < MIN_OBJECT_LENGTH_INFO || isGenericObject(text)
                ? validation_severity_enum_1.ValidationSeverity.WARNING
                : validation_severity_enum_1.ValidationSeverity.INFO;
            items.push((0, validation_result_factory_1.createValidationItem)('LEGAL_OBJECT_GENERIC', `Objeto potencialmente genérico em ${fieldCfg.label}. Detalhar melhor a descrição.`, severity, {
                field: fieldCfg.field,
                details: {
                    moduleId,
                    field: fieldCfg.field,
                    length: text.length,
                },
            }));
        }
    }
    return items;
}
function evaluateLegalJustificationStrength(moduleId, payload) {
    const cfg = getModuleLegalConfig(moduleId);
    if (!cfg)
        return [];
    const items = [];
    for (const fieldCfg of cfg.justificationFields) {
        const raw = payload[fieldCfg.field];
        const text = getLegalText(raw);
        if (!raw || text.length === 0) {
            items.push((0, validation_result_factory_1.createValidationItem)('LEGAL_JUSTIFICATION_MISSING', `Justificativa ausente em ${fieldCfg.label}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, {
                field: fieldCfg.field,
                details: { moduleId, field: fieldCfg.field },
            }));
            continue;
        }
        if (text.length < MIN_JUSTIFICATION_LENGTH_WARNING) {
            items.push((0, validation_result_factory_1.createValidationItem)('LEGAL_JUSTIFICATION_WEAK', `Justificativa muito curta em ${fieldCfg.label}.`, validation_severity_enum_1.ValidationSeverity.WARNING, {
                field: fieldCfg.field,
                details: {
                    moduleId,
                    field: fieldCfg.field,
                    length: text.length,
                },
            }));
        }
    }
    return items;
}
/**
 * ETAPA A — Dispensa/inexigibilidade exigem menção explícita a base legal nos textos de justificativa.
 */
function evaluateRegimeLegalBasisCompliance(moduleId, processSnapshot, mergedData) {
    const regimeRaw = processSnapshot['legalRegime'];
    const regime = typeof regimeRaw === 'string' ? regimeRaw.trim().toUpperCase() : '';
    if (regime !== 'DISPENSA' && regime !== 'INEXIGIBILIDADE') {
        return [];
    }
    const cfg = getModuleLegalConfig(moduleId);
    if (!cfg)
        return [];
    const justificationTexts = [];
    for (const fieldCfg of cfg.justificationFields) {
        const t = getLegalText(mergedData[fieldCfg.field]);
        if (t)
            justificationTexts.push(t);
    }
    const combined = justificationTexts.join(' ').toLowerCase();
    if (!combined.trim()) {
        return [];
    }
    const hasBasis = administrative_document_consistency_types_1.LEGAL_BASIS_REQUIRED_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
    if (hasBasis) {
        return [];
    }
    return [
        (0, validation_result_factory_1.createValidationItem)('LEGAL_BASIS_REQUIRED_FOR_DIRECT_REGIME', `Regime ${regime} exige menção explícita à base legal (dispensa/inexigibilidade/art. 75/Lei 14.133) na justificativa do módulo ${moduleId}.`, validation_severity_enum_1.ValidationSeverity.BLOCK, {
            details: { moduleId, regime },
        }),
    ];
}
function evaluateLegalObjectJustificationCoherence(moduleId, payload) {
    const cfg = getModuleLegalConfig(moduleId);
    if (!cfg)
        return [];
    const objectTexts = [];
    for (const fieldCfg of cfg.objectFields) {
        const t = getLegalText(payload[fieldCfg.field]);
        if (t)
            objectTexts.push(t);
    }
    const justificationTexts = [];
    for (const fieldCfg of cfg.justificationFields) {
        const t = getLegalText(payload[fieldCfg.field]);
        if (t)
            justificationTexts.push(t);
    }
    if (objectTexts.length === 0 || justificationTexts.length === 0) {
        return [];
    }
    const objectCombined = objectTexts.join(' ').trim();
    const justificationCombined = justificationTexts.join(' ').trim();
    if (!objectCombined || !justificationCombined)
        return [];
    const overlap = (0, cross_module_consistency_rules_1.hasMinimumTermOverlap)(objectCombined, justificationCombined);
    if (overlap) {
        return [];
    }
    return [
        (0, validation_result_factory_1.createValidationItem)('LEGAL_OBJECT_JUSTIFICATION_INCONSISTENT', 'Baixa coerência estrutural entre objeto e justificativa. Verificar se a justificativa descreve adequadamente o objeto.', validation_severity_enum_1.ValidationSeverity.WARNING, {
            details: {
                moduleId,
                objectLength: objectCombined.length,
                justificationLength: justificationCombined.length,
            },
        }),
    ];
}
