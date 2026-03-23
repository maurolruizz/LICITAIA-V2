/**
 * FASE 37 — DECYON / LICITAIA V2
 * Catálogo oficial de cenários canônicos de demonstração institucional.
 *
 * Seleção: 4 cenários derivados da base validada nas Fases 35/36.
 * Critério: cobertura mínima e forte — sucesso simples, sofisticação jurídica,
 * bloqueio legítimo e estrutura multi-itens com lacuna parcial controlada.
 */

import { CANONICAL_SCENARIOS } from '../phase35/canonical-scenarios';
import type { CanonicalScenario } from '../phase35/canonical-scenarios';

export type DemoClassification =
  | 'SOLID_SUCCESS'
  | 'SOLID_JURIDICAL'
  | 'LEGITIMATE_BLOCK'
  | 'SOLID_MULTI_ITEM';

export interface DemoScenarioEntry {
  demoId: string;
  demoTitle: string;
  classification: DemoClassification;
  classificationLabel: string;
  whySelected: string;
  whatItProves: string;
  institutionalValue: string;
  scenario: CanonicalScenario;
}

const scenarioById = (id: string): CanonicalScenario => {
  const found = CANONICAL_SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Cenário canônico não encontrado: ${id}`);
  return found;
};

export const DEMO_CATALOG: DemoScenarioEntry[] = [
  {
    demoId: 'DEMO-D1',
    demoTitle: 'Licitação — Material de Consumo — Item Único — Sucesso Completo',
    classification: 'SOLID_SUCCESS',
    classificationLabel: 'Sucesso Sólido (pipeline completo sem halt)',
    whySelected:
      'Representa o caso mais comum na administração pública: aquisição simples por pregão. ' +
      'Pipeline DFD→ETP→TR→PRICING executado integralmente sem nenhum bloqueio. ' +
      'Base de comparação para qualquer avaliação institucional.',
    whatItProves:
      'O motor DECYON é capaz de processar uma contratação administrativa padrão do início ao fim, ' +
      'validando todos os módulos (DFD, ETP, TR, PRICING, LEGAL, CROSS), ' +
      'produzindo resultado SUCCESS auditável e rastreável.',
    institutionalValue:
      'Demonstra ao BrazilLAB e a gestores públicos que o motor funciona corretamente ' +
      'para o caso mais frequente, sem intervenção manual e de forma determinística.',
    scenario: scenarioById('S1_LICITACAO_MATERIAL_CONSUMO_ITEM_UNICO_ENTREGA_UNICA'),
  },
  {
    demoId: 'DEMO-D2',
    demoTitle: 'Inexigibilidade — Serviço Técnico Especializado — Execução por Etapas — Sucesso Jurídico',
    classification: 'SOLID_JURIDICAL',
    classificationLabel: 'Sucesso Sólido com Sofisticação Jurídica',
    whySelected:
      'Inexigibilidade de licitação é o regime juridicamente mais exigente: requer justificativa ' +
      'de notória especialização, singularidade e impossibilidade de competição. ' +
      'Valida que o motor distingue regimes jurídicos diferentes e aceita esse caso como válido.',
    whatItProves:
      'A DECYON reconhece e valida contratações por inexigibilidade com fundamento legal explícito ' +
      '(Lei 14.133/2021), execução por etapas declaradas, e produz SUCCESS com trilha auditável ' +
      'de cada módulo — sem tratar inexigibilidade como suspeita.',
    institutionalValue:
      'Demonstra maturidade jurídica do motor: não é um validador rígido que bloqueia ' +
      'tudo que foge de pregão. Reconhece regimes legais distintos e valida com coerência.',
    scenario: scenarioById('S3_INEXIGIBILIDADE_SERVICO_TECNICO_ESPECIALIZADO_ITEM_UNICO_EXECUCAO_POR_ETAPAS'),
  },
  {
    demoId: 'DEMO-D3',
    demoTitle: 'Dispensa — Bem Permanente — LOTE declarado — Bloqueio por pré-voo de classificação',
    classification: 'LEGITIMATE_BLOCK',
    classificationLabel: 'Bloqueio Legítimo (classificação × estrutura derivada)',
    whySelected:
      'Caso onde objectStructure declara LOTE, mas o payload materializa apenas `items` (derivado = multiple_items). ' +
      'O pré-voo ETAPA A bloqueia com CLASSIFICATION_PAYLOAD_MISMATCH antes do pipeline.',
    whatItProves:
      'A DECYON não admite fonte paralela de verdade estrutural: a declaração normativa deve bater com o que o extrator deriva. ' +
      'HALTED_BY_VALIDATION com código rastreável — protegendo o processo administrativo.',
    institutionalValue:
      'Este é o coração do valor da DECYON: bloqueio preventivo com explicação técnica. ' +
      'Demonstra que o sistema não é permissivo — ele para quando deve parar, ' +
      'com trilha auditável que protege o agente público.',
    scenario: scenarioById('S4_DISPENSA_LOTE_ENTREGA_PARCELADA_BLOCK_MISMATCH_ESTRUTURA'),
  },
  {
    demoId: 'DEMO-D4',
    demoTitle: 'Dispensa — Serviço Contínuo — Múltiplos Itens — Pipeline completo (WARNING lexical)',
    classification: 'SOLID_MULTI_ITEM',
    classificationLabel: 'Sucesso sólido (multi-itens; WARNING TR×PRICING quando aplicável)',
    whySelected:
      'Estrutura com múltiplos itens em regime de dispensa que percorre o pipeline completo. ' +
      'ETAPA A rebaixa overlap lexical TR×PRICING para WARNING, sem interromper o fluxo.',
    whatItProves:
      'O motor trata múltiplos itens corretamente: extrai, valida e conclui com SUCCESS. ' +
      'CROSS_MODULE_TR_PRICING_NO_OVERLAP pode aparecer como aviso auditável, não como BLOCK.',
    institutionalValue:
      'Demonstra política normativa fechada: apenas inconsistências com regra associada bloqueiam; ' +
      'lacunas lexicais são sinalizadas sem parar o processo.',
    scenario: scenarioById('S2_DISPENSA_SERVICO_CONTINUO_MULTIPLOS_ITENS_EXECUCAO_CONTINUA'),
  },
];

export const DEMO_CATALOG_SUMMARY = {
  totalScenarios: DEMO_CATALOG.length,
  solidSuccess: DEMO_CATALOG.filter((d) => d.classification === 'SOLID_SUCCESS').length,
  solidJuridical: DEMO_CATALOG.filter((d) => d.classification === 'SOLID_JURIDICAL').length,
  legitimateBlock: DEMO_CATALOG.filter((d) => d.classification === 'LEGITIMATE_BLOCK').length,
  solidMultiItem: DEMO_CATALOG.filter((d) => d.classification === 'SOLID_MULTI_ITEM').length,
  solidCount: DEMO_CATALOG.filter((d) => d.scenario.normative.status === 'SOLID').length,
  partialCount: DEMO_CATALOG.filter((d) => d.scenario.normative.status === 'PARTIAL').length,
} as const;
