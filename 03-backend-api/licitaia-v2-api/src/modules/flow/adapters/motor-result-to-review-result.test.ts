import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { motorResultToReviewResult } from './motor-result-to-review-result';
import type { AdministrativeProcessResult } from '../../../dto/administrative-process.types';

function buildBaseResult(): AdministrativeProcessResult {
  return {
    success: true,
    status: 'success',
    finalStatus: 'SUCCESS',
    halted: false,
    events: [],
    metadata: {},
    validations: [
      { code: 'VAL_001', severity: 'block', field: 'x', details: { moduleId: 'DFD' } },
      { code: 'VAL_002', severity: 'warning' },
    ],
    executedModules: ['DFD', 'ETP'],
    haltedBy: undefined,
    haltedDetail: undefined,
    decisionMetadata: [],
    legalTrace: [],
    outputs: [],
    moduleOutputs: [],
    processSnapshot: {},
  };
}

test('finalStatus válido -> mapeia corretamente', () => {
  const mapped = motorResultToReviewResult(buildBaseResult());
  assert.equal(mapped.finalStatus, 'SUCCESS');
  assert.equal(mapped.phase, 'POST_REVIEW');
});

test('finalStatus inválido -> lança erro', () => {
  const input = buildBaseResult();
  input.finalStatus = 'INVALID_STATUS';
  assert.throws(() => motorResultToReviewResult(input), /FLOW_ADAPTER_INVALID_FINAL_STATUS/);
});

test('validations válidas -> mapeia corretamente', () => {
  const mapped = motorResultToReviewResult(buildBaseResult());
  assert.equal(mapped.validations.length, 2);
  assert.deepEqual(mapped.validations[0], {
    issueTrace: ['code:VAL_001', 'field:x', 'module:DFD'],
    severity: 'BLOCK',
  });
  assert.deepEqual(mapped.validations[1], {
    issueTrace: ['code:VAL_002'],
    severity: 'ERROR',
  });
});

test('validations inválidas -> lança erro', () => {
  const input = buildBaseResult() as unknown as Record<string, unknown>;
  input['validations'] = 'not-an-array';
  assert.throws(
    () => motorResultToReviewResult(input as unknown as AdministrativeProcessResult),
    /FLOW_ADAPTER_INVALID_VALIDATIONS/,
  );
});

test('executedModules válidos -> mapeia corretamente', () => {
  const mapped = motorResultToReviewResult(buildBaseResult());
  assert.deepEqual(mapped.executedModules, ['DFD', 'ETP']);
});

test('executedModules inválidos -> lança erro', () => {
  const input = buildBaseResult() as unknown as Record<string, unknown>;
  input['executedModules'] = null;
  assert.throws(
    () => motorResultToReviewResult(input as unknown as AdministrativeProcessResult),
    /FLOW_ADAPTER_INVALID_EXECUTED_MODULES/,
  );
});

test('haltedDetail válido -> mapeia corretamente', () => {
  const input = buildBaseResult();
  input.halted = true;
  input.haltedBy = 'TR';
  input.haltedDetail = {
    type: 'VALIDATION',
    origin: 'LEGAL_VALIDATION',
    code: 'LEGAL_001',
    message: 'bloqueio legal',
  } as unknown as Record<string, unknown>;

  const mapped = motorResultToReviewResult(input);
  assert.deepEqual(mapped.haltedDetail, {
    type: 'VALIDATION',
    origin: 'LEGAL_VALIDATION',
    motorOpaqueSegments: [
      'origin:LEGAL_VALIDATION',
      'type:VALIDATION',
      'haltedBy:TR',
      'code:LEGAL_001',
      'message:bloqueio legal',
    ],
    haltedByModuleToken: 'TR',
  });
});

test('haltedDetail inválido -> lança erro', () => {
  const input = buildBaseResult() as unknown as Record<string, unknown>;
  input['haltedDetail'] = { type: 'X', origin: 'Y' };
  assert.throws(
    () => motorResultToReviewResult(input as unknown as AdministrativeProcessResult),
    /FLOW_ADAPTER_INVALID_HALTED_DETAIL_TYPE/,
  );
});

test('crítico: adaptador não retorna reviewSnapshotHash e não calcula hash', () => {
  const mapped = motorResultToReviewResult(buildBaseResult()) as unknown as Record<string, unknown>;
  assert.equal('reviewSnapshotHash' in mapped, false);

  const source = readFileSync(join(__dirname, 'motor-result-to-review-result.ts'), 'utf8');
  assert.equal(source.includes('createHash('), false);
  assert.equal(source.includes('reviewSnapshotHash'), true); // deve existir apenas em comentário de política
});

