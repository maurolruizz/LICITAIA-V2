import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ModuleId } from '../core/enums/module-id.enum';
import { ProcessPhase } from '../core/enums/process-phase.enum';
import { runAdministrativeProcess } from './administrative-process-engine';
import type { AdministrativeProcessContext } from './process-context.types';

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

describe('AdministrativeProcessEngine', () => {
  it('runValidPipelineTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_VALID_PIPELINE',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: buildBaseValidPayload(),
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.status, 'success');
  assert.equal(result.halted, false);
  assert.equal(result.haltedBy, undefined);
  assert.equal(result.haltedDetail, undefined);
  assert.ok(Array.isArray(result.decisionMetadata));
  assert.ok(Array.isArray(result.legalTrace));
  assert.ok(Array.isArray(result.executedModules));
  assert.ok(Array.isArray(result.validations));
  assert.ok(Array.isArray(result.events));
  });

  it('runCrossValidationNoOverlapWarningTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CROSS_VALIDATION_NO_OVERLAP_WARNING',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
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
      // DFD consistente
      demandDescription: 'Compra de notebooks para equipe de desenvolvimento',
      hiringJustification: 'Necessidade de renovação do parque computacional.',
      administrativeObjective: 'Garantir infraestrutura adequada para o time de desenvolvimento.',
      requestingDepartment: 'Diretoria de Tecnologia da Informação',
      requesterName: 'Gestor de Compras',
      requestDate: new Date().toISOString(),
      // ETP propositalmente incoerente em relação à demanda, mas com campos preenchidos
      // para que o bloqueio venha da validação cruzada e não de campos obrigatórios vazios.
      needDescription: 'Aquisição de cadeiras de escritório para ergonomia.',
      expectedResults: 'Melhorar ergonomia sem alterar parque computacional.',
      solutionSummary: 'Aquisição de cadeiras giratórias com apoio lombar.',
      technicalJustification: 'Especificações definidas pelo time de facilities.',
      analysisDate: new Date().toISOString(),
      responsibleAnalyst: 'Analista de Planejamento de Contratações',
      // TR alinhado ao cenário de cadeiras
      objectDescription: 'Aquisição de cadeiras para escritório.',
      contractingPurpose: 'Melhorar ergonomia da equipe.',
      technicalRequirements: 'Cadeiras giratórias com apoio lombar.',
      executionConditions: 'Entrega em até 30 dias, com montagem no local.',
      acceptanceCriteria: 'Conformidade com requisitos ergonômicos e de segurança.',
      referenceDate: new Date().toISOString(),
      responsibleAuthor: 'Responsável pelo Termo de Referência',
      // PRICING alinhado a cadeiras
      pricingSourceDescription: 'Pesquisa em três fornecedores de mobiliário corporativo.',
      referenceItemsDescription: 'Cadeiras giratórias com apoio lombar.',
      estimatedUnitValue: 1500,
      estimatedTotalValue: 1500 * 20,
      pricingJustification: 'Pesquisa de mercado em três fornecedores distintos.',
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.halted, false);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(
    result.validations.some(
      (v) =>
        typeof v.code === 'string' &&
        v.code.includes('CROSS_MODULE') &&
        v.code.includes('NO_OVERLAP') &&
        v.severity === 'WARNING'
    )
  );
  });

  it('runLegalValidationBlockTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_LEGAL_VALIDATION_BLOCK',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
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
        contractingJustification: 'Contratação direta por critério de necessidade imediata.',
      },
      // DFD válido estruturalmente; texto de hiring sem menção explícita à base legal (ETAPA A).
      demandDescription: 'Compra de notebooks para equipe de desenvolvimento',
      hiringJustification:
        'Necessidade institucional de renovação do parque computacional para garantir continuidade operacional da equipe técnica, com planejamento anual aprovado.',
      administrativeObjective: 'Garantir infraestrutura adequada para o time de desenvolvimento.',
      requestingDepartment: 'Diretoria de Tecnologia da Informação',
      requesterName: 'Gestor de Compras',
      requestDate: new Date().toISOString(),
      // ETP
      needDescription: 'Equipe precisa de máquinas modernas para desenvolvimento.',
      expectedResults: 'Aumento de produtividade e redução de falhas de hardware.',
      solutionSummary: 'Aquisição de notebooks com configuração mínima definida.',
      technicalJustification: 'Especificações técnicas definidas pelo time de arquitetura.',
      analysisDate: new Date().toISOString(),
      responsibleAnalyst: 'Analista de Planejamento de Contratações',
      // TR
      objectDescription: 'Aquisição de 10 notebooks para desenvolvimento de software.',
      contractingPurpose: 'Apoiar o desenvolvimento contínuo dos produtos digitais.',
      technicalRequirements: 'Notebooks com 16GB RAM, SSD 512GB, processador recente.',
      executionConditions: 'Entrega em até 30 dias, garantia mínima de 3 anos.',
      acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
      referenceDate: new Date().toISOString(),
      responsibleAuthor: 'Responsável pelo Termo de Referência',
      // PRICING
      pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
      referenceItemsDescription: 'Notebooks com 16GB RAM, SSD 512GB.',
      estimatedUnitValue: 7500,
      estimatedTotalValue: 7500 * 10,
      pricingJustification: 'Pesquisa de mercado em três fornecedores distintos.',
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.halted, true);
  assert.equal(result.finalStatus, 'HALTED_BY_VALIDATION');
  assert.ok(result.haltedDetail);
  assert.equal(result.haltedDetail?.type, 'VALIDATION');
  assert.ok(result.decisionMetadata.some((dm) =>
    (dm as any).payload?.hasBlocking === true &&
    (dm as any).payload?.validationItemCodes?.includes('LEGAL_BASIS_REQUIRED_FOR_DIRECT_REGIME')
  ));
  assert.ok(result.legalTrace.length >= 1);
  });

  it('runDependencyBlockTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_DEPENDENCY_BLOCK',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
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
      // Payload intencionalmente incompleto: suficiente para evitar bloqueio jurídico,
      // mas insuficiente para passar nas validações estruturais do DFD, forçando
      // falha de dependência quando ETP tentar executar.
      demandDescription: 'Demanda de teste para cenário de bloqueio por dependência.',
      hiringJustification:
        'Justificativa detalhada e suficientemente longa para não ser considerada ausente pelo motor jurídico.',
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.halted, true);
  assert.equal(result.finalStatus, 'HALTED_BY_DEPENDENCY');
  assert.ok(result.haltedDetail);
  assert.equal(result.haltedDetail?.type, 'DEPENDENCY');
  assert.equal(result.haltedDetail?.origin, 'DEPENDENCY');

  // Garante que o módulo dependente (ETP) e seguintes não avançaram.
  assert.ok(!result.executedModules.includes(ModuleId.ETP));
  assert.ok(!result.executedModules.includes(ModuleId.TR));
  assert.ok(!result.executedModules.includes(ModuleId.PRICING));

  // Garante presença de metadado de decisão específico de bloqueio por dependência.
  assert.ok(
    result.decisionMetadata.some((dm) => {
      const anyDm = dm as any;
      const payload = anyDm.payload as { dependentModule?: ModuleId } | undefined;
      return dm.ruleId === 'MODULE_DEPENDENCY_BLOCK' && payload?.dependentModule === ModuleId.DFD;
    })
  );
  });

  it('runStatusFinalStatusCoherenceTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_STATUS_FINALSTATUS_COHERENCE',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
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
      // Configuração que deve levar algum módulo a falhar ou bloquear,
      // mas não por dependência explícita, garantindo que status/finalStatus
      // se mantenham coerentes.
      demandDescription: '',
      hiringJustification: '',
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  if (result.status === 'success') {
    assert.equal(result.finalStatus, 'SUCCESS');
    assert.equal(result.halted, false);
  } else {
    assert.equal(result.halted, true);
    assert.notEqual(result.finalStatus, 'SUCCESS');
    assert.ok(result.haltedBy);
    assert.ok(result.haltedDetail);
  }
  });

  it('runObjectStructureSingleItemTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_OBJECT_STRUCTURE_SINGLE_ITEM',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      structureType: 'single_item',
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.halted, false);
  assert.ok(
    result.outputs.every((o) => {
      const md = (o.metadata ?? {}) as any;
      return md.objectStructureType === 'single_item' && typeof md.itemCount === 'number';
    })
  );
  });

  it('runObjectStructureMultipleItemsTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_OBJECT_STRUCTURE_MULTIPLE_ITEMS',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [
        { id: 'i1', description: 'Notebook 16GB RAM', quantity: 10, unit: 'un' },
        { id: 'i2', description: 'Mouse sem fio', quantity: 10, unit: 'un' },
      ],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i1',
          administrativeNeed: 'Atendimento à demanda de notebooks para desenvolvimento com base em consumo histórico e dimensionamento da equipe.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          administrativeNeed: 'Aquisição de periféricos para acompanhar os notebooks e padronizar o parque de equipamentos.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemDescription: 'Falta de equipamentos para desenvolvimento com impacto na produtividade da equipe.',
          expectedOutcome: 'Atendimento à demanda de notebooks com rastreabilidade e conformidade.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemDescription: 'Necessidade de periféricos para padronização do parque de equipamentos.',
          expectedOutcome: 'Parque padronizado e entrega alinhada ao objeto da contratação.',
        },
      ],
      procurementStrategies: [
        {
          targetType: 'item',
          targetId: 'i1',
          procurementModality: 'PREGAO',
          contractingJustification: 'Aquisição de notebooks por pregão eletrônico conforme Lei 14.133/2021.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          procurementModality: 'PREGAO',
          contractingJustification: 'Aquisição de periféricos em conjunto com os notebooks por economia de escala.',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.halted, false);
  assert.ok(
    result.outputs.every((o) => {
      const md = (o.metadata ?? {}) as any;
      return md.objectStructureType === 'multiple_items' && md.itemCount === 2;
    })
  );
  });

  it('runObjectStructureLotValidTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_OBJECT_STRUCTURE_LOT_VALID',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'LOTE',
      structureType: 'lot',
      lotJustification:
        'Agrupamento em lote por padronização técnica e ganho de escala, com compatibilidade entre itens e logística integrada.',
      lots: [
        {
          id: 'l1',
          description: 'Lote de notebooks e periféricos',
          items: [
            { id: 'i1', description: 'Notebook 16GB RAM', quantity: 10, unit: 'un' },
            { id: 'i2', description: 'Mouse sem fio', quantity: 10, unit: 'un' },
          ],
        },
      ],
      administrativeJustifications: [
        {
          targetType: 'lot',
          targetId: 'l1',
          expectedOutcome: 'Entrega dos itens em lote único com ganho de escala e padronização dos processos de recebimento e instalação.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'lot',
          targetId: 'l1',
          problemDescription: 'Necessidade de aquisição em lote para ganho de escala e padronização dos processos.',
          expectedOutcome: 'Entrega dos itens em lote único com ganho de escala e padronização dos processos de recebimento.',
        },
      ],
      procurementStrategies: [
        {
          targetType: 'lot',
          targetId: 'l1',
          procurementModality: 'PREGAO',
          contractingJustification: 'Aquisição em lote por pregão eletrônico para ganho de escala e padronização.',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.halted, false);
  assert.ok(
    result.events.some((e) => e.code === 'OBJECT_STRUCTURE_LOT_DETECTED' && (e.payload as any)?.lotCount === 1)
  );
  assert.ok(
    result.outputs.every((o) => {
      const md = (o.metadata ?? {}) as any;
      return md.objectStructureType === 'lot' && md.lotCount === 1 && md.itemCount === 2;
    })
  );
  });

  it('runObjectStructureLotEmptyTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_OBJECT_STRUCTURE_LOT_EMPTY',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'LOTE',
      structureType: 'lot',
      lots: [],
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.halted, true);
  assert.ok(result.validations.some((v) => v.code === 'OBJECT_STRUCTURE_LOT_EMPTY'));
  });

  it('runObjectStructureLotWithoutItemsTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_OBJECT_STRUCTURE_LOT_WITHOUT_ITEMS',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'LOTE',
      structureType: 'lot',
      lotJustification:
        'Agrupamento em lote por padronização técnica e ganho de escala, com compatibilidade entre itens e logística integrada.',
      lots: [{ id: 'l1', description: 'Lote vazio', items: [] }],
    },
    timestamp: new Date().toISOString(),
  };

  const result = await runAdministrativeProcess(context);

  assert.equal(result.halted, true);
  assert.ok(result.validations.some((v) => v.code === 'OBJECT_STRUCTURE_LOT_WITHOUT_ITEMS'));
  });

  it('runCalculationMemoryAbsentNoBreakTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_ABSENT',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: { ...buildBaseValidPayload() },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.halted, false);
  });

  it('runCalculationMemoryConsumptionItemTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_CONSUMPTION_ITEM',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [
        { id: 'i1', description: 'Papel A4', quantity: 1200, unit: 'resma' },
        { id: 'i2', description: 'Toner', quantity: 24, unit: 'un' },
      ],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i1',
          administrativeNeed: 'Demanda baseada em consumo histórico mensal com cobertura anual para papel A4.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          administrativeNeed: 'Aquisição de toner para reposição conforme consumo histórico dos equipamentos.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemDescription: 'Demanda de papel A4 baseada em consumo histórico mensal com cobertura anual.',
          expectedOutcome: 'Cobertura anual de papel A4 com rastreabilidade da necessidade.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemDescription: 'Reposição de toner conforme consumo histórico dos equipamentos.',
          expectedOutcome: 'Estoque de toner alinhado ao consumo e à operação.',
        },
      ],
      calculationMemories: [
        {
          calculationType: 'CONSUMPTION',
          targetType: 'ITEM',
          targetId: 'i1',
          parameters: [{ name: 'monthlyAverage', value: 100 }, { name: 'coveragePeriod', value: 12 }],
          formula: 'monthlyAverage * coveragePeriod',
          result: 1200,
          justification: 'Consumo histórico mensal médio multiplicado pelo período de cobertura anual.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Aquisição por pregão com base em consumo histórico e cobertura anual.' },
        { targetType: 'item', targetId: 'i2', procurementModality: 'PREGAO', contractingJustification: 'Aquisição de toner por pregão em conjunto com papel para economia.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(result.events.some((e) => e.code === 'CALCULATION_MEMORY_DETECTED'));
  const out = result.outputs[0];
  const md = (out?.metadata ?? {}) as Record<string, unknown>;
  const calcMd = md.calculationMemory as { calculationMemoryCount?: number } | undefined;
  assert.equal(calcMd?.calculationMemoryCount, 1);
  });

  it('runCalculationMemoryInstitutionalItemTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_INSTITUTIONAL_ITEM',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [
        { id: 'i1', description: 'Notebook', quantity: 12, unit: 'un' },
        { id: 'i2', description: 'Monitor', quantity: 12, unit: 'un' },
      ],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemStatement: 'Dimensionamento institucional por postos de trabalho e reserva técnica.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          administrativeNeed: 'Um monitor por posto de trabalho, alinhado ao dimensionamento institucional.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemDescription: 'Dimensionamento institucional por postos de trabalho e reserva técnica.',
          expectedOutcome: 'Cobertura de notebooks alinhada ao dimensionamento institucional.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemDescription: 'Um monitor por posto de trabalho para padronização do parque.',
          expectedOutcome: 'Parque de monitores alinhado ao dimensionamento institucional.',
        },
      ],
      calculationMemories: [
        {
          calculationType: 'INSTITUTIONAL_SIZING',
          targetType: 'ITEM',
          targetId: 'i1',
          parameters: [{ name: 'workstations', value: 10 }, { name: 'technicalReserve', value: 2 }],
          formula: 'workstations + technicalReserve',
          result: 12,
          justification: 'Dimensionamento por postos de trabalho mais reserva técnica institucional.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Notebooks por pregão com base em dimensionamento institucional.' },
        { targetType: 'item', targetId: 'i2', procurementModality: 'PREGAO', contractingJustification: 'Monitores por pregão alinhados ao dimensionamento institucional.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(result.events.some((e) => e.code === 'CALCULATION_MEMORY_DETECTED'));
  });

  it('runCalculationMemoryLinkedToLotTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_LOT',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'LOTE',
      structureType: 'lot',
      lotJustification:
        'Agrupamento em lote por padronização técnica e ganho de escala, com compatibilidade entre itens e logística integrada.',
      lots: [
        {
          id: 'l1',
          description: 'Lote de equipamentos',
          items: [
            { id: 'i1', description: 'Notebook', quantity: 10, unit: 'un' },
            { id: 'i2', description: 'Mouse', quantity: 10, unit: 'un' },
          ],
        },
      ],
      administrativeJustifications: [
        {
          targetType: 'lot',
          targetId: 'l1',
          expectedOutcome: 'Dimensionamento institucional por unidades operacionais e reserva técnica para o lote.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'lot',
          targetId: 'l1',
          problemDescription: 'Dimensionamento institucional por unidades operacionais e reserva técnica para o lote.',
          expectedOutcome: 'Lote dimensionado e entregue com rastreabilidade da necessidade.',
        },
      ],
      calculationMemories: [
        {
          calculationType: 'INSTITUTIONAL_SIZING',
          targetType: 'LOT',
          targetId: 'l1',
          parameters: [{ name: 'operationalUnits', value: 5 }, { name: 'technicalReserve', value: 1 }],
          formula: 'operationalUnits * 2 + technicalReserve * 2',
          result: 12,
          justification: 'Dimensionamento institucional por unidades operacionais e reserva técnica para o lote.',
        },
      ],
      procurementStrategies: [
        { targetType: 'lot', targetId: 'l1', procurementModality: 'PREGAO', contractingJustification: 'Lote por pregão com dimensionamento institucional e reserva técnica.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(result.events.some((e) => e.code === 'CALCULATION_MEMORY_DETECTED'));
  });

  it('runCalculationMemoryMultipleTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_MULTIPLE',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [
        { id: 'i1', description: 'Papel', quantity: 600, unit: 'resma' },
        { id: 'i2', description: 'Computador', quantity: 5, unit: 'un' },
      ],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i1',
          administrativeNeed: 'Demanda baseada em consumo histórico mensal para cobertura anual.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemStatement: 'Dimensionamento institucional por postos de trabalho existentes.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemDescription: 'Demanda de papel baseada em consumo histórico mensal para cobertura anual.',
          expectedOutcome: 'Cobertura anual com rastreabilidade da necessidade de consumo.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemDescription: 'Dimensionamento institucional por postos de trabalho existentes.',
          expectedOutcome: 'Computadores alinhados ao dimensionamento institucional.',
        },
      ],
      calculationMemories: [
        {
          calculationType: 'CONSUMPTION',
          targetType: 'ITEM',
          targetId: 'i1',
          parameters: [{ name: 'monthlyAverage', value: 50 }],
          formula: 'monthlyAverage * 12',
          result: 600,
          justification: 'Consumo mensal médio vezes doze para cobertura anual completa.',
        },
        {
          calculationType: 'INSTITUTIONAL_SIZING',
          targetType: 'ITEM',
          targetId: 'i2',
          parameters: [{ name: 'workstations', value: 5 }],
          formula: 'workstations',
          result: 5,
          justification: 'Dimensionamento institucional por postos de trabalho existentes.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Papel por pregão com base em consumo histórico anual.' },
        { targetType: 'item', targetId: 'i2', procurementModality: 'PREGAO', contractingJustification: 'Computadores por pregão com dimensionamento institucional.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  const out = result.outputs[0];
  const md = (out?.metadata ?? {}) as Record<string, unknown>;
  const calcMd = md.calculationMemory as { calculationMemoryCount?: number } | undefined;
  assert.equal(calcMd?.calculationMemoryCount, 2);
  });

  it('runCalculationMemoryInvalidTargetTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_CALCULATION_MEMORY_INVALID_TARGET',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [{ id: 'i1', description: 'Item 1', quantity: 1, unit: 'un' }],
      calculationMemories: [
        {
          calculationType: 'CONSUMPTION',
          targetType: 'ITEM',
          targetId: 'i99',
          parameters: [{ name: 'monthlyAverage', value: 10 }],
          formula: 'monthlyAverage * 12',
          result: 120,
          justification: 'Memória que referencia item inexistente para teste de bloqueio.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Estratégia mínima para item i1 no teste de alvo inválido.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.halted, true);
  assert.ok(result.validations.some((v) => v.code === 'CALCULATION_MEMORY_TARGET_ITEM_NOT_FOUND'));
  assert.ok(result.events.some((e) => e.code === 'CALCULATION_MEMORY_INVALID'));
  });

  it('runAdministrativeJustificationAbsentNoBreakTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_ADMINISTRATIVE_JUSTIFICATION_ABSENT',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: { ...buildBaseValidPayload() },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.equal(result.halted, false);
  });

  it('runAdministrativeJustificationProcessTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_ADMINISTRATIVE_JUSTIFICATION_PROCESS',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      administrativeJustification: {
        targetType: 'process',
        problemStatement:
          'Necessidade de aquisição de bens para atendimento à demanda institucional com base em diagnóstico técnico e planejamento anual.',
        expectedOutcome:
          'Atendimento à demanda com rastreabilidade, conformidade administrativa e continuidade operacional do processo contratual.',
      },
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(result.events.some((e) => e.code === 'ADMINISTRATIVE_JUSTIFICATION_DETECTED'));
  const out = result.outputs[0];
  const md = (out?.metadata ?? {}) as Record<string, unknown>;
  const justMd = md.administrativeJustification as { totalJustifications?: number; processJustificationCount?: number } | undefined;
  assert.equal(justMd?.totalJustifications, 1);
  assert.equal(justMd?.processJustificationCount, 1);
  });

  it('runAdministrativeJustificationItemTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_ADMINISTRATIVE_JUSTIFICATION_ITEM',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [
        { id: 'i1', description: 'Notebook', quantity: 10, unit: 'un' },
        { id: 'i2', description: 'Monitor', quantity: 10, unit: 'un' },
      ],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i1',
          administrativeNeed: 'Atendimento à demanda de equipamentos para novos postos de trabalho com base em dimensionamento institucional.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          administrativeNeed: 'Um monitor por posto de trabalho para padronização do parque de equipamentos.',
        },
      ],
      administrativeNeeds: [
        {
          targetType: 'item',
          targetId: 'i1',
          problemDescription: 'Atendimento à demanda de equipamentos para novos postos de trabalho.',
          expectedOutcome: 'Equipamentos entregues com rastreabilidade e conformidade.',
        },
        {
          targetType: 'item',
          targetId: 'i2',
          problemDescription: 'Um monitor por posto de trabalho para padronização do parque.',
          expectedOutcome: 'Parque de monitores padronizado e alinhado ao objeto.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Notebooks por pregão para novos postos de trabalho.' },
        { targetType: 'item', targetId: 'i2', procurementModality: 'PREGAO', contractingJustification: 'Monitores por pregão para padronização do parque.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.finalStatus, 'SUCCESS');
  assert.ok(result.events.some((e) => e.code === 'ADMINISTRATIVE_JUSTIFICATION_DETECTED'));
  const out = result.outputs[0];
  const md = (out?.metadata ?? {}) as Record<string, unknown>;
  const justMd = md.administrativeJustification as { itemJustificationCount?: number } | undefined;
  assert.equal(justMd?.itemJustificationCount, 2);
  });

  it('runAdministrativeJustificationInvalidTargetTest', async () => {
  const context: AdministrativeProcessContext = {
    processId: 'TEST_ADMINISTRATIVE_JUSTIFICATION_INVALID_TARGET',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
    phase: ProcessPhase.PLANNING as ProcessPhase,
    payload: {
      ...buildBaseValidPayload(),
      objectStructure: 'MULTIPLOS_ITENS',
      structureType: 'multiple_items',
      items: [{ id: 'i1', description: 'Item 1', quantity: 1, unit: 'un' }],
      administrativeJustifications: [
        {
          targetType: 'item',
          targetId: 'i99',
          administrativeNeed: 'Justificativa que referencia item inexistente para teste de bloqueio.',
        },
      ],
      procurementStrategies: [
        { targetType: 'item', targetId: 'i1', procurementModality: 'PREGAO', contractingJustification: 'Estratégia para item i1 no teste de justificativa com alvo inválido.' },
      ],
    },
    timestamp: new Date().toISOString(),
  };
  const result = await runAdministrativeProcess(context);
  assert.equal(result.halted, true);
  assert.ok(result.validations.some((v) => v.code === 'ADMINISTRATIVE_JUSTIFICATION_TARGET_ITEM_NOT_FOUND'));
  assert.ok(result.events.some((e) => e.code === 'ADMINISTRATIVE_JUSTIFICATION_INVALID'));
  });
});

