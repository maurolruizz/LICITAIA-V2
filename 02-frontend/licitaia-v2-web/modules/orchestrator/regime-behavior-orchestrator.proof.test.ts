/**
 * Prova objetiva de consumo do regime-behavior-engine pelo orchestrator (sem substituir testes existentes).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ModuleId } from '../core/enums/module-id.enum';
import { ProcessPhase } from '../core/enums/process-phase.enum';
import { runAdministrativeProcess } from './administrative-process-engine';
import type { AdministrativeProcessContext } from './process-context.types';

/** Mesmo núcleo coerente de `administrative-process-engine.test.ts` (pipeline válido conhecido). */
function buildBaseValidPayload(): Record<string, unknown> {
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
    demandDescription: 'Compra de notebooks para equipe de desenvolvimento',
    hiringJustification: 'Necessidade de renovação do parque computacional.',
    administrativeObjective: 'Garantir infraestrutura adequada para o time de desenvolvimento.',
    requestingDepartment: 'Diretoria de Tecnologia da Informação',
    requesterName: 'Gestor de Compras',
    requestDate: new Date().toISOString(),
    needDescription: 'Equipe precisa de máquinas modernas para desenvolvimento.',
    expectedResults: 'Aumento de produtividade e redução de falhas de hardware.',
    solutionSummary: 'Aquisição de notebooks com configuração mínima definida.',
    technicalJustification: 'Especificações técnicas definidas pelo time de arquitetura.',
    analysisDate: new Date().toISOString(),
    responsibleAnalyst: 'Analista de Planejamento de Contratações',
    objectDescription: 'Aquisição de 10 notebooks para desenvolvimento de software.',
    contractingPurpose: 'Apoiar o desenvolvimento contínuo dos produtos digitais.',
    technicalRequirements: 'Notebooks com 16GB RAM, SSD 512GB, processador recente.',
    executionConditions: 'Entrega em até 30 dias, garantia mínima de 3 anos.',
    acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
    referenceDate: new Date().toISOString(),
    responsibleAuthor: 'Responsável pelo Termo de Referência',
    pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
    referenceItemsDescription: 'Notebooks com 16GB RAM, SSD 512GB.',
    estimatedUnitValue: 7500,
    estimatedTotalValue: 7500 * 10,
    pricingJustification: 'Pesquisa de mercado em três fornecedores distintos.',
    requestingDepartmentForPricing: 'Diretoria de Tecnologia da Informação',
    requestingDepartmentPricingAlias: 'Diretoria de TI',
  };
}

describe('Orchestrator — consumo de regimeBehavior', () => {
  it('consome decision.canProceed e metadata.regimeBehavior; fluxo válido preservado', async () => {
    const context: AdministrativeProcessContext = {
      processId: 'PROOF_RB_OK',
      phase: ProcessPhase.PLANNING as ProcessPhase,
      payload: buildBaseValidPayload(),
      timestamp: new Date().toISOString(),
    };
    const result = await runAdministrativeProcess(context);
    assert.equal(result.finalStatus, 'SUCCESS');
    const rb = (result.metadata as { regimeBehavior?: { decision?: { canProceed?: boolean } } })
      .regimeBehavior;
    assert.equal(rb?.decision?.canProceed, true);
    assert.ok(result.executedModules.includes(ModuleId.PRICING));
  });

  it('interrompe fluxo quando regimeBehavior.decision.canProceed é false', async () => {
    const context: AdministrativeProcessContext = {
      processId: 'PROOF_RB_BLOCK',
      phase: ProcessPhase.PLANNING as ProcessPhase,
      payload: {
        legalRegime: 'DISPENSA',
        objectType: 'BEM_PERMANENTE',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          legalBasis: 'Art. 75 Lei 14.133/2021.',
          contractingJustification: 'Dispensa.',
        },
        hiringJustification:
          'Fundamentação com amparo no art. 75 da Lei 14.133/2021 para a contratação direta.',
      },
      timestamp: new Date().toISOString(),
    };
    const result = await runAdministrativeProcess(context);
    assert.equal(result.halted, true);
    assert.equal(result.haltedDetail?.origin, 'REGIME_BEHAVIOR_ENGINE');
    assert.ok(
      result.validations.some((v) => v.code === 'REGIME_PRICING_EXIGIDO_AUSENTE')
    );
    assert.equal(result.executedModules.length, 0);
    const rb = result.metadata as {
      regimeBehavior?: { decision?: { canProceed?: boolean; blockingReasonCodes?: string[] } };
    };
    assert.equal(rb.regimeBehavior?.decision?.canProceed, false);
    assert.ok(rb.regimeBehavior?.decision?.blockingReasonCodes?.includes('REGIME_PRICING_EXIGIDO_AUSENTE'));
  });
});
