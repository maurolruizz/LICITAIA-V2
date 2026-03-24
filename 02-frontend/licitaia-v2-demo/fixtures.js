/**
 * FASE 39 / ETAPA F — DECYON / LICITAIA V2
 * Fixtures dos cenários oficiais de demonstração (DEMO-D1 a DEMO-D5).
 *
 * Derivados diretamente dos cenários canônicos da Fase 37 (demo-catalog.ts)
 * e dos payloads da Fase 35 (canonical-scenarios.ts).
 *
 * Cada entrada contém:
 *   - metadados institucionais do cenário
 *   - request completo pronto para POST /api/process/run
 *
 * ══════════════════════════════════════════════════════════════════════
 * MATRIZ DE GOVERNANÇA — CENÁRIOS OFICIAIS ETAPA F
 * ══════════════════════════════════════════════════════════════════════
 *
 * Regra de governança: todo cenário oficial ETAPA F deve ter:
 *   1. identificador único (demoId)
 *   2. classificação esperada (classification)
 *   3. expectedHalt     — boolean: o motor deve parar?
 *   4. expectedFinalStatus — string: finalStatus esperado do motor
 *   5. payload coerente: todos os campos de justificativa alinhados
 *      ao regime jurídico (DISPENSA/INEXIGIBILIDADE exigem base legal)
 *   6. whatItProves: critério explícito de aceite da ETAPA F
 *
 * Regra anti-divergência: se o resultado real divergir da expectativa
 * declarada, a UI exibe alerta vermelho imediato (implementado em app.js).
 *
 * Resumo da matriz:
 *
 * | ID       | Regime        | Objeto               | ExpHalt | ExpStatus         |
 * |----------|---------------|----------------------|---------|-------------------|
 * | DEMO-D1  | LICITACAO     | MATERIAL_CONSUMO     | false   | SUCCESS           |
 * | DEMO-D2  | INEXIGIB.     | SERV_TEC_ESPEC.      | false   | SUCCESS           |
 * | DEMO-D3  | DISPENSA      | BEM_PERMANENTE/LOTE  | true    | HALTED_BY_VALID.  |
 * | DEMO-D4  | DISPENSA      | SERV_CONTINUO/MULTI  | false   | SUCCESS           |
 * | DEMO-D5  | LICITACAO     | MATERIAL_CONSUMO     | false   | SUCCESS           |
 *
 * Regra de cobertura mínima da ETAPA F:
 *   - D1: sucesso limpo (pipeline completo, sem warnings)
 *   - D2: sucesso jurídico (inexigibilidade com base legal explícita)
 *   - D3: bloqueio legítimo (mismatch estrutural)
 *   - D4: sucesso com warning não bloqueante (overlap lexical TR×PRICING)
 *   - D5: sucesso com memória de cálculo de consumo recorrente (cenário mais importante da ETAPA F)
 * ══════════════════════════════════════════════════════════════════════
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
  hiringJustification:
    'Necessidade de aquisição de cabos de rede Cat6 para manutenção e expansão da infraestrutura de conectividade da unidade.',
  administrativeObjective:
    'Garantir conectividade adequada de rede para suporte às demandas operacionais do órgão.',
  needDescription:
    'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente.',
  solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores.',
  technicalJustification:
    'Especificações técnicas de cabos Cat6 com conectores, compatíveis com os padrões ANSI/TIA vigentes, definidas pelo setor de infraestrutura de rede.',
  objectDescription:
    'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
  contractingPurpose:
    'Garantir conectividade adequada de rede e suporte às demandas operacionais do órgão por meio da aquisição de cabos de rede Cat6.',
  referenceItemsDescription:
    'Kits de cabos de rede Cat6 com conectores (material de consumo).',
  technicalRequirements: 'Cabos Cat6 com conectores; atender padrões ANSI/TIA.',
  executionConditions: 'Entrega única em até 15 dias.',
  pricingJustification:
    'Pesquisa de mercado em três fornecedores distintos para cabos de rede Cat6 com conectores, confirmando valor de referência compatível com os preços praticados no mercado.',
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
  // DFD — justificativa com base legal explícita (exigida por INEXIGIBILIDADE)
  hiringJustification:
    'Contratação por inexigibilidade de competição, nos termos da Lei 14.133/2021, em razão da notória especialização técnica exigida para auditoria de segurança e arquitetura — serviço de natureza singular que inviabiliza competição.',
  administrativeObjective:
    'Obter diagnóstico técnico de segurança e arquitetura de sistemas, com relatório auditável e plano de mitigação de riscos.',
  needDescription:
    'Necessidade de auditoria de segurança e arquitetura para mapear riscos e priorizar mitigação.',
  solutionSummary:
    'Execução de auditoria especializada com diagnóstico, relatório e validação por etapas.',
  // ETP — justificativa técnica com base legal explícita
  technicalJustification:
    'Especificações técnicas definidas para inexigibilidade: profissional de notória especialização em auditoria de segurança e arquitetura, com capacidade para diagnóstico técnico, relatório de riscos e validação por etapas, conforme Lei 14.133/2021.',
  referenceItemsDescription:
    'Serviço técnico especializado: auditoria de segurança e arquitetura (diagnóstico e relatório).',
  // TR — finalidade com base legal explícita e coerente com objeto
  contractingPurpose:
    'Contratar, por inexigibilidade (Lei 14.133/2021), serviço técnico especializado de auditoria de segurança e arquitetura, visando diagnóstico técnico, relatório de riscos e recomendações auditáveis para fundamentação da decisão administrativa.',
  executionConditions:
    'Execução por etapas: diagnóstico (15 dias), relatório (10 dias) e validação (5 dias).',
  // PRICING — justificativa com base legal explícita e coerente com itens de referência
  pricingJustification:
    'Estimativa de preços fundamentada em inexigibilidade (Lei 14.133/2021) e em pesquisa de mercado junto a especialistas em auditoria de segurança e arquitetura, com valores de referência compatíveis com o porte e complexidade técnica do serviço.',
  procurementStrategy: {
    targetType: 'process',
    procurementModality: 'INEXIGIBILIDADE',
    competitionStrategy: 'DIRECT_SELECTION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification:
      'Inexigibilidade por notória especialização e singularidade do serviço de auditoria de segurança, conforme Lei 14.133/2021, com justificativa técnica e administrativa.',
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
 *
 * NOTA ETAPA F: `referenceItemsDescription` (campo PRICING) herda do BASE_PAYLOAD
 * ('Notebooks com 16GB RAM, SSD 512GB.') de forma intencional — é o driver dos
 * 2 warnings não bloqueantes esperados:
 *   1. CROSS_MODULE_TR_PRICING_NO_OVERLAP (WARNING) — TR:objectDescription vs PRICING:referenceItemsDescription sem overlap
 *   2. LEGAL_OBJECT_JUSTIFICATION_INCONSISTENT no PRICING (WARNING) — referenceItemsDescription vs pricingJustification sem overlap
 * Ambos são WARNINGs; o cenário DEVE retornar SUCCESS.
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
 * DEMO-D5 — Licitação / Material de Consumo Recorrente / Memória de Cálculo / Sucesso Completo
 *
 * CENÁRIO MAIS IMPORTANTE DA ETAPA F — prova:
 *   1. Quantitativo derivado de consumo médio mensal (não arbitrário)
 *   2. Coerência total DFD → ETP → TR → PRICING
 *   3. Memória de cálculo explícita, auditável e rastreável
 *   4. Pricing derivado diretamente da memória de cálculo
 *   5. Ausência de arbitrariedade e de inconsistência entre módulos
 *
 * MEMÓRIA DE CÁLCULO — estrutura real do motor (calculation-memory.extractor.ts):
 *   calculationType: 'CONSUMPTION'
 *   parameters com hint params do validador: monthlyAverage, coveragePeriod, technicalMargin
 *   formula auditável: (monthlyAverage * coveragePeriod / 500) * (1 + technicalMargin)
 *   result: 264 resmas — derivado de:
 *     10.000 folhas/mês × 12 meses = 120.000 folhas
 *     120.000 ÷ 500 folhas/resma   = 240 resmas
 *     240 × (1 + 0,10) margem 10%  = 264 resmas
 *
 * IMPORTANTE: NÃO há array `items` no payload (ITEM_UNICO → single_item derivado sem items).
 *   Incluir `items` causaria CLASSIFICATION_PAYLOAD_MISMATCH (extractor derivaria multiple_items).
 *   O quantitativo está rastreado pela calculationMemory.result e pelos campos de descrição.
 * -------------------------------------------------------------------------- */
var DEMO_D5_PAYLOAD = Object.assign({}, BASE_PAYLOAD, {
  legalRegime: 'LICITACAO',
  objectType: 'MATERIAL_CONSUMO',
  objectStructure: 'ITEM_UNICO',
  executionForm: 'ENTREGA_UNICA',

  // ── DFD ──────────────────────────────────────────────────────────────────
  demandDescription:
    'Aquisição de papel sulfite A4 para atender ao consumo administrativo contínuo dos setores do órgão.',
  hiringJustification:
    'Contratação por licitação para aquisição de material de consumo recorrente (papel sulfite A4), ' +
    'com base no consumo médio mensal identificado nos setores administrativos, ' +
    'garantindo abastecimento contínuo pelo período de 12 meses, conforme Lei 14.133/2021.',
  administrativeObjective:
    'Assegurar disponibilidade contínua de material de expediente (papel sulfite A4) ' +
    'para atividades administrativas dos setores do órgão.',

  // ── ETP ──────────────────────────────────────────────────────────────────
  needDescription:
    'Necessidade de papel sulfite A4 para consumo administrativo dos setores, ' +
    'dimensionada com base no consumo médio mensal histórico identificado, com cobertura para 12 meses.',
  solutionSummary:
    'Aquisição de papel sulfite A4 75g/m², com quantitativo calculado a partir do consumo médio ' +
    'mensal e margem técnica de segurança de 10%, para cobertura anual.',
  technicalJustification:
    'Contratação por licitação de material de consumo recorrente (papel sulfite A4), ' +
    'dimensionada com base no consumo médio mensal dos setores administrativos e projeção para ' +
    '12 meses, garantindo abastecimento contínuo conforme Lei 14.133/2021.',
  expectedResults:
    'Garantia de abastecimento contínuo de papel sulfite A4 por 12 meses, ' +
    'sem risco de desabastecimento e com rastreabilidade do quantitativo adquirido.',

  // ── TR ───────────────────────────────────────────────────────────────────
  objectDescription:
    'Aquisição de 264 resmas de papel sulfite A4 75g/m², 500 folhas por resma, ' +
    'para atendimento do consumo administrativo por 12 meses.',
  contractingPurpose:
    'Atender à demanda contínua de material de expediente (papel sulfite A4), ' +
    'dimensionada com base no consumo médio mensal e projeção anual de 12 meses, ' +
    'garantindo continuidade das atividades administrativas conforme Lei 14.133/2021.',
  technicalRequirements:
    'Papel sulfite A4 75g/m², resma com 500 folhas, branco, formato A4 (210×297 mm), ' +
    'conforme especificações técnicas do setor administrativo.',
  executionConditions: 'Entrega única em até 30 dias após emissão da nota de empenho.',
  acceptanceCriteria:
    'Conformidade com especificações técnicas, laudo de recebimento e verificação de quantitativo.',

  // ── PRICING ───────────────────────────────────────────────────────────────
  // referenceItemsDescription e pricingJustification devem ter overlap léxico (evitar WARNING).
  referenceItemsDescription:
    'Papel sulfite A4 75g/m², resma com 500 folhas (264 resmas conforme memória de cálculo de consumo).',
  pricingSourceDescription:
    'Pesquisa de mercado em três fornecedores especializados em papel de escritório e material de expediente.',
  // 264 resmas × R$ 28,50/resma = R$ 7.524,00 (preço médio de mercado)
  estimatedUnitValue: 28.50,
  estimatedTotalValue: 7524.00,
  pricingJustification:
    'Estimativa de preços baseada em pesquisa de mercado para fornecimento de papel sulfite A4, ' +
    'considerando o quantitativo de 264 resmas derivado da memória de cálculo de consumo médio ' +
    'mensal para 12 meses, conforme Lei 14.133/2021.',

  // ── MEMÓRIA DE CÁLCULO — ESTRUTURA REAL DO MOTOR ─────────────────────────
  // Contrato: calculation-memory.types.ts / calculation-memory.extractor.ts
  // Parâmetros com hint params de CONSUMPTION_HINT_PARAMS (validator.ts):
  //   monthlyAverage, coveragePeriod, technicalMargin → hasAnyHintParam = true
  // Fórmula auditável: (monthlyAverage * coveragePeriod / 500) * (1 + technicalMargin)
  // Resultado verificável: (10000 * 12 / 500) * (1 + 0.10) = 240 * 1.10 = 264 resmas
  calculationMemory: {
    calculationType: 'CONSUMPTION',
    targetType: 'ITEM',
    targetId: 'item-papel-a4',
    parameters: [
      {
        name: 'monthlyAverage',
        value: 10000,
        unit: 'folhas/mês',
        description: 'Consumo médio mensal identificado nos setores administrativos',
      },
      {
        name: 'coveragePeriod',
        value: 12,
        unit: 'meses',
        description: 'Período de cobertura anual',
      },
      {
        name: 'technicalMargin',
        value: 0.10,
        unit: 'fração decimal',
        description: 'Margem técnica de segurança de 10%',
      },
    ],
    formula: '(monthlyAverage * coveragePeriod / 500) * (1 + technicalMargin)',
    result: 264,
    justification:
      'Quantitativo de 264 resmas calculado com base no consumo médio mensal de 10.000 folhas: ' +
      '10.000 × 12 meses = 120.000 folhas ÷ 500 folhas/resma = 240 resmas × (1 + 0,10) margem = 264 resmas. ' +
      'Método rastreável e auditável, sem arbitrariedade.',
  },

  // ── ESTRATÉGIA ────────────────────────────────────────────────────────────
  procurementStrategy: {
    targetType: 'process',
    procurementModality: 'PREGAO',
    competitionStrategy: 'OPEN_COMPETITION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification:
      'Licitação na modalidade pregão para aquisição de material de consumo recorrente ' +
      '(papel sulfite A4), visando competição ampla e seleção da proposta mais vantajosa.',
  },

  // ── JUSTIFICATIVA ADMINISTRATIVA ──────────────────────────────────────────
  // administrativeJustification (processo): coerência geral do processo
  // administrativeJustifications (item): OBRIGATÓRIO — referência cruzada com calculationMemory
  //   A engine requer que cada entrada de calculationMemory (targetType: ITEM, targetId: X)
  //   tenha correspondência em justificationItemIds (administrative-coherence.engine.ts, Rule 3).
  //   Para ITEM_UNICO sem items array: validItemIds.size = 0 → Rule 1 não dispara.
  administrativeJustification: {
    targetType: 'process',
    problemStatement:
      'Os setores administrativos dependem de papel sulfite A4 para manutenção das atividades ' +
      'rotineiras, com consumo médio mensal identificado e risco de desabastecimento sem ' +
      'aquisição programada.',
    administrativeNeed:
      'Aquisição de papel sulfite A4 para cobrir o consumo histórico mensal dos setores ' +
      'administrativos, com quantitativo calculado por memória de consumo e margem técnica.',
    expectedOutcome:
      'Disponibilidade contínua de papel sulfite A4 por 12 meses, garantindo continuidade ' +
      'das atividades administrativas sem interrupção por falta de material.',
  },
  // Justificativa de nível item — corresponde à calculationMemory.targetId: 'item-papel-a4'
  // targetType: 'item' popula justificationItemIds na engine → satisfaz Rule 3 (CALCULATION_WITHOUT_JUSTIFICATION)
  administrativeJustifications: [
    {
      targetType: 'item',
      targetId: 'item-papel-a4',
      problemStatement:
        'Consumo contínuo de papel sulfite A4 nos setores administrativos sem estoque suficiente ' +
        'para cobertura do período, com base em consumo histórico mensal identificado.',
      administrativeNeed:
        'Aquisição de papel sulfite A4 com quantitativo de 264 resmas derivado de memória de ' +
        'consumo histórico mensal (10.000 folhas/mês × 12 meses + 10% margem técnica), ' +
        'garantindo abastecimento sem risco de desabastecimento.',
      expectedOutcome:
        'Disponibilidade de papel sulfite A4 por 12 meses, com quantitativo auditável e rastreável.',
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
      'O motor DECYON processa uma contratação administrativa padrão do início ao fim, ' +
      'validando todos os módulos (DFD, ETP, TR, PRICING, LEGAL, CROSS) com coerência ' +
      'plena entre campos de objeto e justificativa. ' +
      'Produz SUCCESS auditável e rastreável, sem warnings jurídicos — ' +
      'demonstrando que o motor é calibrado e não emite alertas desnecessários ' +
      'quando o payload está estruturalmente coerente.',
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
      'sem tratar inexigibilidade como suspeita. ' +
      'Critério ETAPA F: SUCCESS sem bloqueio; quaisquer warnings devem ser não bloqueantes ' +
      'e semanticamente justificados pelo regime jurídico aplicável.',
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
      'O pré-voo de classificação emite CLASSIFICATION_PAYLOAD_MISMATCH (BLOCK) e HALTED_BY_VALIDATION antes do pipeline. ' +
      'Critério ETAPA F: halted=true, finalStatus=HALTED_BY_VALIDATION, ' +
      'código BLOCK visível com severidade e módulo de origem identificados.',
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
      'O campo referenceItemsDescription herdado do BASE_PAYLOAD gera 2 warnings não bloqueantes: ' +
      '(1) CROSS_MODULE_TR_PRICING_NO_OVERLAP — overlap lexical insuficiente entre TR e PRICING; ' +
      '(2) LEGAL_OBJECT_JUSTIFICATION_INCONSISTENT no PRICING — referenceItemsDescription sem coerência com pricingJustification. ' +
      'Ambos são WARNINGs (não BLOCKs). O pipeline conclui com SUCCESS. ' +
      'Critério ETAPA F: SUCCESS com apontamentos não bloqueantes claramente identificados — ' +
      'severidade WARNING visível, módulo de origem registrado por warning, ação recomendada exibida, ' +
      'framing explícito "sucesso com apontamentos (2)" na interface, sem ambiguidade.',
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
  // ── DEMO-D5 ── CENÁRIO MAIS IMPORTANTE DA ETAPA F ────────────────────────
  {
    demoId: 'DEMO-D5',
    demoTitle:
      'Licitação — Material de Consumo Recorrente — Memória de Cálculo — Sucesso Completo',
    classification: 'SOLID_CALCULATION',
    classificationLabel: 'Sucesso com Memória de Cálculo',
    shortDesc:
      'Quantitativo derivado de consumo médio mensal (10.000 folhas/mês × 12 meses + 10% margem = 264 resmas). ' +
      'Coerência total DFD→ETP→TR→PRICING. Sem arbitrariedade. Rastreabilidade completa.',
    whatItProves:
      'O sistema calcula quantitativos a partir de memória de consumo recorrente, ' +
      'garantindo coerência entre DFD, ETP, TR e PRICING, com rastreabilidade completa e ausência ' +
      'de arbitrariedade. ' +
      'Memória de cálculo explícita: 10.000 folhas/mês × 12 meses = 120.000 folhas ÷ 500 folhas/resma = 240 resmas × 1,10 margem = 264 resmas. ' +
      'Pricing derivado diretamente da memória: 264 resmas × R$ 28,50 = R$ 7.524,00. ' +
      'Critério ETAPA F: SUCCESS limpo, sem warnings jurídicos, com CALCULATION_MEMORY_DETECTED ' +
      'registrado, calculationMemoryCount = 1, coerência léxica DFD↔ETP↔TR↔PRICING confirmada.',
    expectedHalt: false,
    expectedFinalStatus: 'SUCCESS',
    request: {
      processId: 'DEMO-D5',
      phase: 'PLANNING',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      correlationId: 'corr-demo-d5',
      payload: DEMO_D5_PAYLOAD,
    },
  },
];
