/**
 * Matriz Oficial de Responsabilidade Semântica do núcleo administrativo.
 * Blindagem semântica — Need × Justification × Strategy.
 */

import type {
  AdministrativeSemanticDomain,
  AdministrativeSemanticBoundaryRule,
} from './administrative-semantic-boundary.types';

/** Nomes de campos considerados de estratégia (não devem aparecer em need/justification). */
export const STRATEGY_FIELD_NAMES = [
  'procurementModality',
  'competitionStrategy',
  'divisionStrategy',
  'contractingApproach',
  'centralizationStrategy',
] as const;

/** Nomes de campos considerados de necessidade (não devem aparecer em strategy). */
export const NEED_FIELD_NAMES = [
  'problemDescription',
  'publicBenefit',
  'expectedOutcome',
  'administrativeNeed',
] as const;

/**
 * Matriz oficial de responsabilidade semântica.
 * Fonte única de verdade para documentação viva e validações de blindagem.
 */
export const ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES: AdministrativeSemanticBoundaryRule[] = [
  {
    domain: 'need',
    purpose:
      'Problema público, necessidade administrativa, benefício público e resultado esperado. Responde por que existe uma necessidade pública a ser atendida.',
    answersQuestion: 'Por que existe uma necessidade pública a ser atendida?',
    allowedConcepts: [
      'problemDescription',
      'administrativeNeed',
      'publicBenefit',
      'expectedOutcome',
      'context',
      'targetType',
      'targetId',
    ],
    forbiddenConcepts: [
      'procurementModality',
      'competitionStrategy',
      'divisionStrategy',
      'contractingApproach',
      'centralizationStrategy',
      'contractingJustification',
    ],
  },
  {
    domain: 'justification',
    purpose:
      'Vínculo administrativo entre necessidade e objeto; justificativa para existência do processo/item/lote; contexto administrativo da contratação.',
    answersQuestion: 'Por que este objeto/item/lote precisa existir nesta contratação?',
    allowedConcepts: [
      'problemStatement',
      'administrativeNeed',
      'expectedOutcome',
      'legalBasis',
      'context',
      'targetType',
      'targetId',
      'sourcePath',
      'extractedFrom',
    ],
    forbiddenConcepts: [
      'procurementModality',
      'competitionStrategy',
      'divisionStrategy',
      'contractingApproach',
      'centralizationStrategy',
      'contractingJustification',
    ],
  },
  {
    domain: 'strategy',
    purpose:
      'Forma de condução da contratação: modalidade, parcelamento, centralização, competição e base legal estratégica.',
    answersQuestion: 'Como a contratação será conduzida?',
    allowedConcepts: [
      'contractingApproach',
      'contractingJustification',
      'procurementModality',
      'divisionStrategy',
      'centralizationStrategy',
      'competitionStrategy',
      'legalBasis',
      'targetType',
      'targetId',
    ],
    forbiddenConcepts: [
      'problemDescription',
      'publicBenefit',
      'expectedOutcome',
      'administrativeNeed',
    ],
  },
];

/**
 * Retorna a regra oficial de fronteira semântica do domínio.
 */
export function getAdministrativeSemanticBoundary(
  domain: AdministrativeSemanticDomain
): AdministrativeSemanticBoundaryRule {
  const rule = ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES.find((r) => r.domain === domain);
  if (!rule) {
    throw new Error(`Unknown administrative semantic domain: ${domain}`);
  }
  return rule;
}

/**
 * Retorna a pergunta que o domínio responde (documentação viva).
 */
export function getAdministrativeSemanticQuestion(
  domain: AdministrativeSemanticDomain
): string {
  return getAdministrativeSemanticBoundary(domain).answersQuestion;
}
