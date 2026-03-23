/**
 * Tipos da Matriz Oficial de Responsabilidade Semântica do núcleo administrativo.
 * Blindagem semântica — Need × Justification × Strategy.
 */

/** Domínios semânticos do núcleo administrativo. */
export type AdministrativeSemanticDomain = 'need' | 'justification' | 'strategy';

/**
 * Regra oficial de fronteira semântica de um domínio.
 * Define o que o domínio representa, a pergunta que responde e conceitos permitidos/proibidos.
 */
export interface AdministrativeSemanticBoundaryRule {
  domain: AdministrativeSemanticDomain;
  purpose: string;
  answersQuestion: string;
  allowedConcepts: string[];
  forbiddenConcepts: string[];
}
