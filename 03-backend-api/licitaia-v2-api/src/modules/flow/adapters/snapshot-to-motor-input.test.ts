import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotToMotorInput } from './snapshot-to-motor-input';
import type { OperationalStateContract } from './review-adapter.types';

function buildValidState(): OperationalStateContract {
  return {
    processId: 'FLOW-123',
    flowVersion: 'v1',
    // RISCO REGISTRADO: `_stepFieldsByStep` é dependência estrutural interna e frágil
    // caso o shape do snapshot do FlowController mude em versões futuras.
    _stepFieldsByStep: {
      CONTEXT: [
        { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'observacao' } },
      ],
      REGIME: [
        { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'LEI_14133' } },
        { fieldId: 'REG_PROCUREMENT_STRATEGY', value: { valueType: 'STRING', value: 'MENOR_PRECO' } },
      ],
      DFD: [
        { fieldId: 'DFD_OBJECT_TYPE', value: { valueType: 'STRING', value: 'SERVICO' } },
        { fieldId: 'DFD_OBJECT_STRUCTURE', value: { valueType: 'STRING', value: 'LOTES' } },
      ],
      ETP: [{ fieldId: 'ETP_STRATEGY_NOTE', value: { valueType: 'STRING', value: 'estrategia-etp' } }],
      TR: [{ fieldId: 'TR_TERMS_NOTE', value: { valueType: 'STRING', value: 'termos-tr' } }],
      PRICING: [{ fieldId: 'PRC_BASE_VALUE', value: { valueType: 'NUMBER', value: 123.45 } }],
    },
  };
}

test('estado válido -> retorna AdministrativeProcessContext correto', () => {
  const input = snapshotToMotorInput(buildValidState(), {
    processId: 'FLOW-123',
    tenantId: 'tenant-1',
    userId: 'user-1',
    correlationId: 'corr-1',
  });

  assert.equal(input.processId, 'FLOW-123');
  assert.equal(input.tenantId, 'tenant-1');
  assert.equal(input.userId, 'user-1');
  assert.equal(input.phase, 'PLANNING');
  assert.equal(input.correlationId, 'corr-1');
  assert.deepEqual(input.execution, { source: 'standard_execution' });

  assert.equal(input.payload['legalRegime'], 'LEI_14133');
  assert.equal(input.payload['objectType'], 'SERVICO');
  assert.equal(input.payload['objectStructure'], 'LOTES');
  assert.equal(input.payload['procurementStrategy'], 'MENOR_PRECO');
  assert.equal(input.payload['additionalNotes'], 'observacao');
  assert.equal(input.payload['solutionSummary'], 'estrategia-etp');
  assert.equal(input.payload['technicalRequirements'], 'termos-tr');
  assert.equal(input.payload['estimatedTotalValue'], 123.45);
});

test('processId divergente -> lança erro', () => {
  assert.throws(
    () =>
      snapshotToMotorInput(buildValidState(), {
        processId: 'FLOW-X',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    /FLOW_ADAPTER_PROCESS_ID_MISMATCH/,
  );
});

test('flowVersion inválida -> lança erro', () => {
  const state = buildValidState();
  state.flowVersion = 'v2';
  assert.throws(
    () =>
      snapshotToMotorInput(state, {
        processId: 'FLOW-123',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    /FLOW_ADAPTER_UNSUPPORTED_FLOW_VERSION/,
  );
});

test('ausência de _stepFieldsByStep -> lança erro', () => {
  const state: OperationalStateContract = {
    processId: 'FLOW-123',
    flowVersion: 'v1',
  };
  assert.throws(
    () =>
      snapshotToMotorInput(state, {
        processId: 'FLOW-123',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    /FLOW_ADAPTER_MISSING_STEP_FIELDS/,
  );
});

test('ausência de tenantId/userId/processId -> lança erro explícito', () => {
  const state = buildValidState();
  assert.throws(
    () =>
      snapshotToMotorInput(state, {
        processId: '',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    /FLOW_ADAPTER_INVALID_PROCESSID/,
  );
  assert.throws(
    () =>
      snapshotToMotorInput(state, {
        processId: 'FLOW-123',
        tenantId: '',
        userId: 'user-1',
      }),
    /FLOW_ADAPTER_INVALID_TENANTID/,
  );
  assert.throws(
    () =>
      snapshotToMotorInput(state, {
        processId: 'FLOW-123',
        tenantId: 'tenant-1',
        userId: '',
      }),
    /FLOW_ADAPTER_INVALID_USERID/,
  );
});

