import type { AdministrativeProcessContext } from '../dto/administrative-process.types';
import type { CoverageDimensions, CoverageMatrixRow, CoverageStatus } from './coverage-matrix';

export type ExpectedOutcome = {
  shouldHalt: boolean;
  expectedFinalStatus?: string;
  mustIncludeValidationCodes?: string[];
  mustNotIncludeValidationCodes?: string[];
};

export interface CanonicalScenario {
  id: string;
  name: string;
  dimensions: CoverageDimensions;
  whatIsTested: string;
  affectedModules: ('DFD' | 'ETP' | 'TR' | 'PRICING' | 'LEGAL_VALIDATION' | 'CROSS_VALIDATION')[];
  /**
   * EXPECTATIVA OBSERVADA:
   * representa o comportamento que o motor efetivamente apresenta hoje,
   * usado para validar execução determinística (sem "maquiar" a realidade).
   */
  expectedObserved: ExpectedOutcome;
  /**
   * STATUS NORMATIVO DE COBERTURA:
   * classifica se o cenário representa cobertura homologável (SOLID),
   * cobertura parcial (PARTIAL) ou lacuna (NOT_COVERED).
   */
  normative: { status: CoverageStatus; note: string };
  buildContext(): AdministrativeProcessContext;
}

const FIXED_NOW = '2026-03-18T00:00:00.000Z';

function baseValidPayload(): Record<string, unknown> {
  return {
    // DFD
    demandDescription: 'Aquisição de notebooks para equipe de TI (bem permanente).',
    hiringJustification:
      'Necessidade de renovação do parque computacional para garantir continuidade do serviço.',
    administrativeObjective:
      'Garantir infraestrutura adequada para o time de desenvolvimento e suporte.',
    requestingDepartment: 'Diretoria de Tecnologia da Informação',
    requesterName: 'Gestor de Compras',
    requestDate: FIXED_NOW,

    // ETP
    needDescription: 'Equipe precisa de máquinas modernas para desenvolvimento e suporte.',
    expectedResults: 'Aumento de produtividade e redução de falhas por obsolescência.',
    solutionSummary: 'Aquisição de notebooks com configuração mínima definida.',
    technicalJustification:
      'Especificações técnicas definidas pelo time de arquitetura e suporte.',
    analysisDate: FIXED_NOW,
    responsibleAnalyst: 'Analista de Planejamento de Contratações',

    // TR
    objectDescription: 'Aquisição de 10 notebooks para desenvolvimento de software.',
    contractingPurpose: 'Apoiar o desenvolvimento contínuo dos produtos digitais.',
    technicalRequirements:
      'Notebooks com 16GB RAM, SSD 512GB, processador recente, garantia de 36 meses.',
    executionConditions: 'Entrega única em até 30 dias.',
    acceptanceCriteria: 'Conformidade com requisitos técnicos e laudo de recebimento.',
    referenceDate: FIXED_NOW,
    responsibleAuthor: 'Responsável pelo Termo de Referência',

    // PRICING
    pricingSourceDescription: 'Pesquisa em três fornecedores especializados.',
    referenceItemsDescription: 'Notebooks com 16GB RAM, SSD 512GB.',
    estimatedUnitValue: 7500,
    estimatedTotalValue: 7500 * 10,
    pricingJustification: 'Pesquisa de mercado em três fornecedores distintos.',

    // Campos auxiliares de compatibilidade usados em módulos existentes
    requestingDepartmentForPricing: 'Diretoria de Tecnologia da Informação',
    requestingDepartmentPricingAlias: 'Diretoria de TI',

    // Classificadores normativos oficiais (ETAPA A — espelhados na API e no snapshot)
    legalRegime: 'LICITACAO',
    objectType: 'BEM_PERMANENTE',
    objectStructure: 'ITEM_UNICO',
    executionForm: 'ENTREGA_UNICA',
  };
}

function buildContext(processId: string, payload: Record<string, unknown>): AdministrativeProcessContext {
  return {
    processId,
    tenantId: 'tenant-phase35',
    userId: 'user-phase35',
    correlationId: `corr-${processId}`,
    phase: 'PLANNING',
    payload,
    timestamp: FIXED_NOW,
  };
}

export const CANONICAL_SCENARIOS: CanonicalScenario[] = [
  {
    id: 'S1_LICITACAO_MATERIAL_CONSUMO_ITEM_UNICO_ENTREGA_UNICA',
    name: 'Licitação + material de consumo + item único + entrega única (baseline de sucesso)',
    dimensions: {
      legalRegime: 'LICITACAO',
      objectType: 'MATERIAL_CONSUMO',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'ENTREGA_UNICA',
    },
    whatIsTested:
      'Pipeline completo com estratégia de licitação (pregão) e payload estrutural mínimo válido.',
    affectedModules: ['DFD', 'ETP', 'TR', 'PRICING', 'LEGAL_VALIDATION', 'CROSS_VALIDATION'],
    expectedObserved: {
      shouldHalt: false,
      expectedFinalStatus: 'SUCCESS',
    },
    normative: {
      status: 'SOLID',
      note: 'Pipeline completo executado (DFD→ETP→TR→PRICING) sem halt.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'LICITACAO',
        objectType: 'MATERIAL_CONSUMO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        // Alinha textos entre DFD/ETP/TR/PRICING para evitar bloqueios por validação cruzada (NO_OVERLAP).
        demandDescription: 'Aquisição de material de consumo: 10 kits de cabos de rede categoria 6.',
        needDescription: 'Necessidade de cabos de rede Cat6 para manutenção e expansão do ambiente.',
        solutionSummary: 'Aquisição de kits de cabos de rede Cat6 com conectores.',
        objectDescription: 'Aquisição de 10 kits de cabos de rede categoria 6 (material de consumo).',
        referenceItemsDescription: 'Kits de cabos de rede Cat6 com conectores (material de consumo).',
        contractingPurpose:
          'Garantir aquisição dos kits de cabos Cat6 para manutenção e expansão da rede interna, conforme termo de referência.',
        pricingJustification:
          'Pesquisa de mercado em três fornecedores distintos para kits de cabos Cat6 e conectores, conforme itens de referência.',
        hiringJustification:
          'Necessidade comprovada de cabos Cat6 para manutenção e expansão da rede interna, alinhada à demanda de material de consumo descrita.',
        technicalJustification:
          'Especificações técnicas de cabos Cat6 com conectores e padrões ANSI/TIA, alinhadas à necessidade de rede e à solução de kits descritos.',
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
          problemStatement: 'Necessidade de material de consumo para conectividade de rede interna.',
          administrativeNeed: 'Garantir cabos Cat6 para manutenção e expansão do ambiente de rede.',
          expectedOutcome: 'Conectividade estável e suporte às demandas operacionais do órgão.',
        },
      } as Record<string, unknown>;
      return buildContext('PH35_S1', payload);
    },
  },

  {
    id: 'S2_DISPENSA_SERVICO_CONTINUO_MULTIPLOS_ITENS_EXECUCAO_CONTINUA',
    name: 'Dispensa + serviço contínuo + múltiplos itens + execução contínua (pipeline completo; TR×PRICING coerentes)',
    dimensions: {
      legalRegime: 'DISPENSA',
      objectType: 'SERVICO_CONTINUO',
      objectStructure: 'MULTIPLOS_ITENS',
      executionForm: 'EXECUCAO_CONTINUA',
    },
    whatIsTested:
      'Contratação direta (dispensa) com estrutura em múltiplos itens e execução contínua declarada.',
    affectedModules: ['DFD', 'ETP', 'TR', 'PRICING', 'LEGAL_VALIDATION', 'CROSS_VALIDATION'],
    expectedObserved: {
      shouldHalt: false,
      expectedFinalStatus: 'SUCCESS',
    },
    normative: {
      status: 'SOLID',
      note:
        'Pipeline completo sob dispensa multi-item; descrições TR×PRICING alinhadas lexicalmente para coerência mínima obrigatória.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'DISPENSA',
        objectType: 'SERVICO_CONTINUO',
        objectStructure: 'MULTIPLOS_ITENS',
        executionForm: 'EXECUCAO_CONTINUA',
        hiringJustification:
          'Contratação por dispensa nos termos do art. 75 da Lei 14.133/2021, para manutenção continuada de equipamentos com necessidade institucional comprovada.',
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
        contractingPurpose:
          'Garantir continuidade do serviço de impressão com manutenção programada e corretiva, em contratação direta por dispensa nos termos do art. 75 da Lei 14.133/2021.',
        executionConditions: 'Execução contínua por 12 meses, com atendimento sob demanda.',
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
        pricingJustification:
          'Estimativa fundamentada na dispensa (art. 75 Lei 14.133/2021) e em pesquisa de mercado para serviços de manutenção de impressoras.',
        // TR×PRICING: manter termos em comum (impressoras / manutenção) para coerência estrutural mínima.
        referenceItemsDescription:
          'Manutenção preventiva e corretiva de impressoras: pesquisa de preços em três fornecedores para serviços correlatos ao termo de referência.',
        pricingSourceDescription:
          'Pesquisa em três fornecedores especializados em manutenção de equipamentos de impressão.',
        estimatedUnitValue: 1500,
        estimatedTotalValue: 1500 * 13,
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
      } as Record<string, unknown>;
      return buildContext('PH35_S2', payload);
    },
  },

  {
    id: 'S3_INEXIGIBILIDADE_SERVICO_TECNICO_ESPECIALIZADO_ITEM_UNICO_EXECUCAO_POR_ETAPAS',
    name: 'Inexigibilidade + serviço técnico especializado + item único + execução por etapas (sucesso com coerência jurídica mínima)',
    dimensions: {
      legalRegime: 'INEXIGIBILIDADE',
      objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'EXECUCAO_POR_ETAPAS',
    },
    whatIsTested:
      'Estratégia direta por inexigibilidade com justificativa robusta e execução por etapas.',
    affectedModules: ['TR', 'LEGAL_VALIDATION'],
    expectedObserved: {
      shouldHalt: false,
      expectedFinalStatus: 'SUCCESS',
    },
    normative: {
      status: 'SOLID',
      note: 'Pipeline completo executado sob INEXIGIBILIDADE, com execução por etapas no payload.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'INEXIGIBILIDADE',
        objectType: 'SERVICO_TECNICO_ESPECIALIZADO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'EXECUCAO_POR_ETAPAS',
        hiringJustification:
          'Contratação por inexigibilidade de licitação, com fundamento na Lei 14.133/2021, diante da notória especialização e singularidade do serviço técnico especializado.',
        objectDescription:
          'Contratação de serviço técnico especializado para auditoria de segurança e arquitetura do ambiente.',
        demandDescription:
          'Contratação de auditoria de segurança e arquitetura (serviço técnico especializado).',
        needDescription:
          'Necessidade de auditoria de segurança e arquitetura para mapear riscos e priorizar mitigação.',
        technicalJustification:
          'Fundamentação técnica da auditoria de segurança e arquitetura por inexigibilidade, com amparo na Lei 14.133/2021 e comprovação de notória especialização do serviço.',
        solutionSummary:
          'Execução de auditoria especializada com diagnóstico, relatório e validação por etapas.',
        referenceItemsDescription:
          'Serviço técnico especializado: auditoria de segurança e arquitetura (diagnóstico e relatório).',
        contractingPurpose:
          'Avaliar riscos, propor melhorias e emitir relatório técnico conclusivo para decisão administrativa, em contratação por inexigibilidade conforme Lei 14.133/2021.',
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
        pricingJustification:
          'Estimativa para contratação por inexigibilidade amparada na Lei 14.133/2021, com preços de mercado para serviço técnico especializado.',
      } as Record<string, unknown>;
      return buildContext('PH35_S3', payload);
    },
  },

  {
    id: 'S4_DISPENSA_LOTE_ENTREGA_PARCELADA_BLOCK_MISMATCH_ESTRUTURA',
    name: 'Dispensa + lote declarado + entrega parcelada (bloqueio por pré-voo: LOTE ≠ estrutura derivada)',
    dimensions: {
      legalRegime: 'DISPENSA',
      objectType: 'BEM_PERMANENTE',
      objectStructure: 'LOTE',
      executionForm: 'ENTREGA_PARCELADA',
    },
    whatIsTested:
      'Bloqueio real por inconsistência estrutural: estratégia em LOTS sem estrutura em lotes (engine documental Fase 28 → BLOCK).',
    affectedModules: ['DFD'],
    expectedObserved: {
      shouldHalt: true,
      expectedFinalStatus: 'HALTED_BY_VALIDATION',
      mustIncludeValidationCodes: ['CLASSIFICATION_PAYLOAD_MISMATCH'],
    },
    normative: {
      status: 'SOLID',
      note:
        'Trava ETAPA A: objectStructure LOTE incompatível com itens sem `lots` (derivado = multiple_items); pré-voo bloqueia antes do pipeline.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
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
          'Monitores 24\" e 27\" (bens permanentes) para entrega parcelada por etapas.',
        executionConditions: 'Entrega parcelada em 3 etapas, conforme necessidade do órgão.',
        // Estrutura NÃO é lote (multiple_items), mas estratégia força LOTS → mismatch com severidade BLOCK.
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
            problemStatement: 'Expansão do parque exige monitores 24\" em etapa 1.',
            administrativeNeed:
              'Aquisição de monitores 24\" para estações de trabalho, com implantação faseada.',
            expectedOutcome: 'Implantação da etapa 1 sem interrupções e com padronização.',
            legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
          },
          {
            targetType: 'item',
            targetId: 'i2',
            problemStatement: 'Expansão do parque exige monitores 27\" em etapa 2.',
            administrativeNeed:
              'Aquisição de monitores 27\" para áreas críticas, com entrega na etapa 2.',
            expectedOutcome: 'Implantação da etapa 2 com continuidade operacional.',
            legalBasis: 'art. 75 da Lei 14.133/2021 (dispensa).',
          },
        ],
      } as Record<string, unknown>;
      return buildContext('PH35_S4', payload);
    },
  },

  {
    id: 'S5_DISPENSA_SEM_BASE_LEGAL_WARNING',
    name: 'Dispensa com justificativa sem base legal explícita (bloqueio jurídico no DFD)',
    dimensions: {
      legalRegime: 'DISPENSA',
      objectType: 'SERVICO_COMUM',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'ENTREGA_UNICA',
    },
    whatIsTested:
      'Regime DISPENSA sem menção a base legal nas justificativas agregadas → regra jurídica ETAPA A emite BLOCK no DFD.',
    affectedModules: ['DFD', 'LEGAL_VALIDATION'],
    expectedObserved: {
      shouldHalt: true,
      expectedFinalStatus: 'HALTED_BY_VALIDATION',
      mustIncludeValidationCodes: ['REGIME_FUNDAMENTO_MINIMO_AUSENTE'],
    },
    normative: {
      status: 'SOLID',
      note:
        'Cobertura homologável: exigência de base legal para dispensa/inexigibilidade materializada como BLOCK rastreável.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'DISPENSA',
        objectType: 'SERVICO_COMUM',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'ENTREGA_UNICA',
        objectDescription: 'Contratação de serviço comum de limpeza pontual em ambiente administrativo.',
        demandDescription:
          'Contratação de serviço comum de limpeza pontual para ambiente administrativo.',
        needDescription:
          'Necessidade de limpeza pontual para preparar ambiente administrativo para evento.',
        solutionSummary:
          'Prestação pontual de serviço de limpeza em data programada (entrega única).',
        referenceItemsDescription:
          'Serviço de limpeza pontual em ambiente administrativo (entrega única).',
        contractingPurpose: 'Manter condições adequadas de higiene em áreas administrativas.',
        executionConditions: 'Entrega única (prestação pontual) em data programada.',
        hiringJustification:
          'Necessidade operacional de limpeza pontual em ambiente administrativo imediatamente antes do evento institucional, com escopo e local definidos.',
        technicalJustification:
          'Detalhamento técnico da limpeza pontual em ambiente administrativo, incluindo materiais e equipe, alinhado à necessidade e ao escopo do serviço.',
        pricingJustification:
          'Estimativa de mercado para serviço de limpeza pontual em ambiente administrativo conforme itens de referência.',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'DISPENSA',
          competitionStrategy: 'DIRECT_SELECTION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Contratação direta por dispensa para atendimento imediato da necessidade, com justificativa administrativa.',
        },
        // Justificativa sem mencionar base legal/termos esperados (dispensa/inexigibilidade) → WARNING no engine documental.
        administrativeJustification: {
          targetType: 'process',
          problemStatement: 'Necessidade de limpeza pontual para manter salubridade do ambiente.',
          administrativeNeed:
            'Realizar limpeza extraordinária antes de evento institucional, garantindo condições adequadas.',
          expectedOutcome:
            'Ambiente limpo e pronto para uso, sem comprometer a rotina administrativa.',
        },
      } as Record<string, unknown>;
      return buildContext('PH35_S5', payload);
    },
  },

  {
    id: 'S6_LICITACAO_OBRA_ENGENHARIA_ITEM_UNICO_EXECUCAO_POR_ETAPAS',
    name: 'Licitação + obra/engenharia + item único + execução por etapas (baseline de sucesso)',
    dimensions: {
      legalRegime: 'LICITACAO',
      objectType: 'OBRA_ENGENHARIA',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'EXECUCAO_POR_ETAPAS',
    },
    whatIsTested:
      'Cenário mínimo para obra/engenharia com execução por etapas, mantendo coerência textual entre módulos.',
    affectedModules: ['DFD', 'ETP', 'TR', 'PRICING', 'LEGAL_VALIDATION', 'CROSS_VALIDATION'],
    expectedObserved: {
      shouldHalt: false,
      expectedFinalStatus: 'SUCCESS',
    },
    normative: {
      status: 'SOLID',
      note: 'Cobre explicitamente OBRA_ENGENHARIA com pipeline completo.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'LICITACAO',
        objectType: 'OBRA_ENGENHARIA',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'EXECUCAO_POR_ETAPAS',
        demandDescription:
          'Contratação de obra/engenharia: reforma elétrica do prédio administrativo (adequação e segurança).',
        needDescription:
          'Necessidade de reforma elétrica para adequação às normas e redução de risco de incidentes.',
        solutionSummary:
          'Execução de obra de adequação elétrica por etapas (diagnóstico, execução e comissionamento).',
        objectDescription:
          'Execução de obra de reforma elétrica (engenharia) no prédio administrativo, por etapas.',
        referenceItemsDescription:
          'Serviço de engenharia: reforma elétrica por etapas (adequação, execução, testes e comissionamento).',
        technicalRequirements:
          'Execução conforme normas técnicas aplicáveis; emissão de ART; testes e comissionamento ao final.',
        executionConditions:
          'Execução por etapas com cronograma: (1) diagnóstico, (2) execução, (3) testes e comissionamento.',
        hiringJustification:
          'Necessidade de reforma elétrica do prédio administrativo para adequação normativa e segurança, conforme demanda de obra e engenharia.',
        technicalJustification:
          'Fundamentação técnica da obra de engenharia elétrica por etapas, com normas aplicáveis, ART e comissionamento ao final.',
        contractingPurpose:
          'Executar reforma elétrica do prédio administrativo por etapas com segurança, conformidade técnica e testes finais.',
        pricingJustification:
          'Estimativa de mercado para serviço de engenharia e reforma elétrica por etapas conforme itens de referência.',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'CONCORRENCIA',
          competitionStrategy: 'OPEN_COMPETITION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Licitação para contratação de obra/serviço de engenharia, com competição ampla.',
        },
        administrativeJustification: {
          targetType: 'process',
          problemStatement:
            'Instalação elétrica apresenta riscos e exige adequação para continuidade segura do funcionamento.',
          administrativeNeed:
            'Adequar instalação elétrica e garantir segurança operacional por meio de obra de engenharia.',
          expectedOutcome:
            'Redução de risco, conformidade técnica e operação segura após comissionamento por etapas.',
        },
      } as Record<string, unknown>;
      return buildContext('PH35_S6', payload);
    },
  },

  {
    id: 'S7_LICITACAO_LOCACAO_ITEM_UNICO_EXECUCAO_CONTINUA',
    name: 'Licitação + locação + item único + execução contínua (baseline de sucesso)',
    dimensions: {
      legalRegime: 'LICITACAO',
      objectType: 'LOCACAO',
      objectStructure: 'ITEM_UNICO',
      executionForm: 'EXECUCAO_CONTINUA',
    },
    whatIsTested:
      'Cenário mínimo para locação com execução contínua, mantendo coerência textual entre módulos.',
    affectedModules: ['DFD', 'ETP', 'TR', 'PRICING', 'LEGAL_VALIDATION', 'CROSS_VALIDATION'],
    expectedObserved: {
      shouldHalt: false,
      expectedFinalStatus: 'SUCCESS',
    },
    normative: {
      status: 'SOLID',
      note: 'Cobre explicitamente LOCACAO com pipeline completo.',
    },
    buildContext: () => {
      const payload = {
        ...baseValidPayload(),
        legalRegime: 'LICITACAO',
        objectType: 'LOCACAO',
        objectStructure: 'ITEM_UNICO',
        executionForm: 'EXECUCAO_CONTINUA',
        demandDescription:
          'Locação de equipamentos: locação de 20 impressoras para unidades administrativas (serviço contínuo).',
        needDescription:
          'Necessidade de locação de impressoras para garantir continuidade do serviço de impressão sem aquisição.',
        solutionSummary:
          'Locação contínua de impressoras com manutenção incluída e reposição quando necessário.',
        objectDescription:
          'Locação de 20 impressoras para unidades administrativas, com execução contínua e manutenção.',
        referenceItemsDescription:
          'Locação de impressoras com manutenção inclusa (execução contínua).',
        executionConditions:
          'Execução contínua por 12 meses, com manutenção e reposição conforme SLA.',
        hiringJustification:
          'Necessidade de locação contínua de impressoras para unidades administrativas com manutenção incluída, conforme demanda e escopo do objeto.',
        technicalJustification:
          'Fundamentação técnica da locação de impressoras com SLA de manutenção e execução contínua por 12 meses, alinhada à necessidade.',
        contractingPurpose:
          'Garantir impressão contínua nas unidades administrativas por meio de locação de impressoras com manutenção e reposição conforme SLA.',
        pricingJustification:
          'Estimativa de mercado para locação contínua de impressoras com manutenção conforme itens de referência.',
        procurementStrategy: {
          targetType: 'process',
          procurementModality: 'PREGAO',
          competitionStrategy: 'OPEN_COMPETITION',
          divisionStrategy: 'SINGLE_CONTRACT',
          contractingJustification:
            'Licitação na modalidade pregão para locação de equipamentos com competição ampla.',
        },
        administrativeJustification: {
          targetType: 'process',
          problemStatement:
            'Unidades administrativas precisam de impressão contínua; aquisição imediata não é a melhor alternativa.',
          administrativeNeed:
            'Garantir disponibilidade de impressoras por locação contínua com manutenção incluída.',
          expectedOutcome:
            'Serviço de impressão estável durante 12 meses, com suporte e reposição conforme SLA.',
        },
      } as Record<string, unknown>;
      return buildContext('PH35_S7', payload);
    },
  },
];

/**
 * MATRIZ NORMATIVA DERIVADA:
 * a fonte conceitual é `CANONICAL_SCENARIOS` (cada cenário define dimensões + status normativo).
 * Este artefato existe para consumo/relato auditável (runner, relatórios, tooling).
 */
export const DERIVED_COVERAGE_MATRIX_FROM_SCENARIOS: CoverageMatrixRow[] = CANONICAL_SCENARIOS.map((s) => ({
  scenarioId: s.id,
  scenarioName: s.name,
  dimensions: s.dimensions,
  coverageStatus: s.normative.status,
  note: s.normative.note,
}));

