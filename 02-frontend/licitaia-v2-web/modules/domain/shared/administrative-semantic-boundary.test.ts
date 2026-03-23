/**
 * Testes da Matriz Oficial de Responsabilidade Semântica.
 * Blindagem semântica — Need × Justification × Strategy.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES,
  getAdministrativeSemanticBoundary,
  getAdministrativeSemanticQuestion,
  STRATEGY_FIELD_NAMES,
  NEED_FIELD_NAMES,
} from './administrative-semantic-boundary';

describe('AdministrativeSemanticBoundary', () => {
  it('matrix loaded (3 domains)', async () => {
  assert.equal(ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES.length, 3);
  const domains = ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES.map((r) => r.domain).sort();
  assert.deepEqual(domains, ['justification', 'need', 'strategy']);
  });

  it('domains correct (need, justification, strategy)', async () => {
  const need = getAdministrativeSemanticBoundary('need');
  assert.equal(need.domain, 'need');
  const just = getAdministrativeSemanticBoundary('justification');
  assert.equal(just.domain, 'justification');
  const strat = getAdministrativeSemanticBoundary('strategy');
  assert.equal(strat.domain, 'strategy');
  });

  it('questions correct (necessidade, objeto, conduzida)', async () => {
  assert.ok(
    getAdministrativeSemanticQuestion('need').toLowerCase().includes('necessidade'),
    'need question should mention necessidade'
  );
  assert.ok(
    getAdministrativeSemanticQuestion('justification').toLowerCase().includes('objeto') ||
      getAdministrativeSemanticQuestion('justification').toLowerCase().includes('existir'),
    'justification question should mention object/exist'
  );
  assert.ok(
    getAdministrativeSemanticQuestion('strategy').toLowerCase().includes('conduzida') ||
      getAdministrativeSemanticQuestion('strategy').toLowerCase().includes('como'),
    'strategy question should mention how/conduzida'
  );
  });

  it('allowed/forbidden coherent per domain', async () => {
  const need = getAdministrativeSemanticBoundary('need');
  assert.ok(need.allowedConcepts.includes('problemDescription'));
  assert.ok(need.allowedConcepts.includes('expectedOutcome'));
  assert.ok(need.forbiddenConcepts.includes('procurementModality'));
  assert.ok(need.forbiddenConcepts.includes('competitionStrategy'));

  const just = getAdministrativeSemanticBoundary('justification');
  assert.ok(just.allowedConcepts.includes('legalBasis'));
  assert.ok(just.forbiddenConcepts.includes('divisionStrategy'));

  const strat = getAdministrativeSemanticBoundary('strategy');
  assert.ok(strat.allowedConcepts.includes('procurementModality'));
  assert.ok(strat.forbiddenConcepts.includes('problemDescription'));
  assert.ok(strat.forbiddenConcepts.includes('publicBenefit'));
  });

  it('STRATEGY_FIELD_NAMES and NEED_FIELD_NAMES match rules', async () => {
  const needRule = getAdministrativeSemanticBoundary('need');
  for (const name of STRATEGY_FIELD_NAMES) {
    assert.ok(
      needRule.forbiddenConcepts.includes(name),
      `STRATEGY_FIELD_NAMES ${name} should be forbidden for need`
    );
  }
  const stratRule = getAdministrativeSemanticBoundary('strategy');
  for (const name of NEED_FIELD_NAMES) {
    assert.ok(
      stratRule.forbiddenConcepts.includes(name),
      `NEED_FIELD_NAMES ${name} should be forbidden for strategy`
    );
  }
  });

  it('unknown domain throws', async () => {
  assert.throws(
    () => getAdministrativeSemanticBoundary('unknown' as any),
    /Unknown administrative semantic domain/
  );
  });
});
