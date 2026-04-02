import test from 'node:test';
import assert from 'node:assert/strict';
import * as transaction from '../database/transaction';
import * as flowRepo from './flow-session.repository';
import * as auditRepo from '../audit/audit.repository';
import * as loader from '../../lib/frontend-core-loader';
import { executeFlowAction, FlowOperationError } from './flow-session.service';

const runtime = require('../../../runtime/frontend-core/orchestrator/flow-controller.js') as {
  FlowController: new (processId: string, seedState?: unknown) => { getState: () => unknown };
};

type SessionRecord = {
  id: string;
  tenantId: string;
  processId: string;
  snapshot: Record<string, unknown>;
  revision: number;
  renderToken: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type RepoState = {
  current: SessionRecord;
  updatedCalls: number;
  revisionCalls: number;
  auditCalls: Array<{ action: string; metadata: Record<string, unknown> | null }>;
  persistedSnapshot: Record<string, unknown> | null;
};

function buildReviewReadySnapshot(processId: string): Record<string, unknown> {
  const base = new runtime.FlowController(processId).getState() as Record<string, unknown>;
  base['currentStep'] = 'REVIEW';
  base['reviewResult'] = { phase: 'PRE_REVIEW' };
  // Recalcula derivados (incluindo renderToken) para manter guard sincronizado.
  return new runtime.FlowController(processId, base).getState() as Record<string, unknown>;
}

function buildSession(processId: string): SessionRecord {
  const snapshot = buildReviewReadySnapshot(processId);
  return {
    id: 'session-1',
    tenantId: 'tenant-1',
    processId,
    snapshot,
    revision: Number(snapshot['revision']),
    renderToken: String(snapshot['renderToken']),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-04-02T10:00:00.000Z',
  };
}

function setupHarness(engineImpl: (ctx: Record<string, unknown>) => Promise<Record<string, unknown>>) {
  const originals = {
    runInTransaction: (transaction as any).runInTransaction,
    findByProcessId: (flowRepo as any).findByProcessId,
    updateWithRevisionCheck: (flowRepo as any).updateWithRevisionCheck,
    insertRevision: (flowRepo as any).insertRevision,
    listRevisionsByProcessId: (flowRepo as any).listRevisionsByProcessId,
    insertLog: (auditRepo as any).insertLog,
    getRunAdministrativeProcess: (loader as any).getRunAdministrativeProcess,
  };

  const repo: RepoState = {
    current: buildSession('FLOW-TRIGGER-1'),
    updatedCalls: 0,
    revisionCalls: 0,
    auditCalls: [],
    persistedSnapshot: null,
  };

  (transaction as any).runInTransaction = async (_tenantId: string, cb: (client: unknown) => Promise<unknown>) =>
    await cb({ tx: true });

  (flowRepo as any).findByProcessId = async () => repo.current;
  (flowRepo as any).listRevisionsByProcessId = async () => [];
  (flowRepo as any).updateWithRevisionCheck = async (
    _client: unknown,
    data: {
      id: string;
      tenantId: string;
      snapshot: Record<string, unknown>;
      revision: number;
      renderToken: string;
    },
  ) => {
    repo.updatedCalls += 1;
    repo.persistedSnapshot = data.snapshot;
    repo.current = {
      ...repo.current,
      id: data.id,
      tenantId: data.tenantId,
      snapshot: data.snapshot,
      revision: data.revision,
      renderToken: data.renderToken,
      updatedAt: '2026-04-02T10:10:00.000Z',
    };
    return repo.current;
  };
  (flowRepo as any).insertRevision = async () => {
    repo.revisionCalls += 1;
    return {
      id: 'rev-1',
      tenantId: repo.current.tenantId,
      flowSessionId: repo.current.id,
      processId: repo.current.processId,
      revision: repo.current.revision,
      renderToken: repo.current.renderToken,
      snapshot: repo.current.snapshot,
      action: 'TRIGGER_REVIEW',
      actorUserId: 'user-1',
      createdAt: '2026-04-02T10:11:00.000Z',
    };
  };
  (auditRepo as any).insertLog = async (_client: unknown, data: Record<string, unknown>) => {
    repo.auditCalls.push({
      action: String(data['action']),
      metadata:
        data['metadata'] && typeof data['metadata'] === 'object'
          ? (data['metadata'] as Record<string, unknown>)
          : null,
    });
  };

  (loader as any).getRunAdministrativeProcess = () => engineImpl;

  return {
    repo,
    restore() {
      (transaction as any).runInTransaction = originals.runInTransaction;
      (flowRepo as any).findByProcessId = originals.findByProcessId;
      (flowRepo as any).updateWithRevisionCheck = originals.updateWithRevisionCheck;
      (flowRepo as any).insertRevision = originals.insertRevision;
      (flowRepo as any).listRevisionsByProcessId = originals.listRevisionsByProcessId;
      (auditRepo as any).insertLog = originals.insertLog;
      (loader as any).getRunAdministrativeProcess = originals.getRunAdministrativeProcess;
    },
  };
}

async function runTriggerReview(seed: SessionRecord) {
  return await executeFlowAction({
    tenantId: seed.tenantId,
    userId: 'user-1',
    processId: seed.processId,
    action: 'TRIGGER_REVIEW',
    guard: {
      expectedRevision: seed.revision,
      expectedRenderToken: seed.renderToken,
    },
    updates: [],
    ipAddress: '127.0.0.1',
    userAgent: 'node:test',
    correlationId: 'corr-test-1',
  });
}

test('CASO 1 — sucesso: persiste review com finalStatus SUCCESS e audit normal', async () => {
  const h = setupHarness(async () => ({
    success: true,
    status: 'success',
    finalStatus: 'SUCCESS',
    halted: false,
    events: [],
    metadata: {},
    validations: [],
    executedModules: ['DFD', 'ETP', 'TR', 'PRICING'],
  }));
  try {
    const state = await runTriggerReview(h.repo.current);
    const review = (state['reviewResult'] ?? null) as Record<string, unknown> | null;
    assert.ok(review);
    assert.equal(review?.['finalStatus'], 'SUCCESS');
    assert.ok(Array.isArray(review?.['executedModules']));
    assert.ok((review?.['executedModules'] as unknown[]).length > 0);

    assert.equal(h.repo.updatedCalls, 1, 'flow_sessions deve ser atualizado');
    assert.equal(h.repo.revisionCalls, 1, 'deve criar flow_session_revision');
    assert.equal(h.repo.auditCalls.some((a) => a.action === 'FLOW_ACTION_EXECUTED'), true);
    assert.equal(h.repo.auditCalls.some((a) => a.action === 'FLOW_REVIEW_ERROR'), false);
  } finally {
    h.restore();
  }
});

test('CASO 2 — falha normativa: HALTED_BY_VALIDATION com validations persistidas e audit normal', async () => {
  const h = setupHarness(async () => ({
    success: false,
    status: 'halted',
    finalStatus: 'HALTED_BY_VALIDATION',
    halted: true,
    haltedBy: 'DFD',
    haltedDetail: {
      type: 'VALIDATION',
      origin: 'LEGAL_VALIDATION',
      code: 'LEGAL_BLOCK_001',
      message: 'Bloqueio jurídico',
    },
    events: [],
    metadata: {},
    validations: [{ code: 'LEGAL_BLOCK_001', severity: 'block', field: 'legalRegime' }],
    executedModules: ['DFD'],
  }));
  try {
    const state = await runTriggerReview(h.repo.current);
    const review = (state['reviewResult'] ?? null) as Record<string, unknown> | null;
    assert.ok(review);
    assert.equal(review?.['finalStatus'], 'HALTED_BY_VALIDATION');
    assert.deepEqual(review?.['validations'], [
      { issueTrace: ['code:LEGAL_BLOCK_001', 'field:legalRegime'], severity: 'BLOCK' },
    ]);

    assert.equal(h.repo.updatedCalls, 1);
    assert.equal(h.repo.revisionCalls, 1);
    assert.equal(h.repo.auditCalls.some((a) => a.action === 'FLOW_ACTION_EXECUTED'), true);
    assert.equal(h.repo.auditCalls.some((a) => a.action === 'FLOW_REVIEW_ERROR'), false);
  } finally {
    h.restore();
  }
});

test('CASO 3 — erro técnico: lança FLOW_REVIEW_ERROR, sem persistência, com audit de erro e estado preservado', async () => {
  const h = setupHarness(async () => {
    throw new Error('engine unavailable');
  });
  const snapshotBefore = JSON.stringify(h.repo.current.snapshot);
  try {
    await assert.rejects(async () => await runTriggerReview(h.repo.current), (err: unknown) => {
      assert.equal((err as { code?: string }).code, 'FLOW_REVIEW_ERROR');
      return true;
    });

    assert.equal(h.repo.updatedCalls, 0, 'não deve atualizar flow_sessions');
    assert.equal(h.repo.revisionCalls, 0, 'não deve criar revisão');
    assert.equal(h.repo.auditCalls.some((a) => a.action === 'FLOW_REVIEW_ERROR'), true);
    assert.equal(JSON.stringify(h.repo.current.snapshot), snapshotBefore, 'estado anterior deve permanecer intacto');
  } finally {
    h.restore();
  }
});

test('CASO 4 — regressão: resultado depende do motor (sem SUCCESS hardcoded)', async () => {
  const h = setupHarness(async () => ({
    success: false,
    status: 'halted',
    finalStatus: 'HALTED_BY_MODULE',
    halted: true,
    haltedBy: 'TR',
    haltedDetail: {
      type: 'MODULE',
      origin: 'MODULE_SIGNAL',
      code: 'TR_SIGNAL',
      message: 'TR falhou',
    },
    events: [],
    metadata: {},
    validations: [{ code: 'TR_SIGNAL', severity: 'error', details: { moduleId: 'TR' } }],
    executedModules: ['DFD', 'ETP', 'TR'],
  }));
  try {
    const state = await runTriggerReview(h.repo.current);
    const review = (state['reviewResult'] ?? null) as Record<string, unknown> | null;
    assert.ok(review);
    assert.equal(review?.['finalStatus'], 'HALTED_BY_MODULE');
    assert.deepEqual(review?.['executedModules'], ['DFD', 'ETP', 'TR']);
    assert.notEqual(review?.['finalStatus'], 'SUCCESS');
  } finally {
    h.restore();
  }
});

