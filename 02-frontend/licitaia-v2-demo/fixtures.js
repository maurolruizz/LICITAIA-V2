/**
 * FASE 39 — DECYON / LICITAIA V2
 * Fixtures dos cenários oficiais de demonstração (DEMO-D1 a DEMO-D4).
 *
 * Derivados diretamente dos cenários canônicos da Fase 37 (demo-catalog.ts)
 * e dos payloads da Fase 35 (canonical-scenarios.ts).
 *
 * Cada entrada contém:
 *   - metadados institucionais do cenário
 *   - request completo pronto para POST /api/process/run
 */

'use strict';

/* --------------------------------------------------------------------------
 * BASE PAYLOAD — espelha baseValidPayload() de canonical-scenarios.ts
 * -------------------------------------------------------------------------- */
var BASE_PAYLOAD = {
  legalRegime: 'LICITACAO',
  objectType: 'BEM_PERMANENTE',
  objectStructure: 'ITEM_UNICO',
  executionForm: 'ENTREGA_UNICA',

  // DFD
  demandDescription: 'Aquisição de notebooks para equipe de TI (bem permanente).',
  hiringJustification:
    'Necessidade de renovação do parque computacional para garantir continuidade do serviço.',
  administrativeObjective:
    'Garantir infraestrutura adequada para o time de desenvolvimento e suporte.',
  requestingDepartment: 'Diretoria de Tecnologia da Informação',
  requesterName: 'Gestor de Compras',
  requestDate: '2026-03-18T00:00:00.000Z',

  // ETP
  needDescription: 'Equipe precisa de máquinas modernas para desenvolvimento e suporte.',
  expectedResults: 'Aumento de produtividade e redução de falhas por obsolescência.',
  solutionSummary: 'Aquisição de notebooks com configuração mínima definida.',
  technicalJustification: 'Especificações técnicas definidas pelo time de arquitetura e suporte.',
  analysisDate: '2026-03-18T00:00:00.000Z',
  responsibleAnalyst: 'Analista de Planejamento de Contratações',

  // TR
  objectDescription: 'Aquisição de 10 notebooks para desenvolvimento de software.',
  contractingPurpose: 'Apoiar o desenvolvimento contínuo dos produtos digitais.',
  technicalRequirements:
    'Notebooks com 16GB RAM, SSD 512GB, processador recente, garantia de 36 meses.',
  executionConditions: 'Entrega única em até 30 dias.',
  acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
  referenceDate: '2026-03-18T00:00:00.000Z',
  responsibleAuthor: 'Responsável pelo Termo de Referência',

  // PRICING
  pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
  referenceItemsDescription: 'Notebooks com 16GB RAM, SSD 512GB.',
  estimatedUnitValue: 7500,
  estimatedTotalValue: 75000,
  pricingJustification: 'Pesquisa de mercado em três fornecedores distintos.',
  requestingDepartmentForPricing: 'Diretoria de Tecnologia da Informação',
  requestingDepartmentPricingAlias: 'Diretoria de TI',
};

/* --------------------------------------------------------------------------
 * DEMO-D1 — Licitação / Material de Consumo / Sucesso Completo
 * Espelha: S1_LICITACAO_MATERIAL_CONSUMO_ITEM_UNICO_ENTREGA_UNICA (PH35_S1)
 * -------------------------------------------------------------------------- */
var DEMO_D1_PAYLOAD = Object.assign({}, BASE_PAYLOAD, {
  legalRegime: 'LICITACAO',
  objectType: 'MATERIAL_CONSUMO',
  objectStructure: 'ITEM_UNICO',
  executionForm: 'ENTREGA_UNICA',
  demandDescription: 'Aquisição de material de consumo: 10 kits de cabos de rede categoria 6.',
  needDescription:
    'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente.',
  solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores.',
  objectDescription:
    'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
  referenceItemsDescription:
    'Kits de cabos de rede Cat6 com conectores (material de consumo).',
  technicalRequirements: 'Cabos Cat6 com conectores; atender padrões ANSI/TIA.',
  executionConditions: 'Entrega única em até 15 dias.',
  procurementStrategy: {
    targetType: 'process',
    procurementModality: 'PREGAO',
    competitionStrategy: 'OPEN_COMPETITION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification:
      'Licitação na modalidade pregão, visando competição ampla e seleção da proposta mais vantajosa.',
  },
  administrativeJustification: {
    targetType: 'process',
    problemStatement:
      'Necessidade de material de consumo para conectividade de rede interna.',
    administrativeNeed:
      'Garantir cabos Cat6 para manutenção e expansão do ambiente de rede.',
    expectedOutcome:
      'Conectividade estável e suporte às demandas operacionais do órgão.',
  },
});

/* --------------------------------------------------------------------------
 * DEMO-D2 — Inexigibilidade / Serviço Técnico Especializado / Sucesso Jurídico
 * Espelha: S3_INEXIGIBILIDADE_SERVICO_TECNICO_ESPECIALIZADO_ITEM_UNICO_EXECUCAO_POR_ETAPAS (PH35_S3)
 * -------------------------------------------------------------------------- */
var DEMO_D2_PAYLOAD = Object.assign({}, BASE_PAYLOAD, {
  legalRegime: 'INEXIGIBILIDADE',
  objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
  objectStructure: 'ITEM_UNICO',
  executionForm: 'EXECUCAO_POR_ETAPAS',
  objectDescription:
    'Contratação de serviço técnico especializado para auditoria de segurança e arquitetura do ambiente.',
  demandDescription:
    'Contratação de auditoria de segurança e arquitetura (serviço técnico especializado).',
  needDescription:
    'Necessidade de auditoria de segurança e arquitetura para mapear riscos e priorizar mitigação.',
  solutionSummary:
    'Execução de auditoria especializada com diagnóstico, relatório e validação por etapas.',
  referenceItemsDescription:
    'Serviço técnico especializado: auditoria de segurança e arquitetura (diagnóstico e relatório).',
  contractingPurpose:
    'Avaliar riscos, propor melhorias e emitir relatório técnico conclusivo para decisão administrativa.',
  executionConditions:
    'Execução por etapas: diagnóstico (15 dias), relatório (10 dias) e validação (5 dias).',
  procurementStrategy: {
    targetType: 'process',
    procurementModality: 'INEXIGIBILIDADE',
    competitionStrategy: 'DIRECT_SELECTION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification:
      'Inexigibilidade por notória especialização e singularidade do serviço, com justificativa técnica e administrativa.',
    legalBasis: 'Lei 14.133/2021 — inexigibilidade (serviço técnico especializado).',
  },
  administrativeJustification: {
    targetType: 'process',
    problemStatement:
      'Riscos de segurança e conformidade no ambiente exigem auditoria especializada e independente.',
    administrativeNeed:
      'Obter diagnóstico técnico detalhado e recomendações para plano de ação com base em evidências.',
    expectedOutcome:
      'Relatório auditável com matriz de riscos, prioridades e plano de mitigação por etapas.',
    legalBasis: 'Inexigibilidade — serviço técnico especializado (Lei 14.133/2021).',
  },
});

/* --------------------------------------------------------------------------
 * DEMO-D3 — Dispensa / Bem Permanente / Bloqueio Legítimo (Strategy×Structure mismatch)
 * Espelha: S4_DISPENSA_LOTE_ENTREGA_PARCELADA_BLOCK_MISMATCH_ESTRUTURA (PH35_S4)
 * -------------------------------------------------------------------------- */
var DEMO_D3_PAYLOAD = Object.assign({}, BASE_PAYLOAD, {
  legalRegime: 'DISPENSA',
  objectType: 'BEM_PERMANENTE',
  objectStructure: 'LOTE',
  executionForm: 'ENTREGA_PARCELADA',
  objectDescription:
    'Aquisição de bens permanentes (monitores) com entrega parcelada conforme cronograma.',
  demandDescription:
    'Aquisição de monitores (bens permanentes) com entrega parcelada em etapas.',
  needDescription:
    'Necessidade de monitores para expansão do parque de trabalho, com implantação por etapas.',
  solutionSummary:
    'Aquisição de monitores com entrega parcelada em 3 etapas, conforme cronograma.',
  referenceItemsDescription:
    'Monitores 24" e 27" (bens permanentes) para entrega parcelada por etapas.',
  executionConditions: 'Entrega parcelada em 3 etapas, conforme necessidade do órgão.',
  items: [
    { id: 'i1', description: 'Monitor 24"', quantity: 10, unit: 'un' },
    { id: 'i2', description: 'Monitor 27"', quantity: 5, unit: 'un' },
  ],
  procurementStrategy: {
    targetType: 'process',
    procurementModality: 'DISPENSA',
    competitionStrategy: 'DIRECT_SELECTION',
    divisionStrategy: 'LOTS',
    contractingJustification:
      'Dispensa com parcelamento em lotes por estratégia de aquisição (deliberadamente incoerente para testar trava).',
    legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
  },
  administrativeJustifications: [
    {
      targetType: 'item',
      targetId: 'i1',
      problemStatement: 'Expansão do parque exige monitores 24" em etapa 1.',
      administrativeNeed:
        'Aquisição de monitores 24" para estações de trabalho, com implantação faseada.',
      expectedOutcome: 'Implantação da etapa 1 sem interrupções e com padronização.',
      legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
    },
    {
      targetType: 'item',
      targetId: 'i2',
      problemStatement: 'Expansão do parque exige monitores 27" em etapa 2.',
      administrativeNeed:
        'Aquisição de monitores 27" para áreas críticas, com entrega na etapa 2.',
      expectedOutcome: 'Implantação da etapa 2 com continuidade operacional.',
      legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
    },
  ],
});

/* --------------------------------------------------------------------------
 * DEMO-D4 — Dispensa / Serviço Contínuo / Múltiplos Itens / Lacuna Parcial
 * Espelha: S2_DISPENSA_SERVICO_CONTINUO_MULTIPLOS_ITENS_EXECUCAO_CONTINUA (PH35_S2)
 * -------------------------------------------------------------------------- */
var DEMO_D4_PAYLOAD = Object.assign({}, BASE_PAYLOAD, {
  legalRegime: 'DISPENSA',
  objectType: 'SERVICO_CONTINUO',
  objectStructure: 'MULTIPLOS_ITENS',
  executionForm: 'EXECUCAO_CONTINUA',
  objectDescription:
    'Contratação de serviço contínuo de manutenção preventiva e corretiva de impressoras.',
  demandDescription:
    'Contratação de serviço contínuo de manutenção de impressoras (preventiva e corretiva).',
  needDescription:
    'Necessidade de manutenção preventiva e corretiva de impressoras para evitar indisponibilidade.',
  technicalJustification:
    'Especificações técnicas alinhadas à dispensa nos termos do art. 75 da Lei 14.133/2021 e à necessidade de continuidade operacional dos equipamentos.',
  solutionSummary:
    'Contratação de manutenção contínua com rotina preventiva e corretiva sob demanda.',
  hiringJustification:
    'Contratação por dispensa nos termos do art. 75 da Lei 14.133/2021, para manutenção continuada de equipamentos com necessidade institucional comprovada.',
  contractingPurpose:
    'Garantir continuidade do serviço de impressão com manutenção programada e corretiva, em contratação direta por dispensa nos termos do art. 75 da Lei 14.133/2021.',
  executionConditions: 'Execução contínua por 12 meses, com atendimento sob demanda.',
  pricingJustification:
    'Estimativa fundamentada na dispensa (art. 75 Lei 14.133/2021) e em pesquisa de mercado para serviços de manutenção de impressoras.',
  items: [
    { id: 'i1', description: 'Manutenção preventiva mensal', quantity: 12, unit: 'mês' },
    { id: 'i2', description: 'Manutenção corretiva sob demanda', quantity: 1, unit: 'serviço' },
  ],
  procurementStrategies: [
    {
      targetType: 'item',
      targetId: 'i1',
      procurementModality: 'DISPENSA',
      competitionStrategy: 'DIRECT_SELECTION',
      divisionStrategy: 'MULTIPLE_ITEMS',
      contractingJustification:
        'Contratação por dispensa nos termos do art. 75 da Lei 14.133/2021, para manutenção continuada com necessidade imediata.',
    },
    {
      targetType: 'item',
      targetId: 'i2',
      procurementModality: 'DISPENSA',
      competitionStrategy: 'DIRECT_SELECTION',
      divisionStrategy: 'MULTIPLE_ITEMS',
      contractingJustification:
        'Dispensa (art. 75 Lei 14.133/2021) para atendimento corretivo eventual, evitando paralisação de serviços.',
    },
  ],
  administrativeJustification: {
    targetType: 'item',
    targetId: 'i1',
    problemStatement:
      'Necessidade de manutenção preventiva para evitar indisponibilidade de impressoras.',
    administrativeNeed:
      'Executar rotinas mensais de manutenção preventiva em contrato anual.',
    expectedOutcome:
      'Reduzir falhas recorrentes e assegurar nível mínimo de disponibilidade durante 12 meses.',
    legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
  },
  administrativeJustifications: [
    {
      targetType: 'item',
      targetId: 'i2',
      problemStatement:
        'Necessidade de manutenção corretiva para evitar paralisações inesperadas.',
      administrativeNeed:
        'Atender ocorrências corretivas sob demanda, sem impacto operacional prolongado.',
      expectedOutcome:
        'Restabelecer funcionamento rapidamente, mantendo continuidade do serviço de impressão.',
      legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
    },
  ],
});

/* --------------------------------------------------------------------------
 * CATÁLOGO DE CENÁRIOS DE DEMONSTRAÇÃO
 * Estrutura espelha demo-catalog.ts da Fase 37.
 * -------------------------------------------------------------------------- */
var DEMO_SCENARIOS = [
  {
    demoId: 'DEMO-D1',
    demoTitle: 'Licitação — Material de Consumo — Item Único — Sucesso Completo',
    classification: 'SOLID_SUCCESS',
    classificationLabel: 'Sucesso Sólido',
    shortDesc:
      'Pipeline DFD→ETP→TR→PRICING executado integralmente. Pregão. Sem bloqueio. Caso mais frequente na administração pública.',
    whatItProves:
      'O motor DECYON é capaz de processar uma contratação administrativa padrão do início ao fim, ' +
      'validando todos os módulos (DFD, ETP, TR, PRICING, LEGAL, CROSS), ' +
      'produzindo resultado SUCCESS auditável e rastreável.',
    expectedHalt: false,
    expectedFinalStatus: 'SUCCESS',
    request: {
      processId: 'DEMO-D1',
      phase: 'PLANNING',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      correlationId: 'corr-demo-d1',
      payload: DEMO_D1_PAYLOAD,
    },
  },
  {
    demoId: 'DEMO-D2',
    demoTitle:
      'Inexigibilidade — Serviço Técnico Especializado — Execução por Etapas — Sucesso Jurídico',
    classification: 'SOLID_JURIDICAL',
    classificationLabel: 'Sofisticação Jurídica',
    shortDesc:
      'Inexigibilidade com notória especialização. O motor reconhece e valida o regime jurídico correto sem bloquear.',
    whatItProves:
      'A DECYON reconhece e valida contratações por inexigibilidade com fundamento legal explícito ' +
      '(Lei 14.133/2021), execução por etapas declaradas, e produz SUCCESS com trilha auditável — ' +
      'sem tratar inexigibilidade como suspeita.',
    expectedHalt: false,
    expectedFinalStatus: 'SUCCESS',
    request: {
      processId: 'DEMO-D2',
      phase: 'PLANNING',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      correlationId: 'corr-demo-d2',
      payload: DEMO_D2_PAYLOAD,
    },
  },
  {
    demoId: 'DEMO-D3',
    demoTitle:
      'Dispensa — Bem Permanente — LOTE declarado — Bloqueio Legítimo por Inconsistência',
    classification: 'LEGITIMATE_BLOCK',
    classificationLabel: 'Bloqueio Legítimo',
    shortDesc:
      'Estratégia LOTS incompatível com estrutura declarada. O motor para e emite código de bloqueio rastreável.',
    whatItProves:
      'A DECYON não deixa passar declaração normativa LOTE quando o payload só materializa múltiplos itens sem `lots`. ' +
      'O pré-voo de classificação emite CLASSIFICATION_PAYLOAD_MISMATCH (BLOCK) e HALTED_BY_VALIDATION antes do pipeline.',
    expectedHalt: true,
    expectedFinalStatus: 'HALTED_BY_VALIDATION',
    request: {
      processId: 'DEMO-D3',
      phase: 'PLANNING',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      correlationId: 'corr-demo-d3',
      payload: DEMO_D3_PAYLOAD,
    },
  },
  {
    demoId: 'DEMO-D4',
    demoTitle:
      'Dispensa — Serviço Contínuo — Múltiplos Itens — Pipeline completo (WARNING lexical TR×PRICING)',
    classification: 'SOLID_MULTI_ITEM',
    classificationLabel: 'Sucesso sólido (multi-itens)',
    shortDesc:
      'Multi-itens com dispensa. Pipeline completo; possível aviso lexical TR×PRICING sem bloquear o fluxo (ETAPA A).',
    whatItProves:
      'O motor executa DFD→ETP→TR→PRICING com múltiplos itens e dispensa. ' +
      'Overlap lexical insuficiente entre TR e PRICING gera WARNING (CROSS_MODULE_TR_PRICING_NO_OVERLAP), não BLOCK.',
    expectedHalt: false,
    expectedFinalStatus: 'SUCCESS',
    request: {
      processId: 'DEMO-D4',
      phase: 'PLANNING',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      correlationId: 'corr-demo-d4',
      payload: DEMO_D4_PAYLOAD,
    },
  },
];
