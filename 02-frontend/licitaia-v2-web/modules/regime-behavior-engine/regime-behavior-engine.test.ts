import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  BASIC_MODE_RESTRICTED_CAPABILITY_IDS,
  DOCUMENT_POLICY_LEVEL,
  EXECUTION_SOURCE,
  REGIME_BEHAVIOR_BLOCKING_REASON_CODES,
  REGIME_BEHAVIOR_DECISION_MODE,
} from './regime-behavior-engine.codes';
import { runRegimeBehaviorEngine } from './regime-behavior-engine';

function licitacaoCoherentSnapshot(): Record<string, unknown> {
  return {
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
  };
}

describe('RegimeBehaviorEngine', () => {
  it('dispensaDoesNotAcceptGenericKeywordOnlyAsMinimumLegalBasis', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        executionForm: 'ENTREGA_UNICA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Contratação em regime de dispensa por razões internas da administração.',
        },
        hiringJustification:
          'Contratação em regime de dispensa por razões internas da administração.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(out.decision.canProceed, false);
    assert.ok(
      out.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      )
    );
  });

  it('inexigibilidadeDoesNotAcceptGenericKeywordOnlyAsMinimumLegalBasis', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'INEXIGIBILIDADE',
        objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
        executionForm: 'ENTREGA_UNICA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'INEXIGIBILIDADE',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Contratação em regime de inexigibilidade por razões internas da administração.',
        },
        hiringJustification:
          'Contratação em regime de inexigibilidade por razões internas da administração.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(out.decision.canProceed, false);
    assert.ok(
      out.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      )
    );
  });

  it('dispensaWithObjectiveLegalReferenceDoesNotBlockForMinimumLegalBasis', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Contratação direta com referência ao art. 75.',
        },
        hiringJustification:
          'Contratação direta com fundamento no art. 75 da Lei 14.133/2021 para o caso concreto.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(
      out.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      ),
      false
    );
  });

  it('licitacaoFullDfDfdEtpTrPricingRequiredNoUndueBlock', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: licitacaoCoherentSnapshot(),
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(out.decision.canProceed, true);
    assert.equal(out.audit.decisionMode, REGIME_BEHAVIOR_DECISION_MODE.FULL);
    assert.equal(out.matrix.documentPolicy.DFD, DOCUMENT_POLICY_LEVEL.REQUIRED);
    assert.equal(out.matrix.documentPolicy.ETP, DOCUMENT_POLICY_LEVEL.REQUIRED);
    assert.equal(out.matrix.documentPolicy.TR, DOCUMENT_POLICY_LEVEL.REQUIRED);
    assert.equal(out.matrix.documentPolicy.PRICING, DOCUMENT_POLICY_LEVEL.REQUIRED);
    assert.equal(out.preflightSafety.allowsFullOperationalDecision, true);
  });

  it('dispensaFullEtpConditionalRequiredBlocksFundamentoAndPricingWhenExigible', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Contratação direta.',
        },
        hiringJustification:
          'Necessidade institucional documentada sem citação normativa da Lei de licitações ou artigos aplicáveis.',
        objectStructure: 'ITEM_UNICO',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(out.matrix.documentPolicy.ETP, DOCUMENT_POLICY_LEVEL.CONDITIONAL_REQUIRED);
    assert.equal(out.decision.canProceed, false);
    assert.ok(
      out.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      )
    );

    const pricingOut = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        executionForm: 'ENTREGA_UNICA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Dispensa por art. 75 da Lei 14.133/2021.',
        },
        hiringJustification: 'Fundamento na dispensa por art. 75 da Lei 14.133/2021.',
        technicalJustification: 'Justificativa técnica com amparo na dispensa.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(pricingOut.decision.canProceed, false);
    assert.ok(
      pricingOut.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_EXIGIDO_AUSENTE
      )
    );
    assert.equal(
      pricingOut.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      ),
      false
    );

    const pricingInsufficientOut = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        executionForm: 'ENTREGA_UNICA',
        objectStructure: 'ITEM_UNICO',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification: 'Dispensa por art. 75 da Lei 14.133/2021.',
        },
        hiringJustification: 'Fundamento na dispensa por art. 75 da Lei 14.133/2021.',
        estimatedTotalValue: 1000,
        pricingJustification: '',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(pricingInsufficientOut.decision.canProceed, false);
    assert.ok(
      pricingInsufficientOut.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_PRICING_INSUFICIENTE
      )
    );
    assert.equal(
      pricingInsufficientOut.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      ),
      false
    );
  });

  it('inexigibilidadeFullPricingAdaptedBlocksInviabilityAndOrdinaryCompetition', () => {
    const noInviability = runRegimeBehaviorEngine({
      processSnapshot: {
        legalRegime: 'INEXIGIBILIDADE',
        objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'INEXIGIBILIDADE',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Contratação direta por critério objetivo e notoriedade técnica documentada em relatório interno.',
        },
        hiringJustification:
          'Fundamentação na inexigibilidade com amparo no art. 74 da Lei 14.133/2021 para o processo.',
        technicalJustification:
          'Fundamentação técnica alinhada ao objeto e ao escopo do serviço contratado.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(noInviability.matrix.documentPolicy.PRICING, DOCUMENT_POLICY_LEVEL.REQUIRED_ADAPTED);
    assert.equal(noInviability.decision.canProceed, false);
    assert.ok(
      noInviability.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_INVIABILITY_SUPPORT_AUSENTE
      )
    );
    assert.equal(
      noInviability.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_FUNDAMENTO_MINIMO_AUSENTE
      ),
      false
    );

    const openCompetition = runRegimeBehaviorEngine({
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
          contractingJustification:
            'Inexigibilidade por singularidade e inviabilidade de competição.',
        },
        hiringJustification: 'Inexigibilidade com art. 74 Lei 14.133/2021.',
        technicalJustification: 'Serviço singular com inviabilidade demonstrada.',
      },
      execution: { source: EXECUTION_SOURCE.STANDARD_EXECUTION },
    });
    assert.equal(openCompetition.decision.canProceed, false);
    assert.ok(
      openCompetition.decision.blockingReasonCodes.includes(
        REGIME_BEHAVIOR_BLOCKING_REASON_CODES.REGIME_ORDINARY_COMPETITION_INCOMPATIBLE
      )
    );
  });

  it('preflightBasicModeRestrictedCapabilities', () => {
    const out = runRegimeBehaviorEngine({
      processSnapshot: licitacaoCoherentSnapshot(),
      execution: { source: EXECUTION_SOURCE.PREFLIGHT },
    });
    assert.equal(out.audit.decisionMode, REGIME_BEHAVIOR_DECISION_MODE.BASIC);
    assert.equal(out.preflightSafety.allowsOnlyBasicDecision, true);
    assert.equal(out.preflightSafety.allowsFullOperationalDecision, false);
    assert.deepEqual(
      [...out.preflightSafety.restrictedCapabilities].sort(),
      [...BASIC_MODE_RESTRICTED_CAPABILITY_IDS].sort()
    );
  });
});
