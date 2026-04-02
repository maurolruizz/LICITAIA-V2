import { randomUUID } from 'crypto';
const runtime = require('../../../runtime/frontend-core/orchestrator/flow-controller.js') as {
  FlowController: new (processId: string) => { getState: () => unknown };
};
const { FlowController } = runtime;
import { runInTransaction } from '../database/transaction';
import { insertLog } from '../audit/audit.repository';
import { create as createProcess, findById } from './process.repository';
import { createInitial, findByProcessId, insertRevision } from '../flow/flow-session.repository';
import {
  executeFlowAction,
  getPersistedFlowHistory,
  getPersistedFlowState,
  FlowOperationError,
} from '../flow/flow-session.service';
import type { FlowFieldUpdate } from '../flow/flow-session.types';

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function createProcessSession(params: {
  tenantId: string;
  userId: string;
  processId?: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const processId = params.processId && params.processId.trim() !== '' ? params.processId.trim() : `FLOW-${randomUUID()}`;

  return await runInTransaction(params.tenantId, async (client) => {
    const existingProcess = await findById(client, params.tenantId, processId);
    if (existingProcess) {
      const existingFlow = await findByProcessId(client, params.tenantId, processId);
      if (!existingFlow) {
        throw new FlowOperationError('FLOW_SESSION_NOT_FOUND');
      }
      return { process: existingProcess, flowSession: existingFlow };
    }

    const process = await createProcess(client, {
      id: processId,
      tenantId: params.tenantId,
      createdBy: params.userId,
    });

    const initialState = ensureObject(new FlowController(processId).getState());
    initialState['_schemaVersion'] = '1.0';
    const revision = typeof initialState['revision'] === 'number' ? initialState['revision'] : 1;
    const renderToken =
      typeof initialState['renderToken'] === 'string' ? initialState['renderToken'] : '';

    const flowSession = await createInitial(client, {
      tenantId: params.tenantId,
      processId,
      snapshot: initialState,
      revision,
      renderToken,
      actorUserId: params.userId,
    });

    await insertRevision(client, {
      tenantId: params.tenantId,
      flowSessionId: flowSession.id,
      processId,
      revision: flowSession.revision,
      renderToken: flowSession.renderToken,
      snapshot: flowSession.snapshot,
      action: 'CREATE_INITIAL_FLOW_SESSION',
      actorUserId: params.userId,
    });

    await insertLog(client, {
      tenantId: params.tenantId,
      userId: params.userId,
      action: 'PROCESS_CREATED',
      resourceType: 'process',
      resourceId: process.id,
      metadata: {
        event_type: 'PROCESS_CREATED',
        process_id: process.id,
        flow_session_id: flowSession.id,
        tenant_id: params.tenantId,
        user_id: params.userId,
        previous_revision: null,
        new_revision: flowSession.revision,
        action_type: 'CREATE_INITIAL_FLOW_SESSION',
        affected_module: 'FLOW_CONTROLLER',
        timestamp: flowSession.createdAt,
        payload: {
          render_token: flowSession.renderToken,
        },
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return { process, flowSession };
  });
}

export async function getProcessById(params: { tenantId: string; processId: string }) {
  return await runInTransaction(params.tenantId, async (client) => {
    const process = await findById(client, params.tenantId, params.processId);
    if (!process) return null;
    const flowSession = await getPersistedFlowState({
      tenantId: params.tenantId,
      processId: params.processId,
    });
    return { process, flowSession };
  });
}

export async function getProcessHistory(params: { tenantId: string; processId: string }) {
  return await getPersistedFlowHistory(params);
}

export async function executeProcessAction(params: {
  tenantId: string;
  userId: string;
  processId: string;
  action: string;
  guard: { expectedRevision: number; expectedRenderToken: string };
  updates: FlowFieldUpdate[];
  ipAddress: string | null;
  userAgent: string | null;
  correlationId?: string;
}) {
  const process = await runInTransaction(params.tenantId, async (client) =>
    findById(client, params.tenantId, params.processId),
  );
  if (!process) {
    throw new FlowOperationError('PROCESS_NOT_FOUND');
  }
  return await executeFlowAction(params);
}
