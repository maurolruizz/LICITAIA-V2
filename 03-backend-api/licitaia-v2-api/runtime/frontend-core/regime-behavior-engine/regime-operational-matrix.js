"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationalMatrixForRegime = getOperationalMatrixForRegime;
const regime_behavior_engine_codes_1 = require("./regime-behavior-engine.codes");
const MATRIX_LICITACAO = {
    documentPolicy: {
        DFD: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        ETP: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        TR: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        PRICING: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
    },
    validationPolicy: {
        scope: 'full',
        mandatoryValidationCodes: [
            'CROSS_MODULE_CONSISTENCY',
            'LEGAL_STRUCTURE',
            'MODULE_STRUCTURAL',
        ],
    },
    preBlockPolicy: {
        structuralPreBlockCodes: [
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
        ],
    },
    calculationPolicy: { mode: 'full_traceability' },
    strategyPolicy: { mode: 'competition_mandatory' },
    objectStructurePolicy: { mode: 'derive_from_snapshot' },
    compatibilities: ['LICITACAO_x_LICITATION_MODALITY', 'LICITACAO_x_OPEN_OR_RESTRICTED_COMPETITION'],
    incompatibilities: ['LICITACAO_x_DIRECT_MODALITY', 'LICITACAO_x_DIRECT_SELECTION_ONLY'],
};
const MATRIX_DISPENSA = {
    documentPolicy: {
        DFD: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        ETP: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED,
        TR: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        PRICING: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED,
    },
    validationPolicy: {
        scope: 'full',
        mandatoryValidationCodes: [
            'LEGAL_BASIS_DIRECT_REGIME',
            'CROSS_MODULE_CONSISTENCY',
            'LEGAL_STRUCTURE',
            'MODULE_STRUCTURAL',
        ],
    },
    preBlockPolicy: {
        structuralPreBlockCodes: [
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE,
        ],
    },
    calculationPolicy: { mode: 'full_traceability' },
    strategyPolicy: { mode: 'direct_selection' },
    objectStructurePolicy: { mode: 'derive_from_snapshot' },
    compatibilities: ['DISPENSA_x_PROCUREMENT_MODALITY_DISPENSA', 'DISPENSA_x_DIRECT_SELECTION'],
    incompatibilities: ['DISPENSA_x_LICITATION_MODALITY', 'DISPENSA_x_OPEN_COMPETITION'],
};
const MATRIX_INEXIGIBILIDADE = {
    documentPolicy: {
        DFD: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        ETP: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        TR: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED,
        PRICING: regime_behavior_engine_codes_1.DOCUMENT_POLICY_LEVEL.REQUIRED_ADAPTED,
    },
    validationPolicy: {
        scope: 'full',
        mandatoryValidationCodes: [
            'LEGAL_BASIS_DIRECT_REGIME',
            'INEXIGIBILITY_INVIABILITY_SIGNAL',
            'CROSS_MODULE_CONSISTENCY',
            'LEGAL_STRUCTURE',
            'MODULE_STRUCTURAL',
        ],
    },
    preBlockPolicy: {
        structuralPreBlockCodes: [
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_INVIABILITY_SUPPORT_AUSENTE,
            regime_behavior_engine_codes_1.REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE,
        ],
    },
    calculationPolicy: { mode: 'basic_checks' },
    strategyPolicy: { mode: 'inexigibility' },
    objectStructurePolicy: { mode: 'derive_from_snapshot' },
    compatibilities: [
        'INEXIGIBILIDADE_x_PROCUREMENT_MODALITY_INEXIGIBILIDADE',
        'INEXIGIBILIDADE_x_DIRECT_SELECTION',
    ],
    incompatibilities: [
        'INEXIGIBILIDADE_x_LICITATION_MODALITY',
        'INEXIGIBILIDADE_x_OPEN_COMPETITION',
    ],
};
function getOperationalMatrixForRegime(regime) {
    switch (regime) {
        case regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.LICITACAO:
            return MATRIX_LICITACAO;
        case regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.DISPENSA:
            return MATRIX_DISPENSA;
        case regime_behavior_engine_codes_1.RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE:
            return MATRIX_INEXIGIBILIDADE;
        default:
            return MATRIX_LICITACAO;
    }
}
