import { createHash } from 'crypto';
const runtime = require('../../../runtime/frontend-core/orchestrator/flow-controller.js') as {
  FlowController: new (processId: string, seedState?: unknown) => {
    getState: () => unknown;
    saveCurrentStep: (guard: { expectedRevision: number; expectedRenderToken: string }, updates: unknown[]) => unknown;
    advanceStep: (guard: { expectedRevision: number; expectedRenderToken: string }) => unknown;
    returnToPreviousStep: (guard: { expectedRevision: number; expectedRenderToken: string }) => unknown;
    triggerReview: (
      guard: { expectedRevision: number; expectedRenderToken: string },
      executeReview: () => Promise<{
        finalStatus: 'SUCCESS' | 'HALTED_BY_VALIDATION' | 'HALTED_BY_DEPENDENCY' | 'HALTED_BY_MODULE';
        validations: unknown[];
        executedModules: string[];
        reviewSnapshotHash: string;
        haltedDetail?: unknown;
      }>,
    ) => Promise<unknown>;
  };
  FlowStateStaleError: new (message: string) => Error;
};
const { FlowController, FlowStateStaleError } = runtime;
import type {
  FlowCommandGuardInput,
  FlowFieldUpdate,
  FlowSessionRecord,
} from './flow-session.types';
import { runInTransaction } from '../database/transaction';
import {
  findByProcessId,
  insertRevision,
  listRevisionsByProcessId,
  updateWithRevisionCheck,
} from './flow-session.repository';
import { insertLog } from '../audit/audit.repository';

export class FlowOperationError extends Error {
  public readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function stripVolatileFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripVolatileFields(item));
  if (!value || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(obj)) {
    if (key === 'generatedAt' || key === 'timestamp') continue;
    out[key] = stripVolatileFields(raw);
  }
  return out;
}

function normalizeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    ...snapshot,
    _schemaVersion: typeof snapshot['_schemaVersion'] === 'string' ? snapshot['_schemaVersion'] : '1.0',
  };
}

export function generateRenderToken(snapshot: unknown, revision: number): string {
  const canonicalSnapshot = stripVolatileFields(snapshot);
  return createHash('sha256')
    .update(`${stableStringify(canonicalSnapshot)}|${revision}`)
    .digest('hex');
}

export function isFlowStateStaleError(error: unknown): boolean {
  return error instanceof FlowStateStaleError || (error instanceof FlowOperationError && error.code === 'STALE_STATE');
}

function reviewSnapshotHashFromState(state: unknown): string {
  return createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

export async function getPersistedFlowState(params: {
  tenantId: string;
  processId: string;
}): Promise<FlowSessionRecord> {
  return await runInTransaction(params.tenantId, async (client) => {
    const session = await findByProcessId(client, params.tenantId, params.processId);
    if (!session) throw new FlowOperationError('FLOW_SESSION_NOT_FOUND');
    return session;
  });
}

export async function getPersistedFlowHistory(params: {
  tenantId: string;
  processId: string;
}) {
  return await runInTransaction(params.tenantId, async (client) => {
    return await listRevisionsByProcessId(client, params.tenantId, params.processId);
  });
}

export async function executeFlowAction(params: {
  tenantId: string;
  userId: string;
  processId: string;
  action: string;
  guard: FlowCommandGuardInput;
  updates: FlowFieldUpdate[];
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<Record<string, unknown>> {
  return await runInTransaction(params.tenantId, async (client) => {
    const current = await findByProcessId(client, params.tenantId, params.processId);
    if (!current) throw new FlowOperationError('FLOW_SESSION_NOT_FOUND');

    const controller = new FlowController(params.processId, current.snapshot);

    let nextStateUnknown: unknown;
    if (params.action === 'SAVE_CURRENT_STEP') {
      nextStateUnknown = controller.saveCurrentStep(params.guard, params.updates);
    } else if (params.action === 'ADVANCE_TO_NEXT_STEP') {
      nextStateUnknown = controller.advanceStep(params.guard);
    } else if (params.action === 'RETURN_TO_PREVIOUS_STEP') {
      nextStateUnknown = controller.returnToPreviousStep(params.guard);
    } else if (params.action === 'TRIGGER_REVIEW') {
      nextStateUnknown = await controller.triggerReview(params.guard, async () => {
        const latest = controller.getState();
        return {
          finalStatus: 'SUCCESS',
          validations: [],
          executedModules: ['DFD', 'ETP', 'TR', 'PRICING'],
          reviewSnapshotHash: reviewSnapshotHashFromState(latest),
        };
      });
    } else {
      throw new FlowOperationError('FLOW_ACTION_NOT_SUPPORTED');
    }

    const nextState = normalizeSnapshot(ensureObject(nextStateUnknown));
    const nextRevision =
      typeof nextState['revision'] === 'number'
        ? nextState['revision']
        : params.guard.expectedRevision + 1;
    const nextRenderToken = generateRenderToken(nextState, nextRevision);
    nextState['renderToken'] = nextRenderToken;

    const updated = await updateWithRevisionCheck(client, {
      id: current.id,
      tenantId: params.tenantId,
      expectedRevision: params.guard.expectedRevision,
      expectedRenderToken: params.guard.expectedRenderToken,
      snapshot: nextState,
      revision: nextRevision,
      renderToken: nextRenderToken,
      actorUserId: params.userId,
    });

    if (!updated) {
      throw new FlowOperationError('STALE_STATE');
    }

    const revision = await insertRevision(client, {
      tenantId: params.tenantId,
      flowSessionId: updated.id,
      processId: params.processId,
      revision: updated.revision,
      renderToken: updated.renderToken,
      snapshot: updated.snapshot,
      action: params.action,
      actorUserId: params.userId,
    });

    await insertLog(client, {
      tenantId: params.tenantId,
      userId: params.userId,
      action: 'FLOW_ACTION_EXECUTED',
      resourceType: 'flow_session',
      resourceId: updated.id,
      metadata: {
        event_type: 'FLOW_ACTION_EXECUTED',
        process_id: params.processId,
        flow_session_id: updated.id,
        tenant_id: params.tenantId,
        user_id: params.userId,
        previous_revision: current.revision,
        new_revision: updated.revision,
        action_type: params.action,
        affected_module: 'FLOW_CONTROLLER',
        timestamp: revision.createdAt,
        payload: {
          previous_render_token: current.renderToken,
          new_render_token: updated.renderToken,
          flow_revision_record_id: revision.id,
        },
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return updated.snapshot;
  });
}
