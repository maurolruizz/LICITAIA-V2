import type { RegimeOperationalMatrix } from './regime-behavior-engine.types';
import {
  DOCUMENT_POLICY_LEVEL,
  RECOGNIZED_LEGAL_REGIME,
  REGIME_BEHAVIOR_BLOCKING_REASON_CODES,
} from './regime-behavior-engine.codes';

const MATRIX_LICITACAO: RegimeOperationalMatrix = {
  documentPolicy: {
    DFD: DOCUMENT_POLICY_LEVEL.REQUIRED,
    ETP: DOCUMENT_POLICY_LEVEL.REQUIRED,
    TR: DOCUMENT_POLICY_LEVEL.REQUIRED,
    PRICING: DOCUMENT_POLICY_LEVEL.REQUIRED,
  },
  validationPolicy: {
    scope: 'full',
    mandatoryValidationCodes: [
      'CROSS_MODULE_CONSISTENCY',
      'LEGAL_STRUCTURE',
      'MODULE_STRUCTURAL',
    ] as const,
  },
  preBlockPolicy: {
    structuralPreBlockCodes: [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
    ] as const,
  },
  calculationPolicy: { mode: 'full_traceability' },
  strategyPolicy: { mode: 'competition_mandatory' },
  objectStructurePolicy: { mode: 'derive_from_snapshot' },
  compatibilities: ['LICITACAO_x_LICITATION_MODALITY', 'LICITACAO_x_OPEN_OR_RESTRICTED_COMPETITION'] as const,
  incompatibilities: ['LICITACAO_x_DIRECT_MODALITY', 'LICITACAO_x_DIRECT_SELECTION_ONLY'] as const,
};

const MATRIX_DISPENSA: RegimeOperationalMatrix = {
  documentPolicy: {
    DFD: DOCUMENT_POLICY_LEVEL.REQUIRED,
    ETP: DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED,
    TR: DOCUMENT_POLICY_LEVEL.REQUIRED,
    PRICING: DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED,
  },
  validationPolicy: {
    scope: 'full',
    mandatoryValidationCodes: [
      'LEGAL_BASIS_DIRECT_REGIME',
      'CROSS_MODULE_CONSISTENCY',
      'LEGAL_STRUCTURE',
      'MODULE_STRUCTURAL',
    ] as const,
  },
  preBlockPolicy: {
    structuralPreBlockCodes: [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE,
    ] as const,
  },
  calculationPolicy: { mode: 'full_traceability' },
  strategyPolicy: { mode: 'direct_selection' },
  objectStructurePolicy: { mode: 'derive_from_snapshot' },
  compatibilities: ['DISPENSA_x_PROCUREMENT_MODALITY_DISPENSA', 'DISPENSA_x_DIRECT_SELECTION'] as const,
  incompatibilities: ['DISPENSA_x_LICITATION_MODALITY', 'DISPENSA_x_OPEN_COMPETITION'] as const,
};

const MATRIX_INEXIGIBILIDADE: RegimeOperationalMatrix = {
  documentPolicy: {
    DFD: DOCUMENT_POLICY_LEVEL.REQUIRED,
    ETP: DOCUMENT_POLICY_LEVEL.REQUIRED,
    TR: DOCUMENT_POLICY_LEVEL.REQUIRED,
    PRICING: DOCUMENT_POLICY_LEVEL.REQUIRED_ADAPTED,
  },
  validationPolicy: {
    scope: 'full',
    mandatoryValidationCodes: [
      'LEGAL_BASIS_DIRECT_REGIME',
      'INEXIGIBILITY_INVIABILITY_SIGNAL',
      'CROSS_MODULE_CONSISTENCY',
      'LEGAL_STRUCTURE',
      'MODULE_STRUCTURAL',
    ] as const,
  },
  preBlockPolicy: {
    structuralPreBlockCodes: [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_INVIABILITY_SUPPORT_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE,
    ] as const,
  },
  calculationPolicy: { mode: 'basic_checks' },
  strategyPolicy: { mode: 'inexigibility' },
  objectStructurePolicy: { mode: 'derive_from_snapshot' },
  compatibilities: [
    'INEXIGIBILIDADE_x_PROCUREMENT_MODALITY_INEXIGIBILIDADE',
    'INEXIGIBILIDADE_x_DIRECT_SELECTION',
  ] as const,
  incompatibilities: [
    'INEXIGIBILIDADE_x_LICITATION_MODALITY',
    'INEXIGIBILIDADE_x_OPEN_COMPETITION',
  ] as const,
};

export function getOperationalMatrixForRegime(
  regime: (typeof RECOGNIZED_LEGAL_REGIME)[keyof typeof RECOGNIZED_LEGAL_REGIME]
): RegimeOperationalMatrix {
  switch (regime) {
    case RECOGNIZED_LEGAL_REGIME.LICITACAO:
      return MATRIX_LICITACAO;
    case RECOGNIZED_LEGAL_REGIME.DISPENSA:
      return MATRIX_DISPENSA;
    case RECOGNIZED_LEGAL_REGIME.INEXIGIBILIDADE:
      return MATRIX_INEXIGIBILIDADE;
    default:
      return MATRIX_LICITACAO;
  }
}
