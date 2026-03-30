/**
 * Provas de contrato: shape real do output do engine e dos 7 cenários obrigatórios de homologação.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  BASIC_MODE_RESTRICTED_CAPABILITY_IDS,
  DOCUMENT_POLICY_LEVEL,
  EXECUTION_SOURCE,
  REGIME_BEHAVIOR_BLOCKING_REASON_CODES,
  REGIME_BEHAVIOR_DECISION_MODE,
  REGIME_BEHAVIOR_DECISION_STATUS,
  REGIME_BEHAVIOR_TRIGGER_CODES,
  REGIME_BEHAVIOR_WARNING_CODES,
} from './regime-behavior-engine.codes';
import { runRegimeBehaviorEngine } from './regime-behavior-engine';

const TRIGGERS_SORTED = [
  REGIME_BEHAVIOR_TRIGGER_CODES.MATRIX_APPLIED,
  REGIME_BEHAVIOR_TRIGGER_CODES.MODE_RESOLVED,
  REGIME_BEHAVIOR_TRIGGER_CODES.POLICY_EVALUATED,
  REGIME_BEHAVIOR_TRIGGER_CODES.REGIME_RESOLVED,
];

describe('RegimeBehaviorEngine — provas de shape (7 cenários)', () => {
  it('1 — LICITAÇÃO FULL coerente: decision, matriz e políticas', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'LICITACAO',
        objectType: 'BEM_PERMANENTE',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'PREGAO',
          competitionStrategy: 'OPEN_COMPETITION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Licitação na modalidade pregão eletrônico.',
        },
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.deepEqual(out.decision, {
      status: REGIME_BEHAVIOR_DECISION_STATUS.OK,
      canProceed: true,
      blockingReasonCodes: [],
      warningCodes: [],
    });
    assert.equal(out.audit.decisionMode, REGIME_BEHAVIOR_DECISION_MODE.FULL);
    assert.deepEqual(out.matrix.documentPolicy, {
      DFD: DOCUMENT_POLICY_LEVEL.REQUIRED,
      ETP: DOCUMENT_POLICY_LEVEL.REQUIRED,
      TR: DOCUMENT_POLICY_LEVEL.REQUIRED,
      PRICING: DOCUMENT_POLICY_LEVEL.REQUIRED,
    });
    assert.equal(out.matrix.validationPolicy.scope, 'full');
    assert.deepEqual(out.matrix.calculationPolicy, { mode: 'full_traceability' });
    assert.deepEqual(out.matrix.strategyPolicy, { mode: 'competition_mandatory' });
    assert.deepEqual(out.matrix.objectStructurePolicy, { mode: 'derive_from_snapshot' });
  });

  it('2 — DISPENSA FULL coerente: ETP conditional_required, pricing e estratégia direta', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          legalBasis: 'Art. 75 da Lei 14.133/2021 — dispensa de licitação.',
          contractingJustification: 'Contratação direta fundamentada.',
        },
        hiringJustification: 'Texto de apoio.',
        estimatedTotalValue: 1000,
        estimatedUnitValue: 100,
        pricingJustification: 'Pesquisa de preços em três fontes.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.equal(out.decision.status, REGIME_BEHAVIOR_DECISION_STATUS.OK);
    assert.equal(out.decision.canProceed, true);
    assert.equal(out.matrix.documentPolicy.ETP, DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED);
    assert.equal(out.matrix.documentPolicy.PRICING, DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED);
    assert.deepEqual(out.matrix.strategyPolicy, { mode: 'direct_selection' });
    assert.equal(out.audit.decisionMode, REGIME_BEHAVIOR_DECISION_MODE.FULL);
  });

  it('3 — DISPENSA FULL bloqueada: fundamento mínimo insuficiente', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Curto.',
        },
        hiringJustification: 'Texto curto sem base.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.equal(out.decision.status, REGIME_BEHAVIOR_DECISION_STATUS.BLOCKED);
    assert.equal(out.decision.canProceed, false);
    assert.deepEqual(out.decision.blockingReasonCodes, [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
    ]);
    assert.deepEqual(out.audit.triggers, TRIGGERS_SORTED);
    assert.equal(out.audit.engineVersion, '1');
    assert.equal(out.audit.recognizedRegime, 'DISPENSA');
    assert.deepEqual(out.matrix.preBlockPolicy.structuralPreBlockCodes, [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_MODALITY_INCOMPATIBLE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE,
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE,
    ]);
  });

  it('4 — DISPENSA FULL bloqueada: pricing exigível ausente', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          legalBasis: 'Art. 75 da Lei 14.133/2021.',
          contractingJustification: 'Fundamentação adequada para dispensa.',
        },
        hiringJustification:
          'Fundamentação administrativa com amparo no art. 75 da Lei 14.133/2021 para a contratação.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.equal(out.decision.status, REGIME_BEHAVIOR_DECISION_STATUS.BLOCKED);
    assert.equal(out.decision.canProceed, false);
    assert.deepEqual(out.decision.blockingReasonCodes, [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE,
    ]);
    assert.ok(
      out.matrix.preBlockPolicy.structuralPreBlockCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE
      )
    );
  });

  it('5 — INEXIGIBILIDADE FULL coerente: pricing adapted, estratégia inexigibilidade', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'INEXIGIBILIDADE',
        objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'EXECUCAO_POR_ETAPAS',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'INEXIGIBILIDADE',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          legalBasis: 'Lei 14.133/2021 — inexigibilidade (serviço técnico especializado).',
          contractingJustification:
            'Contratação por inexigibilidade diante da notória especialização do fornecedor.',
        },
        hiringJustification:
          'Contratação por inexigibilidade com fundamento na Lei 14.133/2021 e art. 74.',
        technicalJustification:
          'Fundamentação técnica da contratação direta por inexigibilidade conforme norma aplicável.',
        estimatedTotalValue: 50000,
        pricingJustification: 'Estimativa de mercado para serviço técnico especializado.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.equal(out.decision.canProceed, true);
    assert.equal(out.matrix.documentPolicy.PRICING, DOCUMENT_POLICY_LEVEL.REQUIRED_ADAPTED);
    assert.deepEqual(out.matrix.strategyPolicy, { mode: 'inexigibility' });
    assert.equal(out.matrix.validationPolicy.scope, 'full');
    assert.ok(
      out.matrix.validationPolicy.mandatoryValidationCodes.includes('LEGAL_BASIS_DIRECT_REGIME')
    );
  });

  it('6 — INEXIGIBILIDADE FULL bloqueada: competição ordinária incompatível', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'INEXIGIBILIDADE',
        objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'INEXIGIBILIDADE',
          competitionStrategy: 'OPEN_COMPETITION',
          divisionStrategy: 'SINGLE_CONTRACT',
          legalBasis: 'Lei 14.133/2021 — inexigibilidade.',
          contractingJustification:
            'Inexigibilidade por singularidade e inviabilidade de competição em ambiente restrito.',
        },
        hiringJustification:
          'Contratação por inexigibilidade com fundamento na Lei 14.133/2021 e art. 74.',
        technicalJustification:
          'Serviço técnico com comprovação de inviabilidade de competição ordinária.',
        estimatedTotalValue: 1000,
        pricingJustification: 'Estimativa.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });

    assert.equal(out.decision.status, REGIME_BEHAVIOR_DECISION_STATUS.BLOCKED);
    assert.deepEqual(out.decision.blockingReasonCodes, [
      REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE,
    ]);
    assert.ok(out.matrix.incompatibilities.includes('INEXIGIBILIDADE_x_OPEN_COMPETITION'));
  });

  it('7 — PREFLIGHT basic: modo, preflightSafety e warning', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'LICITACAO',
        objectType: 'BEM_PERMANENTE',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'PREGAO',
          competitionStrategy: 'OPEN_COMPETITION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Pregão.',
        },
      },
      execution: { source: EXECUTION_SOURCE.PREFLIGHT },
    });

    assert.equal(out.audit.decisionMode, REGIME_BEHAVIOR_DECISION_MODE.BASIC);
    assert.equal(out.decision.status, REGIME_BEHAVIOR_DECISION_STATUS.DEGRADED);
    assert.equal(out.decision.canProceed, true);
    assert.deepEqual(out.decision.warningCodes, [
      REGIME_BEHAVIOR_WARNING_CODES.BASIC_MODE_NORMATIVE_SCOPE_REDUCED,
    ]);
    assert.equal(out.preflightSafety.allowsOnlyBasicDecision, true);
    assert.equal(out.preflightSafety.allowsFullOperationalDecision, false);
    assert.deepEqual(
      [...out.preflightSafety.restrictedCapabilities].sort(),
      [...BASIC_MODE_RESTRICTED_CAPABILITY_IDS].sort()
    );
  });
});
