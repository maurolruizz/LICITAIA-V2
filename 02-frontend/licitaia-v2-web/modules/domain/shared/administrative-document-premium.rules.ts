import type { ModuleId } from '../../core/enums/module-id.enum';
import type { DocumentSectionType } from './administrative-document.types';
import type { PremiumDocumentKind } from './administrative-document-premium.types';

export interface PremiumSectionRule {
  order: number;
  sectionType: DocumentSectionType;
  title: string;
  subtitle: string;
  premiumRuleId: string;
}

type PremiumRuleSet = Record<DocumentSectionType, PremiumSectionRule>;

export const PREMIUM_CONTROLLED_WRITING_PROHIBITED_TERMS = [
  'talvez',
  'provavelmente',
  'pode ser',
  'supostamente',
  'aparentemente',
];

export const PREMIUM_REQUIRED_CROSS_COHERENCE_CHECKS: Record<PremiumDocumentKind, string[]> = {
  DFD: ['DFD_ETP_CLASSIFICATION_ALIGNMENT', 'DFD_ETP_NEED_ALIGNMENT', 'DFD_ETP_TR_COHERENCE'],
  ETP: ['DFD_ETP_CLASSIFICATION_ALIGNMENT', 'ETP_TR_OBJECT_ALIGNMENT', 'DFD_ETP_TR_COHERENCE'],
  TR: ['ETP_TR_OBJECT_ALIGNMENT', 'TR_PRICING_ALIGNMENT', 'DFD_ETP_TR_COHERENCE'],
};

export const PREMIUM_DOCUMENT_KIND_BY_MODULE: Partial<Record<ModuleId, PremiumDocumentKind>> = {
  DFD: 'DFD',
  ETP: 'ETP',
  TR: 'TR',
};

const DFD_PREMIUM_RULES: PremiumRuleSet = {
  IDENTIFICATION: {
    order: 1,
    sectionType: 'IDENTIFICATION',
    title: '1. Identificacao Processual',
    subtitle: 'Cabecalho institucional e classificacao oficial',
    premiumRuleId: 'DFD_PREMIUM_IDENTIFICACAO_PROCESSUAL',
  },
  NEED: {
    order: 2,
    sectionType: 'NEED',
    title: '2. Demanda Formalizada',
    subtitle: 'Contexto administrativo com lastro estrutural',
    premiumRuleId: 'DFD_PREMIUM_DEMANDA_FORMALIZADA',
  },
  STRUCTURE: {
    order: 3,
    sectionType: 'STRUCTURE',
    title: '3. Enquadramento Estrutural',
    subtitle: 'Quadro tecnico de estrutura do objeto',
    premiumRuleId: 'DFD_PREMIUM_ENQUADRAMENTO_ESTRUTURAL',
  },
  CALCULATION: {
    order: 4,
    sectionType: 'CALCULATION',
    title: '4. Memoria de Calculo Referencial',
    subtitle: 'Exibicao condicional conforme regra estrutural',
    premiumRuleId: 'DFD_PREMIUM_MEMORIA_CALCULO_REFERENCIAL',
  },
  JUSTIFICATION: {
    order: 5,
    sectionType: 'JUSTIFICATION',
    title: '5. Justificativa da Contratacao',
    subtitle: 'Texto institucional sob redacao controlada',
    premiumRuleId: 'DFD_PREMIUM_JUSTIFICATIVA_CONTRATACAO',
  },
  STRATEGY: {
    order: 6,
    sectionType: 'STRATEGY',
    title: '6. Estrategia de Contratacao',
    subtitle: 'Diretriz estrategica subordinada ao snapshot',
    premiumRuleId: 'DFD_PREMIUM_ESTRATEGIA_CONTRATACAO',
  },
  COHERENCE: {
    order: 7,
    sectionType: 'COHERENCE',
    title: '7. Coerencia e Rastreabilidade',
    subtitle: 'Evidencia objetiva de consistencia documental',
    premiumRuleId: 'DFD_PREMIUM_COERENCIA_RASTREAVEL',
  },
};

const ETP_PREMIUM_RULES: PremiumRuleSet = {
  IDENTIFICATION: {
    order: 1,
    sectionType: 'IDENTIFICATION',
    title: '1. Identificacao do Estudo',
    subtitle: 'Cabecalho institucional padronizado',
    premiumRuleId: 'ETP_PREMIUM_IDENTIFICACAO_ESTUDO',
  },
  NEED: {
    order: 2,
    sectionType: 'NEED',
    title: '2. Necessidade e Resultados Esperados',
    subtitle: 'Necessidade formal com resultado esperado rastreavel',
    premiumRuleId: 'ETP_PREMIUM_NECESSIDADE_E_RESULTADOS',
  },
  STRUCTURE: {
    order: 3,
    sectionType: 'STRUCTURE',
    title: '3. Enquadramento Estrutural',
    subtitle: 'Representacao tecnica da estrutura contratual',
    premiumRuleId: 'ETP_PREMIUM_ENQUADRAMENTO_ESTRUTURAL',
  },
  CALCULATION: {
    order: 4,
    sectionType: 'CALCULATION',
    title: '4. Memoria de Calculo',
    subtitle: 'Exibicao condicional conforme condicoes da ETAPA B',
    premiumRuleId: 'ETP_PREMIUM_MEMORIA_CALCULO',
  },
  JUSTIFICATION: {
    order: 5,
    sectionType: 'JUSTIFICATION',
    title: '5. Solucao e Justificativa Tecnica',
    subtitle: 'Justificativa tecnica sem alteracao semantica',
    premiumRuleId: 'ETP_PREMIUM_SOLUCAO_JUSTIFICATIVA_TECNICA',
  },
  STRATEGY: {
    order: 6,
    sectionType: 'STRATEGY',
    title: '6. Estrategia de Contratacao',
    subtitle: 'Diretriz estrategica validada no motor',
    premiumRuleId: 'ETP_PREMIUM_ESTRATEGIA_CONTRATACAO',
  },
  COHERENCE: {
    order: 7,
    sectionType: 'COHERENCE',
    title: '7. Coerencia e Rastreabilidade',
    subtitle: 'Estado de alinhamento interdocumental',
    premiumRuleId: 'ETP_PREMIUM_COERENCIA_RASTREAVEL',
  },
};

const TR_PREMIUM_RULES: PremiumRuleSet = {
  IDENTIFICATION: {
    order: 1,
    sectionType: 'IDENTIFICATION',
    title: '1. Identificacao do Termo',
    subtitle: 'Cabecalho institucional com classificadores oficiais',
    premiumRuleId: 'TR_PREMIUM_IDENTIFICACAO_TERMO',
  },
  NEED: {
    order: 2,
    sectionType: 'NEED',
    title: '2. Objeto e Finalidade',
    subtitle: 'Objeto contratual com aderencia a DFD e ETP',
    premiumRuleId: 'TR_PREMIUM_OBJETO_FINALIDADE',
  },
  STRUCTURE: {
    order: 3,
    sectionType: 'STRUCTURE',
    title: '3. Enquadramento Estrutural',
    subtitle: 'Estrutura tecnica consolidada para execucao',
    premiumRuleId: 'TR_PREMIUM_ENQUADRAMENTO_ESTRUTURAL',
  },
  CALCULATION: {
    order: 4,
    sectionType: 'CALCULATION',
    title: '4. Estimativa e Memoria de Calculo',
    subtitle: 'Sessao vinculada ao pricing quando aplicavel',
    premiumRuleId: 'TR_PREMIUM_ESTIMATIVA_MEMORIA_CALCULO',
  },
  JUSTIFICATION: {
    order: 5,
    sectionType: 'JUSTIFICATION',
    title: '5. Requisitos e Execucao',
    subtitle: 'Requisitos tecnicos em redacao controlada',
    premiumRuleId: 'TR_PREMIUM_REQUISITOS_EXECUCAO',
  },
  STRATEGY: {
    order: 6,
    sectionType: 'STRATEGY',
    title: '6. Estrategia de Contratacao',
    subtitle: 'Estrategia institucional coerente com estrutura',
    premiumRuleId: 'TR_PREMIUM_ESTRATEGIA_CONTRATACAO',
  },
  COHERENCE: {
    order: 7,
    sectionType: 'COHERENCE',
    title: '7. Coerencia e Rastreabilidade',
    subtitle: 'Evidencias de alinhamento DFD-ETP-TR-PRICING',
    premiumRuleId: 'TR_PREMIUM_COERENCIA_RASTREAVEL',
  },
};

export const PREMIUM_SECTION_RULES_BY_DOCUMENT: Record<PremiumDocumentKind, PremiumRuleSet> = {
  DFD: DFD_PREMIUM_RULES,
  ETP: ETP_PREMIUM_RULES,
  TR: TR_PREMIUM_RULES,
};
